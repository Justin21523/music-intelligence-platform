"""Analytics endpoints for portfolio demonstrations."""

from __future__ import annotations

import math
from typing import Any

from fastapi import APIRouter, Query, Request

from src.api.deps import DbConn

router = APIRouter(prefix="/analysis", tags=["analysis"])

ANALYSIS_MODELS = ["popularity", "als", "content", "hybrid"]


def _safe_float(v: Any, default: float = 0.0) -> float:
    try:
        return float(v) if v is not None else default
    except (TypeError, ValueError):
        return default


def _clamp01(v: float) -> float:
    return max(0.0, min(1.0, v))


@router.get("/user-profile")
def user_profile(
    request: Request,
    user_id: str = Query(...),
    model: str = Query(default="hybrid"),
    n: int = Query(default=10, ge=1, le=50),
    db: DbConn = DbConn,
) -> dict:
    """
    Return a user's listening audio profile vs the model's recommendation profile.
    Both profiles are average audio feature vectors (energy, danceability, valence,
    acousticness, tempo_norm) normalised to [0, 1].
    """
    # ── 1. Listening profile ──────────────────────────────────────────────────
    listen_row = db.execute(
        """
        SELECT
            AVG(t.energy)       AS energy,
            AVG(t.danceability) AS danceability,
            AVG(t.valence)      AS valence,
            AVG(t.acousticness) AS acousticness,
            AVG(t.tempo)        AS tempo,
            COUNT(*)            AS cnt
        FROM listens l
        JOIN tracks t ON l.track_id = t.track_id
        WHERE l.user_id = ?
        """,
        [user_id],
    ).fetchone()

    listen_count = int(listen_row[5] or 0)
    raw_tempo = _safe_float(listen_row[4], 120.0)
    listen_profile = {
        "energy":       round(_clamp01(_safe_float(listen_row[0])), 3),
        "danceability": round(_clamp01(_safe_float(listen_row[1])), 3),
        "valence":      round(_clamp01(_safe_float(listen_row[2])), 3),
        "acousticness": round(_clamp01(_safe_float(listen_row[3])), 3),
        "tempo_norm":   round(_clamp01((raw_tempo - 60.0) / 140.0), 3),
    }

    # ── 2. Recommendation profile ─────────────────────────────────────────────
    recommenders = getattr(request.app.state, "recommenders", {})
    rec_track_ids: list[str] = []

    if model in recommenders:
        try:
            recs = recommenders[model].recommend(user_id, n=n, exclude_seen=True)
            rec_track_ids = [tid for tid, _ in recs]
        except Exception:
            pass

    rec_profile = {"energy": 0.0, "danceability": 0.0, "valence": 0.0, "acousticness": 0.0, "tempo_norm": 0.0}

    if rec_track_ids:
        placeholders = ", ".join(["?"] * len(rec_track_ids))
        rec_row = db.execute(
            f"""
            SELECT
                AVG(energy)       AS energy,
                AVG(danceability) AS danceability,
                AVG(valence)      AS valence,
                AVG(acousticness) AS acousticness,
                AVG(tempo)        AS tempo
            FROM tracks WHERE track_id IN ({placeholders})
            """,
            rec_track_ids,
        ).fetchone()
        if rec_row:
            raw_rec_tempo = _safe_float(rec_row[4], 120.0)
            rec_profile = {
                "energy":       round(_clamp01(_safe_float(rec_row[0])), 3),
                "danceability": round(_clamp01(_safe_float(rec_row[1])), 3),
                "valence":      round(_clamp01(_safe_float(rec_row[2])), 3),
                "acousticness": round(_clamp01(_safe_float(rec_row[3])), 3),
                "tempo_norm":   round(_clamp01((raw_rec_tempo - 60.0) / 140.0), 3),
            }

    return {
        "user_id": user_id,
        "model": model,
        "listen_profile": listen_profile,
        "rec_profile": rec_profile,
        "listen_count": listen_count,
        "rec_track_count": len(rec_track_ids),
    }


