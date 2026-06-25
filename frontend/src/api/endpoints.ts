import { apiFetch } from './client'
import type {
  ArtistDetail,
  ArtistListItem,
  ArtistNetwork,
  CatalogTimelineResponse,
  EvaluationResponse,
  GlobalNetworkResponse,
  HealthResponse,
  ModelName,
  PlaylistRequest,
  PlaylistResponse,
  PopularityBiasResponse,
  RecommendationResponse,
  SearchMode,
  SearchResponse,
  SimilarTracksResponse,
  StatsResponse,
  TrackDetail,
  TrackListResponse,
  UserItem,
  UserProfileResponse,
} from '@/types/api'

export const getHealth = () =>
  apiFetch<HealthResponse>('/health')

export const getStats = () =>
  apiFetch<StatsResponse>('/stats')

export const getEvaluation = () =>
  apiFetch<EvaluationResponse>('/evaluation')

export const searchTracks = (q: string, mode: SearchMode = 'bm25', limit = 20) =>
  apiFetch<SearchResponse>(
    `/search/tracks?q=${encodeURIComponent(q)}&mode=${mode}&limit=${limit}`
  )

export const searchArtists = (q: string, limit = 20) =>
  apiFetch<SearchResponse>(`/search/artists?q=${encodeURIComponent(q)}&limit=${limit}`)

export const listTracks = (page = 1, pageSize = 20, genre?: string) => {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
  if (genre) params.set('genre', genre)
  return apiFetch<TrackListResponse>(`/tracks?${params}`)
}

export const getTrack = (trackId: string) =>
  apiFetch<TrackDetail>(`/tracks/${trackId}`)

export const getSimilarTracks = (trackId: string, model: ModelName = 'item_similarity', n = 10) =>
  apiFetch<SimilarTracksResponse>(`/tracks/${trackId}/similar?model=${model}&n=${n}`)

export const getArtist = (artistId: string) =>
  apiFetch<ArtistDetail>(`/artists/${artistId}`)

export const listArtists = (limit = 200) =>
  apiFetch<{ artists: ArtistListItem[] }>(`/artists?limit=${limit}`)

export const getArtistNetwork = (artistId: string, depth = 1) =>
  apiFetch<ArtistNetwork>(`/artists/${artistId}/network?depth=${depth}`)

export const getGlobalNetwork = () =>
  apiFetch<GlobalNetworkResponse>('/artists/global-network')

export const getRecommendations = (userId: string, model: ModelName = 'hybrid', n = 10) =>
  apiFetch<RecommendationResponse>(`/recommendations/user/${userId}?model=${model}&n=${n}`)

export const listUsers = (limit = 200) =>
  apiFetch<{ users: UserItem[] }>(`/users?limit=${limit}`)

export const getUserProfile = (userId: string, model = 'hybrid', n = 10) =>
  apiFetch<UserProfileResponse>(`/analysis/user-profile?user_id=${userId}&model=${model}&n=${n}`)

export const getPopularityBias = () =>
  apiFetch<PopularityBiasResponse>('/analysis/popularity')

export const getCatalogTimeline = () =>
  apiFetch<CatalogTimelineResponse>('/analysis/timeline')

export const buildPlaylist = (body: PlaylistRequest) =>
  apiFetch<PlaylistResponse>('/playlist/build', {
    method: 'POST',
    body: JSON.stringify(body),
  })

// ── Analysis / Analytics ────────────────────────────────────────────────────

export interface CorrelationResponse {
  features: string[]
  matrix: number[][]
  n_tracks: number
}

export interface ListeningPatternsResponse {
  hour_counts: number[]
  dow_counts: number[]
  heatmap: { dow: number; hour: number; count: number }[]
  total_listens: number
}

export interface CohortTasteResponse {
  age_groups: string[]
  genres: string[]
  matrix: Record<string, Record<string, number>>
}

export interface GeographyCountry {
  country: string
  artist_count: number
  avg_popularity: number
  top_genre: string
  top_artists: string[]
}

export interface GeographyResponse {
  countries: GeographyCountry[]
}

export const getCorrelation = () =>
  apiFetch<CorrelationResponse>('/analysis/correlation')

export const getListeningPatterns = () =>
  apiFetch<ListeningPatternsResponse>('/analysis/patterns')

export const getCohortTaste = () =>
  apiFetch<CohortTasteResponse>('/analysis/cohorts')

export const getGeography = () =>
  apiFetch<GeographyResponse>('/analysis/geography')

// ── Browse / Faceted Catalog ────────────────────────────────────────────────

export interface BrowseParams {
  genre?: string
  year_min?: number
  year_max?: number
  energy_min?: number
  energy_max?: number
  explicit?: boolean
  sort_by?: string
  limit?: number
  offset?: number
}

export interface BrowseTrack {
  track_id: string
  title: string
  genre: string | null
  release_year: number | null
  energy: number
  danceability: number
  play_count: number
  artist_name: string | null
}

export interface BrowseResponse {
  tracks: BrowseTrack[]
  total: number
  genre_counts: Record<string, number>
}

export const browseTracks = (params: BrowseParams): Promise<BrowseResponse> => {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) qs.set(k, String(v))
  })
  return apiFetch<BrowseResponse>(`/tracks/browse?${qs}`)
}

// ── Ingest / Pipeline ───────────────────────────────────────────────────────

export interface PipelineStatus {
  status: 'idle' | 'running' | 'done' | 'error'
  step_idx: number
  step_name: string
  pct: number
  logs: string[]
  error: string | null
  used_sample: boolean
  elapsed_s: number
}

export interface UploadValidation {
  valid: boolean
  errors: string[]
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000'

export const getPipelineStatus = (): Promise<PipelineStatus> =>
  fetch(`${API_BASE}/ingest/status`).then((r) => r.json())

export const startPipeline = (useSample: boolean): Promise<{ status: string }> =>
  fetch(`${API_BASE}/ingest/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ use_sample: useSample }),
  }).then((r) => r.json())

export const resetPipeline = (): Promise<{ status: string }> =>
  fetch(`${API_BASE}/ingest/reset`, { method: 'POST' }).then((r) => r.json())

export const uploadPipelineFiles = (files: {
  artists_file: File
  tracks_file: File
  users_file: File
  listens_file: File
}): Promise<UploadValidation> => {
  const form = new FormData()
  form.append('artists_file', files.artists_file)
  form.append('tracks_file', files.tracks_file)
  form.append('users_file', files.users_file)
  form.append('listens_file', files.listens_file)
  return fetch(`${API_BASE}/ingest/upload`, { method: 'POST', body: form }).then((r) => r.json())
}
