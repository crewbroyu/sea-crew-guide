import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zh from './locales/zh/index.js'
import en from './locales/en/index.js'
import { DEFAULT_LANGUAGE, getHtmlLang, readPreferredLanguage, resolveRouteLanguage } from './language.js'

const initialLanguage = typeof window === 'undefined'
  ? DEFAULT_LANGUAGE
  : resolveRouteLanguage({
      pathname: window.location.pathname,
      search: window.location.search,
      preferred: readPreferredLanguage(window.localStorage),
    })

i18n.use(initReactI18next).init({
  resources: { zh, en },
  lng: initialLanguage,
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  returnNull: false,
})

const syncHtmlLang = (language) => {
  if (typeof document !== 'undefined') document.documentElement.lang = getHtmlLang(language)
}
syncHtmlLang(initialLanguage)
i18n.on('languageChanged', syncHtmlLang)

export default i18n
