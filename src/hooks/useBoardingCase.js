import { useCallback, useEffect, useState } from 'react'
import {
  createDefaultBoardingCase,
  loadBoardingCase,
  saveBoardingCase,
} from '../services/boardingCaseService'

export default function useBoardingCase() {
  const [boardingCase, setBoardingCase] = useState(createDefaultBoardingCase)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncState, setSyncState] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const result = await loadBoardingCase()
        if (!active) return
        const { _syncState, ...value } = result
        setBoardingCase(value)
        setSyncState(_syncState || 'synced')
      } catch (loadError) {
        if (!active) return
        console.error('Failed to load boarding case:', loadError)
        setError('登船档案加载失败，请刷新后重试。')
        setSyncState('error')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const updateBoardingCase = useCallback((nextValue) => {
    setBoardingCase((current) => (
      typeof nextValue === 'function' ? nextValue(current) : { ...current, ...nextValue }
    ))
    setError('')
  }, [])

  const save = useCallback(async (nextValue) => {
    const value = nextValue || boardingCase
    setSaving(true)
    setError('')
    try {
      const result = await saveBoardingCase(value)
      const { _syncState, ...savedValue } = result
      setBoardingCase(savedValue)
      setSyncState(_syncState || 'synced')
      return savedValue
    } catch (saveError) {
      console.error('Failed to save boarding case:', saveError)
      setError('保存失败，请检查网络后重试。')
      setSyncState('error')
      throw saveError
    } finally {
      setSaving(false)
    }
  }, [boardingCase])

  return {
    boardingCase,
    updateBoardingCase,
    loading,
    saving,
    syncState,
    error,
    save,
  }
}

