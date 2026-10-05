import { RETAIL_LISTENING_DRILLS, retailListeningEngine } from '../../data/retailListening'
import { readRetailPractice } from '../../data/retailPracticeProgress'
import { useAccessStore } from '../../store/accessStore'
import useRetailPracticeProgress from '../../hooks/useRetailPracticeProgress'
export const retailPracticeConfig = {...retailListeningEngine,drills:RETAIL_LISTENING_DRILLS,readProgress:() => readRetailPractice(useAccessStore.getState().userId).listeningProgress,usePracticeProgress:useRetailPracticeProgress,position:'retail',packRoute:'/programs/retail',label:'Retail',image:'/images/retail/scenarios/sea-day-event.webp',imageAlt:'Busy cruise retail sales floor'}
