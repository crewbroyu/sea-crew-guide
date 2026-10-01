import { useEffect, useState } from 'react'
import {
  readBarListeningProgress,
  readBarShiftHistory,
  writeBarListeningProgress,
  writeBarShiftHistory,
} from '../data/barServerListening'
import {
  BAR_SERVER_PRACTICE_VERSION,
  mergeBarListeningProgress,
  mergeBarShiftHistory,
} from '../data/barServerProgressSync'
import {
  getMyBarServerPracticeState,
  upsertMyBarServerPracticeState,
} from '../services/jobPreparationService'

export default function useBarServerPracticeProgress() {
  const [listeningProgress, setListeningProgress] = useState(() => readBarListeningProgress())
  const [shiftHistory, setShiftHistory] = useState(() => readBarShiftHistory())
  const [cloudReady, setCloudReady] = useState(false)
  const [syncStatus, setSyncStatus] = useState('loading')

  useEffect(() => {
    let active = true
    getMyBarServerPracticeState()
      .then((cloudState) => {
        if (!active) return
        const localListening = readBarListeningProgress()
        const localHistory = readBarShiftHistory()
        const mergedListening = mergeBarListeningProgress(cloudState?.listeningProgress, localListening)
        const mergedHistory = mergeBarShiftHistory(cloudState?.shiftHistory || [], localHistory)
        writeBarListeningProgress(mergedListening)
        writeBarShiftHistory(mergedHistory)
        setListeningProgress(mergedListening)
        setShiftHistory(mergedHistory)
        setSyncStatus(cloudState ? 'pending' : 'local')
        setCloudReady(true)
      })
      .catch((error) => {
        console.warn('Unable to restore Bar Server practice progress:', error)
        if (active) {
          setSyncStatus('local')
          setCloudReady(true)
        }
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!cloudReady) return undefined
    const timeout = window.setTimeout(() => {
      upsertMyBarServerPracticeState({
        version: BAR_SERVER_PRACTICE_VERSION,
        listeningProgress,
        shiftHistory,
      })
        .then((result) => setSyncStatus(result ? 'synced' : 'local'))
        .catch((error) => {
          console.warn('Unable to sync Bar Server practice progress:', error)
          setSyncStatus('local')
        })
    }, 800)
    return () => window.clearTimeout(timeout)
  }, [cloudReady, listeningProgress, shiftHistory])

  const updateListeningProgress = (nextProgress) => {
    writeBarListeningProgress(nextProgress)
    setListeningProgress(nextProgress)
    setSyncStatus('pending')
  }

  const updateShiftHistory = (nextHistory) => {
    const normalized = mergeBarShiftHistory(nextHistory)
    writeBarShiftHistory(normalized)
    setShiftHistory(normalized)
    setSyncStatus('pending')
  }

  return {
    listeningProgress,
    shiftHistory,
    syncStatus,
    updateListeningProgress,
    updateShiftHistory,
  }
}
