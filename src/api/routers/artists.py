"""Artist detail and network endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from src.api.deps import DbConn
from src.api.schemas.artist import ArtistDetail, ArtistNetwork, NetworkEdge, NetworkNode

router = APIRouter(prefix="/artists", tags=["artists"])

# Module-level cache — recomputed only on server restart / pipeline rerun
_global_network_cache: dict | None = None


def invalidate_network_cache() -> None:
    """Call after pipeline rerun to clear cached SNA result."""
    global _global_network_cache
    _global_network_cache = None


@router.get("", tags=["artists"])
def list_artists(
    limit: int = 200,
    db: DbConn = DbConn,
) -> dict:
    """Return top artists by popularity score (for dropdowns)."""
    rows = db.execute(
        "SELECT artist_id, name, array_to_string(genres, ','), popularity_score "
        "FROM artists ORDER BY popularity_score DESC LIMIT ?",
        [limit],
    ).fetchall()
    return {
        "artists": [
            {"artist_id": r[0], "name": r[1],
             "genre": r[2].split(",")[0] if r[2] else None,
             "popularity_score": r[3] or 0.0}
            for r in rows
        ]
    }


@router.get("/global-network")
def global_network(limit: int = 150, db: DbConn = DbConn) -> dict:
    """Global artist co-listen network with full SNA metrics (cached)."""
    global _global_network_cache
    if _global_network_cache is not None:
        return _global_network_cache

    import networkx as nx
    import numpy as np

    top_ids = [
        r[0]
        for r in db.execute(
            "SELECT a.artist_id FROM artists a JOIN tracks t USING(artist_id) "
            "GROUP BY a.artist_id ORDER BY SUM(t.play_count) DESC LIMIT ?",
            [limit],
        ).fetchall()
    ]

    if not top_ids:
        return {"nodes": [], "edges": [], "stats": {}, "communities": []}

    ph = ", ".join(["?"] * len(top_ids))
    raw_edges = db.execute(
        f"SELECT source_artist_id, target_artist_id, weight FROM artist_graph_edges "
        f"WHERE source_artist_id IN ({ph}) AND target_artist_id IN ({ph})",
        top_ids + top_ids,
    ).fetchall()

    if not raw_edges:
        return {"nodes": [], "edges": [], "stats": {}, "communities": []}

    weights = [float(e[2]) for e in raw_edges]
    threshold = float(np.mean(weights) + 0.5 * np.std(weights))
    sig_edges = [(s, t, float(w)) for s, t, w in raw_edges if float(w) >= threshold]

    G: nx.Graph = nx.Graph()
    for s, t, w in sig_edges:
        G.add_edge(s, t, weight=w)

    if len(G) == 0:
        return {"nodes": [], "edges": [], "stats": {}, "communities": []}

    degree_c = nx.degree_centrality(G)
    between_c = nx.betweenness_centrality(G, normalized=True, k=min(50, len(G)), seed=42)
    clustering_c = nx.clustering(G, weight="weight")
    communities = list(nx.community.louvain_communities(G, seed=42))
    community_map = {node: i for i, comm in enumerate(communities) for node in comm}

    artist_meta = {
        r[0]: (r[1], r[2] or "", float(r[3] or 0))
        for r in db.execute(
            "SELECT artist_id, name, array_to_string(genres, ','), popularity_score FROM artists"
        ).fetchall()
    }

    nodes = []
    for aid in G.nodes():
        name, genres_str, pop = artist_meta.get(aid, (aid, "", 0.0))
        genre = genres_str.split(",")[0].strip() if genres_str else None
        nodes.append(
            {
                "id": aid,
                "name": name,
                "genre": genre,
                "popularity": pop,
                "degree_centrality": round(degree_c.get(aid, 0), 4),
                "betweenness": round(between_c.get(aid, 0), 4),
                "clustering": round(clustering_c.get(aid, 0), 4),
                "community_id": community_map.get(aid, 0),
            }
        )

    network_edges = [
        {"source": s, "target": t, "weight": w}
        for s, t, w in sig_edges
        if s in G and t in G
    ]
    top_hubs = sorted(nodes, key=lambda x: x["betweenness"], reverse=True)[:5]
    communities_summary = [
        {
            "id": i,
            "size": len(comm),
            "top_artist": artist_meta.get(
                max(comm, key=lambda a: between_c.get(a, 0)), ("?", "", 0.0)
            )[0],
        }
        for i, comm in enumerate(communities)
    ]

    result = {
        "nodes": nodes,
        "edges": network_edges,
        "stats": {
            "n_nodes": len(G),
            "n_edges": len(network_edges),
            "n_communities": len(communities),
            "avg_clustering": round(nx.average_clustering(G), 3),
            "avg_degree": round(sum(d for _, d in G.degree()) / max(len(G), 1), 1),
            "threshold": round(threshold, 1),
            "top_hubs": top_hubs,
        },
        "communities": communities_summary,
    }
    _global_network_cache = result
    return result


@router.get("/{artist_id}", response_model=ArtistDetail)
def get_artist(artist_id: str, db: DbConn = DbConn) -> ArtistDetail:
    """Get artist profile with top tracks."""
    row = db.execute(
        "SELECT artist_id, name, country, "
        "       array_to_string(genres, ',') AS genres, "
        "       array_to_string(tags, ',') AS tags, "
        "       popularity_score, follower_count, active_since "
        "FROM artists WHERE artist_id = ?",
        [artist_id],
    ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail=f"Artist '{artist_id}' not found")

    top_tracks = db.execute(
        "SELECT track_id FROM tracks WHERE artist_id = ? ORDER BY play_count DESC LIMIT 10",
        [artist_id],
    ).fetchall()

    return ArtistDetail(
        artist_id=row[0],
        name=row[1],
        country=row[2],
        genres=[g.strip() for g in (row[3] or "").split(",") if g.strip()],
        tags=[t.strip() for t in (row[4] or "").split(",") if t.strip()],
        popularity_score=row[5] or 0.0,
        follower_count=row[6] or 0,
        active_since=row[7],
        top_tracks=[r[0] for r in top_tracks],
    )


@router.get("/{artist_id}/network", response_model=ArtistNetwork)
def artist_network(
    artist_id: str,
    depth: int = 1,
    db: DbConn = DbConn,
) -> ArtistNetwork:
    """Return ego-graph of artist co-listen relationships (up to 2 hops)."""
    artist_row = db.execute(
        "SELECT name, array_to_string(genres, ','), popularity_score "
        "FROM artists WHERE artist_id = ?",
        [artist_id],
    ).fetchone()

    if not artist_row:
        raise HTTPException(status_code=404, detail=f"Artist '{artist_id}' not found")

    edge_rows = db.execute(
        "SELECT source_artist_id, target_artist_id, weight, relation_type "
        "FROM artist_graph_edges "
        "WHERE source_artist_id = ? OR target_artist_id = ? LIMIT 50",
        [artist_id, artist_id],
    ).fetchall()

    neighbor_ids = set()
    edges = []
    for src, tgt, w, rtype in edge_rows:
        edges.append(NetworkEdge(source=src, target=tgt, weight=w, relation_type=rtype))
        neighbor_ids.update([src, tgt])
    neighbor_ids.discard(artist_id)

    all_ids = [artist_id] + list(neighbor_ids)
    placeholders = ", ".join(["?"] * len(all_ids))
    node_rows = db.execute(
        f"SELECT artist_id, name, array_to_string(genres, ','), popularity_score "
        f"FROM artists WHERE artist_id IN ({placeholders})",
        all_ids,
    ).fetchall()

    nodes = [
        NetworkNode(
            id=r[0],
            name=r[1],
            genre=r[2].split(",")[0] if r[2] else None,
            popularity=r[3] or 0.0,
        )
        for r in node_rows
    ]

    return ArtistNetwork(artist_id=artist_id, nodes=nodes, edges=edges)
