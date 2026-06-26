import { useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '@/components/layout/Layout'
import { useTourStore } from '@/store/tourStore'
import { Spinner } from '@/components/ui/index'

// ── Core pages (eager — always needed on first load) ──────
import { HomePage } from '@/pages/HomePage'
import { SearchPage } from '@/pages/SearchPage'
import { SimilarPage } from '@/pages/SimilarPage'
import { RecommendPage } from '@/pages/RecommendPage'
import { EvaluationPage } from '@/pages/EvaluationPage'
import { UploadPage } from '@/pages/UploadPage'
import { PipelineGraphPage } from '@/pages/PipelineGraphPage'

// ── Heavy / analytics pages (lazy — loaded on first visit) ─
const ArtistNetworkPage  = lazy(() => import('@/pages/ArtistNetworkPage').then(m => ({ default: m.ArtistNetworkPage })))
const GenreDashboardPage = lazy(() => import('@/pages/GenreDashboardPage').then(m => ({ default: m.GenreDashboardPage })))
const UserDnaPage        = lazy(() => import('@/pages/analytics/UserDnaPage').then(m => ({ default: m.UserDnaPage })))
const ModelDisagreementPage = lazy(() => import('@/pages/analytics/ModelDisagreementPage').then(m => ({ default: m.ModelDisagreementPage })))
const PopularityBiasPage = lazy(() => import('@/pages/analytics/PopularityBiasPage').then(m => ({ default: m.PopularityBiasPage })))
const CatalogTimelinePage = lazy(() => import('@/pages/analytics/CatalogTimelinePage').then(m => ({ default: m.CatalogTimelinePage })))
const TradeoffPage       = lazy(() => import('@/pages/analytics/TradeoffPage').then(m => ({ default: m.TradeoffPage })))
const CorrelationPage    = lazy(() => import('@/pages/analytics/CorrelationPage').then(m => ({ default: m.CorrelationPage })))
const ListeningPatternsPage = lazy(() => import('@/pages/analytics/ListeningPatternsPage').then(m => ({ default: m.ListeningPatternsPage })))
const CohortTastePage    = lazy(() => import('@/pages/analytics/CohortTastePage').then(m => ({ default: m.CohortTastePage })))
const GeographyPage      = lazy(() => import('@/pages/analytics/GeographyPage').then(m => ({ default: m.GeographyPage })))
const TreeModelPage      = lazy(() => import('@/pages/analytics/TreeModelPage').then(m => ({ default: m.TreeModelPage })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      staleTime: 30_000,
    },
  },
})

function RouteLoader() {
  return (
    <div className="flex justify-center items-center" style={{ minHeight: 300 }}>
      <Spinner size={28} />
    </div>
  )
}

export default function App() {
  useEffect(() => {
    if ((window as any).__BYPASS_TOUR__) return
    setTimeout(() => {
      useTourStore.getState().setStep(0)
      useTourStore.getState().setFullscreen(true)
      useTourStore.getState().setActive(true)
    }, 400)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Layout>
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/"          element={<HomePage />} />
              <Route path="/search"    element={<SearchPage />} />
              <Route path="/similar"   element={<SimilarPage />} />
              <Route path="/recommend" element={<RecommendPage />} />
              <Route path="/artists"   element={<ArtistNetworkPage />} />
              <Route path="/genres"    element={<GenreDashboardPage />} />
              <Route path="/evaluation" element={<EvaluationPage />} />
              <Route path="/analytics/dna"          element={<UserDnaPage />} />
              <Route path="/analytics/disagreement" element={<ModelDisagreementPage />} />
              <Route path="/analytics/popularity"   element={<PopularityBiasPage />} />
              <Route path="/analytics/timeline"     element={<CatalogTimelinePage />} />
              <Route path="/analytics/tradeoff"     element={<TradeoffPage />} />
              <Route path="/analytics/correlation"  element={<CorrelationPage />} />
              <Route path="/analytics/patterns"     element={<ListeningPatternsPage />} />
              <Route path="/analytics/cohorts"      element={<CohortTastePage />} />
              <Route path="/analytics/geography"    element={<GeographyPage />} />
              <Route path="/analytics/tree"         element={<TreeModelPage />} />
              <Route path="/pipeline"  element={<PipelineGraphPage />} />
              <Route path="/upload"    element={<UploadPage />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
