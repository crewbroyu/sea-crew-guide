export const SUPPORTED_LANGUAGES = ['zh', 'en']
export const DEFAULT_LANGUAGE = 'zh'
export const LANGUAGE_STORAGE_KEY = 'cpg_language'

// Only these pages have been translated. Every other page stays Chinese whatever the stored preference,
// so a visitor who picked English never lands on a half-translated page.
export const BILINGUAL_ROUTES = [
  /^\/programs\/bar-server\/trial\/?$/,
]

export const normalizeLanguage = (value) => (
  SUPPORTED_LANGUAGES.includes(value) ? value : null
)

export const isBilingualRoute = (pathname = '') => BILINGUAL_ROUTES.some((pattern) => pattern.test(pathname))

export const readPreferredLanguage = (storage) => {
  try {
    return normalizeLanguage(storage?.getItem(LANGUAGE_STORAGE_KEY)) || DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

export const writePreferredLanguage = (storage, language) => {
  const normalized = normalizeLanguage(language)
  if (!normalized) return
  try {
    storage?.setItem(LANGUAGE_STORAGE_KEY, normalized)
  } catch {
    // Private mode or full storage: the choice still applies to this page view.
  }
}

// A `?lang=` link wins over the stored preference, so a shared English link opens in English.
export const resolveRouteLanguage = ({ pathname = '', search = '', preferred = DEFAULT_LANGUAGE } = {}) => {
  if (!isBilingualRoute(pathname)) return DEFAULT_LANGUAGE
  const queryLanguage = normalizeLanguage(new URLSearchParams(search).get('lang'))
  return queryLanguage || normalizeLanguage(preferred) || DEFAULT_LANGUAGE
}

export const getHtmlLang = (language) => (language === 'en' ? 'en' : 'zh-CN')