@router.get("/popularity")
def popularity_bias(
    request: Request,
    db: DbConn = DbConn,
) -> dict:
    """
    Return the Zipf play-count distribution across the full catalog,
    plus each model's average recommendation rank for a sample user (U0001).
    """
    # Full catalog sorted by play_count DESC
    rows = db.execute(
        "SELECT play_count FROM tracks ORDER BY play_count DESC"
    ).fetchall()
    play_counts = [int(r[0]) for r in rows]

    # Build rank lookup: track_id → rank (1-based)
    rank_rows = db.execute(
        """
        SELECT track_id,
               ROW_NUMBER() OVER (ORDER BY play_count DESC) AS rnk
        FROM tracks
        """
    ).fetchall()
    track_rank: dict[str, int] = {r[0]: int(r[1]) for r in rank_rows}

    # Per-model avg rank using U0001 as sample
    recommenders = getattr(request.app.state, "recommenders", {})
    model_avg_ranks: dict[str, int] = {}
    sample_user = "U0001"

    for m in ANALYSIS_MODELS:
        if m not in recommenders:
            continue
        try:
            recs = recommenders[m].recommend(sample_user, n=10, exclude_seen=False)
            ranks = [track_rank[tid] for tid, _ in recs if tid in track_rank]
            if ranks:
                model_avg_ranks[m] = int(sum(ranks) / len(ranks))
        except Exception:
            pass

    return {
        "play_counts": play_counts,
        "model_avg_ranks": model_avg_ranks,
        "total_tracks": len(play_counts),
    }


@router.get("/timeline")
def catalog_timeline(db: DbConn = DbConn) -> dict:
    """
    Return track counts grouped by release_year and genre for a stacked area chart.
    Top 8 genres by total count; remaining genres merged into 'Other'.
    """
    rows = db.execute(
        """
        SELECT release_year, genre, COUNT(*) AS cnt
        FROM tracks
        WHERE release_year IS NOT NULL
          AND genre IS NOT NULL
          AND release_year >= 1950
          AND release_year <= 2030
        GROUP BY release_year, genre
        ORDER BY release_year, cnt DESC
        """
    ).fetchall()

    # Find top 8 genres by total count
    genre_totals: dict[str, int] = {}
    for _, genre, cnt in rows:
        genre_totals[genre] = genre_totals.get(genre, 0) + int(cnt)

    top_genres = sorted(genre_totals, key=lambda g: genre_totals[g], reverse=True)[:8]
    top_genre_set = set(top_genres)

    # Collect all years
    year_set = sorted({int(r[0]) for r in rows})
    year_index = {y: i for i, y in enumerate(year_set)}

    # Build matrix
    matrix: dict[str, list[int]] = {g: [0] * len(year_set) for g in top_genres}
    matrix["Other"] = [0] * len(year_set)

    for year, genre, cnt in rows:
        yi = year_index[int(year)]
        g = genre if genre in top_genre_set else "Other"
        matrix[g][yi] += int(cnt)

    genres_ordered = top_genres + ["Other"]

    return {
        "years": year_set,
        "genres": genres_ordered,
        "matrix": {g: matrix[g] for g in genres_ordered},
    }


@router.get("/correlation")
def feature_correlation(db: DbConn = DbConn) -> dict:
    """Pearson correlation matrix for 9 audio features across all tracks."""
    FEATURES = [
        "tempo", "energy", "danceability", "acousticness",
        "valence", "instrumentalness", "loudness", "speechiness", "liveness",
    ]
    cols = ", ".join(f"COALESCE({f}, 0)" for f in FEATURES)
    rows = db.execute(f"SELECT {cols} FROM tracks").fetchall()

    n = len(rows)
    if n == 0:
        return {"features": FEATURES, "matrix": []}

    # compute correlation matrix manually with numpy
    import numpy as np

    arr = np.array(rows, dtype=float)
    corr = np.corrcoef(arr, rowvar=False)

    return {
        "features": FEATURES,
        "matrix": corr.tolist(),
        "n_tracks": n,
    }


