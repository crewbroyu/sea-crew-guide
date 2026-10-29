import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import i18n from '../i18n'
import {
  isBilingualRoute,
  normalizeLanguage,
  readPreferredLanguage,
  resolveRouteLanguage,
  writePreferredLanguage,
} from '../i18n/language'

// Applies the visitor's language on translated pages and falls back to Chinese everywhere else.
export default function LanguageRouteSync() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    const queryLanguage = normalizeLanguage(new URLSearchParams(search).get('lang'))
    if (queryLanguage && isBilingualRoute(pathname)) writePreferredLanguage(localStorage, queryLanguage)
    const language = resolveRouteLanguage({ pathname, search, preferred: readPreferredLanguage(localStorage) })
    if (i18n.language !== language) i18n.changeLanguage(language)
  }, [pathname, search])

  return null
}
