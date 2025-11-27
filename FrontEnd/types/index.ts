export interface Person {
  id: string
  name: string
  relationship: string
  reminder: string
}

export interface TimelineEvent {
  id: string
  personName: string
  relationship: string
  timestamp: Date
}

export interface ScheduleEvent {
  id: string
  time: string
  title: string
  description?: string
}