@router.get("/patterns")
def listening_patterns(db: DbConn = DbConn) -> dict:
    """Listening counts by hour-of-day and day-of-week."""
    by_hour = db.execute(
        "SELECT EXTRACT(hour FROM listened_at)::INTEGER AS h, COUNT(*) "
        "FROM listens GROUP BY h ORDER BY h"
    ).fetchall()

    by_dow = db.execute(
        "SELECT EXTRACT(dow FROM listened_at)::INTEGER AS d, COUNT(*) "
        "FROM listens GROUP BY d ORDER BY d"
    ).fetchall()

    heatmap_rows = db.execute(
        "SELECT EXTRACT(dow FROM listened_at)::INTEGER AS d, "
        "EXTRACT(hour FROM listened_at)::INTEGER AS h, COUNT(*) "
        "FROM listens GROUP BY d, h ORDER BY d, h"
    ).fetchall()

    # hour → count (24 slots)
    hour_counts = [0] * 24
    for h, cnt in by_hour:
        hour_counts[int(h)] = int(cnt)

    # dow → count (7 slots, 0=Sun)
    dow_counts = [0] * 7
    for d, cnt in by_dow:
        dow_counts[int(d)] = int(cnt)

    # heatmap: list of {d, h, count}
    heatmap = [{"dow": int(d), "hour": int(h), "count": int(cnt)} for d, h, cnt in heatmap_rows]

    return {
        "hour_counts": hour_counts,
        "dow_counts": dow_counts,
        "heatmap": heatmap,
        "total_listens": sum(hour_counts),
    }


@router.get("/cohorts")
def user_cohorts(db: DbConn = DbConn) -> dict:
    """Genre preference by age_group (normalised % within each cohort)."""
    rows = db.execute(
        "SELECT u.age_group, t.genre, COUNT(*) AS cnt "
        "FROM listens li "
        "JOIN users u ON li.user_id = u.user_id "
        "JOIN tracks t ON li.track_id = t.track_id "
        "WHERE t.genre IS NOT NULL AND u.age_group IS NOT NULL "
        "GROUP BY u.age_group, t.genre"
    ).fetchall()

    # top 8 genres globally
    genre_totals: dict[str, int] = {}
    for _, genre, cnt in rows:
        genre_totals[genre] = genre_totals.get(genre, 0) + int(cnt)
    top_genres = [g for g, _ in sorted(genre_totals.items(), key=lambda x: -x[1])[:8]]

    AGE_ORDER = ["18-24", "25-34", "35-44", "45-54", "55+"]
    age_groups = sorted({r[0] for r in rows}, key=lambda g: AGE_ORDER.index(g) if g in AGE_ORDER else 99)

    # raw counts matrix
    raw: dict[str, dict[str, int]] = {ag: {g: 0 for g in top_genres} for ag in age_groups}
    for age_group, genre, cnt in rows:
        if genre in top_genres and age_group in raw:
            raw[age_group][genre] += int(cnt)

    # normalize each row to 0-100%
    matrix: dict[str, dict[str, float]] = {}
    for ag in age_groups:
        total = sum(raw[ag].values()) or 1
        matrix[ag] = {g: round(raw[ag][g] / total * 100, 1) for g in top_genres}

    return {"age_groups": age_groups, "genres": top_genres, "matrix": matrix}


