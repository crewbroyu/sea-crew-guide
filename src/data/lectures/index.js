import { barServerDay1Lecture } from './barServerDay1Lecture.js'
import barServerDay1Audio from './audio/bar-server-day1.json'

const LECTURES_BY_DAY = {
  'bar-server:service-role': barServerDay1Lecture,
}

const AUDIO_BY_LECTURE = {
  [barServerDay1Lecture.id]: barServerDay1Audio,
}

export const getDayLecture = (courseSlug, dayId) => LECTURES_BY_DAY[`${courseSlug}:${dayId}`] || null

export const getDayLectureAudio = (lectureId) => AUDIO_BY_LECTURE[lectureId] || null
