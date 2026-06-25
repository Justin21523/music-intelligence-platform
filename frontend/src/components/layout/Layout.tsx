import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { LangToggle } from './LangToggle'
import { TourPanel } from '@/components/tour/TourPanel'
import { TourFullscreen } from '@/components/tour/TourFullscreen'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: '#0d0d14' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-6 py-3 border-b shrink-0"
          style={{ background: '#14141f', borderColor: '#25253a' }}
        >
          <LangToggle />
          <StatusBar />
        </header>
        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      {/* Pipeline Journey floating panel */}
      <TourPanel />
      {/* Pipeline Journey full-screen mode */}
      <TourFullscreen />
    </div>
  )
}
