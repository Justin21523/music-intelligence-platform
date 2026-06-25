export type SearchMode = 'bm25' | 'vector' | 'hybrid'
export type ModelName = 'popularity' | 'item_similarity' | 'als' | 'content' | 'hybrid'

export interface TrackBase {
  track_id: string
  title: string
  artist_id: string
  album?: string
  genre?: string
  release_year?: number
  duration_ms?: number
  play_count: number
}

export interface TrackDetail extends TrackBase {
  tags: string[]
  tempo?: number
  energy?: number
  danceability?: number
  acousticness?: number
  valence?: number
  loudness?: number
  explicit: boolean
  artist_name?: string
}

export interface TrackListResponse {
  tracks: TrackBase[]
  total: number
  page: number
  page_size: number
}

export interface RecommendedItem {
  track_id: string
  score: number
  title?: string
  artist_name?: string
  genre?: string
  energy?: number
  danceability?: number
  valence?: number
}

export interface RecommendationResponse {
  user_id: string
  model: string
  recommendations: RecommendedItem[]
}

export interface SimilarTracksResponse {
  track_id: string
  similar: RecommendedItem[]
}

export interface SearchResult {
  track_id: string
  score: number
  title?: string
  artist_name?: string
  genre?: string
  album?: string
}

export interface SearchResponse {
  query: string
  mode: string
  results: SearchResult[]
  total: number
}

export interface ArtistBase {
  artist_id: string
  name: string
  country?: string
  genres: string[]
  popularity_score: number
  follower_count: number
  active_since?: number
}

export interface ArtistDetail extends ArtistBase {
  tags: string[]
  top_tracks: string[]
}

export interface NetworkNode {
  id: string
  name: string
  genre?: string
  popularity: number
}

export interface NetworkEdge {
  source: string
  target: string
  weight: number
  relation_type: string
}

export interface ArtistNetwork {
  artist_id: string
  nodes: NetworkNode[]
  edges: NetworkEdge[]
}

export interface GenreStat {
  genre: string
  count: number
  avg_energy: number
  avg_danceability: number
  avg_valence: number
  avg_plays: number
}

export interface TopTrack {
  track_id: string
  title: string
  artist_id: string
  artist_name: string
  genre: string
  play_count: number
}

export interface StatsResponse {
  tracks: number
  artists: number
  users: number
  listens: number
  top_tracks: TopTrack[]
  genres: GenreStat[]
}

export interface HealthResponse {
  status: string
  version: string
  db_ok: boolean
  bm25_loaded: boolean
  faiss_loaded: boolean
  models_loaded: string[]
}

export interface UserItem {
  user_id: string
  username: string
}

// Analytics
export interface AudioProfile {
  energy: number
  danceability: number
  valence: number
  acousticness: number
  tempo_norm: number
}

export interface UserProfileResponse {
  user_id: string
  model: string
  listen_profile: AudioProfile
  rec_profile: AudioProfile
  listen_count: number
  rec_track_count: number
}

export interface PopularityBiasResponse {
  play_counts: number[]
  model_avg_ranks: Record<string, number>
  total_tracks: number
}

export interface CatalogTimelineResponse {
  years: number[]
  genres: string[]
  matrix: Record<string, number[]>
}

export interface ArtistListItem {
  artist_id: string
  name: string
  genre?: string
  popularity_score: number
}

export interface PlaylistRequest {
  seed_track_ids: string[]
  n: number
  diversity: number
}

export interface PlaylistResponse {
  tracks: RecommendedItem[]
  seed_tracks: string[]
}

export interface EvalRow {
  model: string
  [metric: string]: string | number
}

export interface EvaluationResponse {
  rows: EvalRow[]
  error?: string
}

// ── Global Network (SNA) ──────────────────────────────────────────────────────

export interface GlobalNetworkNode {
  id: string
  name: string
  genre: string | null
  popularity: number
  degree_centrality: number
  betweenness: number
  community_id: number
  clustering: number
}

export interface GlobalNetworkEdge {
  source: string
  target: string
  weight: number
}

export interface GlobalNetworkStats {
  n_nodes: number
  n_edges: number
  n_communities: number
  avg_clustering: number
  avg_degree: number
  threshold: number
  top_hubs: Array<{ name: string; betweenness: number }>
}

export interface GlobalNetworkCommunity {
  id: number
  size: number
  top_artist: string
}

export interface GlobalNetworkResponse {
  nodes: GlobalNetworkNode[]
  edges: GlobalNetworkEdge[]
  stats: GlobalNetworkStats
  communities: GlobalNetworkCommunity[]
}
