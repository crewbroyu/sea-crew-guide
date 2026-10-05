import { useEffect, useRef, useState } from 'react'
import {
  readBarLearningStage,
  readBarLearningStageUpdatedAt,
  readBarListeningProgress,
  readBarShiftHistory,
  writeBarLearningStage,
  writeBarLearningStageUpdatedAt,
  writeBarListeningProgress,
  writeBarShiftHistory,
} from '../data/barServerListening'
import {
  BAR_SERVER_PRACTICE_VERSION,
  mergeBarServerPractice,
  mergeBarShiftHistory,
} from '../data/barServerProgressSync'
import useEffectiveAccess from './useEffectiveAccess'
import {
  getMyBarServerPracticeState,
  upsertMyBarServerPracticeState,
} from '../services/jobPreparationService'

const pendingKey = (ownerId) => `bar_server_pending_v1:${ownerId}`

const readLocalPractice = (ownerId) => ({
  version: BAR_SERVER_PRACTICE_VERSION,
  listeningProgress: readBarListeningProgress(ownerId),
  shiftHistory: readBarShiftHistory(ownerId),
  learningStage: readBarLearningStage(ownerId),
  stageUpdatedAt: readBarLearningStageUpdatedAt(ownerId),
})

const writeLocalPractice = (ownerId, practice) => {
  writeBarListeningProgress(practice.listeningProgress, ownerId)
  writeBarShiftHistory(practice.shiftHistory, ownerId)
  writeBarLearningStage(practice.learningStage, ownerId)
  writeBarLearningStageUpdatedAt(practice.stageUpdatedAt, ownerId)
}

export default function useBarServerPracticeProgress() {
  const access = useEffectiveAccess()
  const userId = access.isRegistered && !access.isPreviewing ? access.userId : null
  const ownerId = access.isPreviewing ? 'preview' : userId || 'guest'
  const readOnly = access.isPreviewing
  const [snapshot, setSnapshot] = useState(() => ({ ownerId, practice: readLocalPractice(ownerId) }))
  const [syncState, setSyncState] = useState(() => ({ ownerId, status: userId ? 'loading' : 'local' }))
  const [retry, setRetry] = useState(0)
  const revision = useRef(0)
  const latest = useRef(snapshot)
  const activeOwner = useRef(ownerId)
  const practice = snapshot.ownerId === ownerId ? snapshot.practice : readLocalPractice(ownerId)
  const syncStatus = syncState.ownerId === ownerId ? syncState.status : userId ? 'loading' : 'local'

  useEffect(() => {
    activeOwner.current = ownerId
  }, [ownerId])

  const commit = (nextPractice) => {
    const next = { ownerId, practice: nextPractice }
    latest.current = next
    setSnapshot(next)
    try {
      writeLocalPractice(ownerId, nextPractice)
      if (userId) localStorage.setItem(pendingKey(ownerId), '1')
    } catch {
      // Keep the current session usable when storage is unavailable.
    }
  }

  useEffect(() => {
    let active = true
    const restore = async () => {
      let local = readLocalPractice(ownerId)
      if (latest.current.ownerId === ownerId) {
        local = mergeBarServerPractice(local, latest.current.practice)
      }
      if (readOnly || !userId) {
        if (active) {
          const next = { ownerId, practice: local }
          latest.current = next
          setSnapshot(next)
          setSyncState({ ownerId, status: 'local' })
        }
        return
      }
      try {
        const cloud = await getMyBarServerPracticeState(userId)
        if (!active || activeOwner.current !== ownerId) return
        const current = latest.current.ownerId === ownerId ? latest.current.practice : local
        const merged = mergeBarServerPractice(cloud || {}, mergeBarServerPractice(local, current))
        const next = { ownerId, practice: merged }
        latest.current = next
        setSnapshot(next)
        try { writeLocalPractice(ownerId, merged) } catch { /* Keep the restored state in memory. */ }
        const hasPendingLocal = localStorage.getItem(pendingKey(ownerId)) === '1'
        setSyncState({ ownerId, status: cloud && !hasPendingLocal ? 'synced' : 'pending' })
      } catch {
        if (active && activeOwner.current === ownerId) {
          const current = latest.current.ownerId === ownerId ? latest.current.practice : local
          const restored = mergeBarServerPractice(local, current)
          const next = { ownerId, practice: restored }
          latest.current = next
          setSnapshot(next)
          setSyncState({ ownerId, status: 'local' })
        }
      }
    }
    void restore()
    return () => { active = false }
  }, [ownerId, readOnly, retry, userId])

  useEffect(() => {
    const reconnect = () => setRetry((value) => value + 1)
    window.addEventListener('online', reconnect)
    return () => window.removeEventListener('online', reconnect)
  }, [])

  useEffect(() => {
    if (readOnly || !userId || snapshot.ownerId !== ownerId || syncStatus !== 'pending') return undefined
    let active = true
    const editRevision = revision.current
    const timeout = window.setTimeout(() => {
      upsertMyBarServerPracticeState({
        ...snapshot.practice,
        expectedUserId: userId,
      })
        .then((result) => {
          if (!active || activeOwner.current !== ownerId || editRevision !== revision.current) return
          const merged = mergeBarServerPractice(snapshot.practice, result || {})
          const next = { ownerId, practice: merged }
          latest.current = next
          setSnapshot(next)
          try {
            writeLocalPractice(ownerId, merged)
            localStorage.removeItem(pendingKey(ownerId))
          } catch { /* The cloud already contains the state. */ }
          setSyncState({ ownerId, status: result ? 'synced' : 'local' })
        })
        .catch(() => {
          if (active && activeOwner.current === ownerId) setSyncState({ ownerId, status: 'local' })
        })
    }, 800)
    return () => { active = false; window.clearTimeout(timeout) }
  }, [ownerId, readOnly, snapshot, syncStatus, userId])

  const update = (patch) => {
    if (readOnly) return
    revision.current += 1
    const current = latest.current.ownerId === ownerId ? latest.current.practice : readLocalPractice(ownerId)
    const next = mergeBarServerPractice(current, typeof patch === 'function' ? patch(current) : patch)
    commit(next)
    setSyncState({ ownerId, status: userId ? 'pending' : 'local' })
  }

  return {
    listeningProgress: practice.listeningProgress,
    shiftHistory: practice.shiftHistory,
    learningStage: practice.learningStage,
    syncStatus,
    updateListeningProgress: (listeningProgress) => update({ listeningProgress }),
    updateShiftHistory: (shiftHistory) => update({ shiftHistory: mergeBarShiftHistory(shiftHistory) }),
    selectLearningStage: (learningStage) => update({
      learningStage,
      stageUpdatedAt: new Date().toISOString(),
    }),
    retrySync: () => {
      if (userId) {
        try { localStorage.setItem(pendingKey(ownerId), '1') } catch { /* Retry in memory. */ }
        setSyncState({ ownerId, status: 'pending' })
      }
      setRetry((value) => value + 1)
    },
  }
}
