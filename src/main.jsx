import React from 'react'
import ReactDOM from 'react-dom/client'
import './i18n'
import App from './App'
import { removeStoredTask5Images } from './data/task5CompletionDetails'
import './index.css'

// Free the browser storage taken by old Task 5 completion photos before any page saves progress.
try {
  removeStoredTask5Images(window.localStorage)
} catch (error) {
  console.warn('Unable to clean Task 5 photos:', error)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
