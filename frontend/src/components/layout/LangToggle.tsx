import { useLangStore } from '@/store/langStore'

export function LangToggle() {
  const lang = useLangStore((s) => s.lang)
  const toggleLang = useLangStore((s) => s.toggleLang)

  return (
    <button
      onClick={toggleLang}
      className="flex items-center rounded-full text-xs font-bold overflow-hidden"
      style={{
        border: '1px solid #25253a',
        background: '#0d0d14',
      }}
      title={lang === 'zh' ? 'Switch to English' : '切換為中文'}
    >
      <span
        style={{
          padding: '3px 9px',
          background: lang === 'zh' ? '#ff6b35' : 'transparent',
          color: lang === 'zh' ? '#0d0d14' : '#6b6b8a',
          transition: 'all 0.15s',
        }}
      >
        ZH
      </span>
      <span
        style={{
          padding: '3px 9px',
          background: lang === 'en' ? '#ff6b35' : 'transparent',
          color: lang === 'en' ? '#0d0d14' : '#6b6b8a',
          transition: 'all 0.15s',
        }}
      >
        EN
      </span>
    </button>
  )
}
