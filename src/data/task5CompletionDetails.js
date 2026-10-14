// Task 5 completion proofs used to carry an inline base64 photo (`image`). The photos filled
// browser storage and were synced into job_preparation_profiles, so they are no longer kept.
export const TASK5_STORAGE_KEYS = ['task5_data', 'task5_result']

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

export const stripCompletionImages = (details) => {
  if (!isPlainObject(details)) return {}
  return Object.fromEntries(Object.entries(details).map(([courseId, detail]) => {
    if (!isPlainObject(detail)) return [courseId, detail]
    const { image: _image, ...rest } = detail
    return [courseId, rest]
  }))
}

const hasCompletionImages = (details) => isPlainObject(details)
  && Object.values(details).some((detail) => isPlainObject(detail) && 'image' in detail)

// Rewrites stored Task 5 records without photos. Returns the keys that were cleaned.
export const removeStoredTask5Images = (storage) => {
  const cleaned = []
  TASK5_STORAGE_KEYS.forEach((key) => {
    try {
      const raw = storage.getItem(key)
      if (!raw) return
      const record = JSON.parse(raw)
      if (!isPlainObject(record) || !hasCompletionImages(record.completedCourseDetails)) return
      storage.setItem(key, JSON.stringify({
        ...record,
        completedCourseDetails: stripCompletionImages(record.completedCourseDetails),
      }))
      cleaned.push(key)
    } catch (error) {
      console.warn(`Unable to remove Task 5 photos from ${key}:`, error)
    }
  })
  return cleaned
}