@router.get("/genre-classifier")
def genre_classifier(db: DbConn = DbConn) -> dict:
    """Train Decision Tree + Random Forest to classify genre from 9 audio features."""
    from sklearn.tree import DecisionTreeClassifier, export_text
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score, classification_report
    import numpy as np

    FEATURES = [
        "energy", "danceability", "valence", "acousticness", "tempo",
        "instrumentalness", "loudness", "speechiness", "liveness",
    ]

    cols = ", ".join(["genre"] + FEATURES)
    rows = db.execute(
        f"SELECT {cols} FROM tracks WHERE genre IS NOT NULL AND energy IS NOT NULL"
    ).fetchall()

    if len(rows) < 20:
        return {"error": "Not enough data to train classifier"}

    y = np.array([r[0] for r in rows])
    X_raw = [[_safe_float(r[i + 1]) for i in range(len(FEATURES))] for r in rows]

    # Normalise tempo to [0, 1] (60–200 BPM range)
    tempo_idx = FEATURES.index("tempo")
    for row_vals in X_raw:
        row_vals[tempo_idx] = _clamp01((row_vals[tempo_idx] - 60.0) / 140.0)

    X = np.array(X_raw, dtype=float)
    classes = sorted(set(y.tolist()))

    stratify = y if len(classes) > 1 else None
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=stratify
    )

    # ── Decision Tree ─────────────────────────────────────────────────────────
    dt = DecisionTreeClassifier(max_depth=5, random_state=42)
    dt.fit(X_train, y_train)
    dt_pred = dt.predict(X_test)
    dt_acc = float(accuracy_score(y_test, dt_pred))
    dt_importance = {f: round(float(v), 4) for f, v in zip(FEATURES, dt.feature_importances_)}
    tree_text = export_text(dt, feature_names=FEATURES, max_depth=5)

    def _tree_json(node_id: int, depth: int = 0) -> dict:
        t = dt.tree_
        if t.children_left[node_id] == t.children_right[node_id]:  # leaf
            class_idx = int(t.value[node_id][0].argmax())
            return {
                "id": node_id, "depth": depth, "isLeaf": True,
                "genre": classes[class_idx],
                "samples": int(t.n_node_samples[node_id]),
                "gini": round(float(t.impurity[node_id]), 4),
            }
        fi = int(t.feature[node_id])
        th = float(t.threshold[node_id])
        return {
            "id": node_id, "depth": depth, "isLeaf": False,
            "feature": FEATURES[fi],
            "threshold": round(th, 3),
            "samples": int(t.n_node_samples[node_id]),
            "gini": round(float(t.impurity[node_id]), 4),
            "left":  _tree_json(int(t.children_left[node_id]),  depth + 1),
            "right": _tree_json(int(t.children_right[node_id]), depth + 1),
        }

    tree_json = _tree_json(0)

    # ── Random Forest ─────────────────────────────────────────────────────────
    rf = RandomForestClassifier(n_estimators=50, max_depth=6, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)
    rf_pred = rf.predict(X_test)
    rf_acc = float(accuracy_score(y_test, rf_pred))
    rf_importance = {f: round(float(v), 4) for f, v in zip(FEATURES, rf.feature_importances_)}

    report = classification_report(y_test, rf_pred, output_dict=True, zero_division=0)
    class_report = {
        genre: {
            "precision": round(float(report[genre]["precision"]), 3),
            "recall": round(float(report[genre]["recall"]), 3),
            "f1": round(float(report[genre]["f1-score"]), 3),
            "support": int(report[genre]["support"]),
        }
        for genre in classes
        if genre in report
    }

    return {
        "features": FEATURES,
        "classes": classes,
        "n_samples": len(rows),
        "dt": {
            "accuracy": round(dt_acc, 4),
            "feature_importance": dt_importance,
            "tree_text": tree_text,
            "tree_json": tree_json,
        },
        "rf": {
            "accuracy": round(rf_acc, 4),
            "feature_importance": rf_importance,
            "n_estimators": 50,
            "classification_report": class_report,
        },
    }


@router.get("/geography")
def geographic_distribution(db: DbConn = DbConn) -> dict:
    """Artist count + avg popularity by country, plus top genre per country."""
    rows = db.execute(
        "SELECT country, COUNT(*) AS n, AVG(popularity_score) AS avg_pop "
        "FROM artists WHERE country IS NOT NULL "
        "GROUP BY country ORDER BY n DESC LIMIT 20"
    ).fetchall()

    countries = [r[0] for r in rows]
    ph = ", ".join(["?"] * len(countries))

    # top genre per country (join through tracks)
    genre_rows = db.execute(
        f"SELECT a.country, t.genre, COUNT(*) AS cnt "
        f"FROM artists a JOIN tracks t USING(artist_id) "
        f"WHERE a.country IN ({ph}) AND t.genre IS NOT NULL "
        f"GROUP BY a.country, t.genre",
        countries,
    ).fetchall()

    top_genre_by_country: dict[str, str] = {}
    genre_cnt: dict[str, dict[str, int]] = {}
    for country, genre, cnt in genre_rows:
        genre_cnt.setdefault(country, {})[genre] = int(cnt)
    for country, gc in genre_cnt.items():
        top_genre_by_country[country] = max(gc, key=lambda g: gc[g])

    # representative artists per country (top 3 by popularity)
    rep_rows = db.execute(
        f"SELECT country, name, popularity_score FROM artists "
        f"WHERE country IN ({ph}) "
        f"ORDER BY country, popularity_score DESC",
        countries,
    ).fetchall()
    rep_by_country: dict[str, list[str]] = {}
    for country, name, _ in rep_rows:
        rep_by_country.setdefault(country, [])
        if len(rep_by_country[country]) < 3:
            rep_by_country[country].append(name)

    result = [
        {
            "country": r[0],
            "artist_count": int(r[1]),
            "avg_popularity": round(float(r[2] or 0), 1),
            "top_genre": top_genre_by_country.get(r[0], "—"),
            "top_artists": rep_by_country.get(r[0], []),
        }
        for r in rows
    ]
    return {"countries": result}
