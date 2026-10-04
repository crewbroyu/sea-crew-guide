import { createContext, useContext } from 'react'

// Only mounted by the admin inspection workspace; ordinary lessons default to false.
export const TrainingInspectionContext = createContext(false)
export const useTrainingInspection = () => useContext(TrainingInspectionContext)
