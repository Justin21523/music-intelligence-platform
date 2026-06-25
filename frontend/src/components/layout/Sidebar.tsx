import { NavLink } from 'react-router-dom'
import {
  Home, Search, Music2, User, Network,
  BarChart3, Award, Disc3, Play,
  FlaskConical, GitMerge, TrendingDown, CalendarDays, Target,
  BarChart2, Clock, Users, Globe, Workflow, TreePine,
} from 'lucide-react'
import { TourLauncher } from '@/components/tour/TourLauncher'
import { LangToggle } from '@/components/layout/LangToggle'
import { useT } from '@/hooks/useT'

function NavItem({ to, labelKey, icon: Icon }: { to: string; labelKey: string; icon: React.ElementType }) {
  const t = useT()
  return (
    <NavLink
      to={to}
      end={to === '/'}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '9px 20px',
        fontSize: '0.875rem',
        fontWeight: isActive ? '600' : '400',
        color: isActive ? '#ff6b35' : '#6b6b8a',
        background: isActive ? 'rgba(255,107,53,0.1)' : 'transparent',
        borderRight: isActive ? '2px solid #ff6b35' : '2px solid transparent',
        textDecoration: 'none',
        transition: 'all 0.15s',
      })}
    >
      <Icon size={16} />
      {t(labelKey)}
    </NavLink>
  )
}

const MAIN_NAV = [
  { to: '/',           labelKey: 'nav.home',        icon: Home },
  { to: '/search',     labelKey: 'nav.search',      icon: Search },
  { to: '/similar',    labelKey: 'nav.similar',     icon: Music2 },
  { to: '/recommend',  labelKey: 'nav.recommend',   icon: User },
  { to: '/artists',    labelKey: 'nav.artists',     icon: Network },
  { to: '/genres',     labelKey: 'nav.genres',      icon: BarChart3 },
  { to: '/evaluation', labelKey: 'nav.evaluation',  icon: Award },
  { to: '/pipeline',   labelKey: 'nav.pipeline',    icon: Workflow },
]

const ANALYTICS_NAV = [
  { to: '/analytics/dna',          labelKey: 'nav.dna',          icon: FlaskConical },
  { to: '/analytics/disagreement', labelKey: 'nav.disagreement', icon: GitMerge },
  { to: '/analytics/popularity',   labelKey: 'nav.popularity',   icon: TrendingDown },
  { to: '/analytics/timeline',     labelKey: 'nav.timeline',     icon: CalendarDays },
  { to: '/analytics/tradeoff',     labelKey: 'nav.tradeoff',     icon: Target },
  { to: '/analytics/correlation',  labelKey: 'nav.correlation',  icon: BarChart2 },
  { to: '/analytics/patterns',     labelKey: 'nav.patterns',     icon: Clock },
  { to: '/analytics/cohorts',      labelKey: 'nav.cohorts',      icon: Users },
  { to: '/analytics/geography',    labelKey: 'nav.geography',    icon: Globe },
  { to: '/analytics/tree',         labelKey: 'nav.tree',         icon: TreePine },
]

export function Sidebar() {
  const t = useT()
  return (
    <aside
      style={{ background: '#14141f', borderRight: '1px solid #25253a' }}
      className="w-56 shrink-0 flex flex-col h-screen sticky top-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: '#25253a' }}>
        <Disc3 size={28} style={{ color: '#ff6b35' }} className="shrink-0" />
        <div>
          <div className="text-sm font-bold leading-tight" style={{ color: '#e8e8f0' }}>
            {t('brand.name1')}
          </div>
          <div className="text-xs" style={{ color: '#6b6b8a' }}>{t('brand.name2')}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {/* Run Pipeline — always-orange entry point */}
        <NavLink
          to="/upload"
          className="flex items-center gap-2.5 mx-3 mb-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
          style={({ isActive }) => ({
            background: isActive ? '#ff6b35' : 'rgba(255,107,53,0.12)',
            color: isActive ? '#0d0d14' : '#ff6b35',
            textDecoration: 'none',
            border: '1px solid rgba(255,107,53,0.3)',
          })}
        >
          <Play size={14} />
          {t('nav.upload')}
        </NavLink>

        <div className="space-y-0.5">
          {MAIN_NAV.map((item) => <NavItem key={item.to} {...item} />)}
        </div>

        {/* Analytics section */}
        <div className="mt-4 mb-1 px-5 flex items-center gap-2">
          <div className="flex-1 h-px" style={{ background: '#25253a' }} />
          <span className="text-xs font-medium" style={{ color: '#6b6b8a' }}>{t('nav.analytics')}</span>
          <div className="flex-1 h-px" style={{ background: '#25253a' }} />
        </div>
        <div className="space-y-0.5">
          {ANALYTICS_NAV.map((item) => <NavItem key={item.to} {...item} />)}
        </div>
      </nav>

      {/* Journey launcher */}
      <TourLauncher />

      {/* Footer with language toggle */}
      <div
        className="px-5 py-3 flex items-center justify-between text-xs"
        style={{ color: '#6b6b8a', borderTop: '1px solid #25253a' }}
      >
        <span>{t('footer.version')}</span>
        <LangToggle />
      </div>
    </aside>
  )
}
