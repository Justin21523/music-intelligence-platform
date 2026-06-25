import { useLangStore } from '@/store/langStore'
import { zh } from '@/i18n/zh'
import { en } from '@/i18n/en'

/** Returns a translator function. t('key') → translated string (falls back to English, then to key itself) */
export function useT() {
  const lang = useLangStore((s) => s.lang)
  const dict = lang === 'zh' ? zh : en
  return (key: string) => dict[key] ?? en[key] ?? key
}
