"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { fetchTasks, fetchTimeline, type Task, type TimelineEvent } from "@/lib/api"
import { VoicePlanner } from "@/components/voice-planner"

interface DayData {
  date: Date
  dateStr: string
  dayName: string
  tasks: Task[]
  events: TimelineEvent[]
}

interface GroupedItem {
  time: string
  type: 'task' | 'event'
  data: Task | TimelineEvent
}

export function CalendarView() {
  const [weekDays, setWeekDays] = useState<DayData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null)
  
  const now = new Date()

  // Get the start of the current week (Monday)
  function getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust to Monday
    return new Date(d.setDate(diff))
  }

  // Format date to YYYY-MM-DD
  function formatDateStr(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  // Load all tasks and events for the week
  async function loadWeekData() {
    setIsLoading(true)
    const weekStart = getWeekStart(now)
    const days: DayData[] = []

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      const dateStr = formatDateStr(date)
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" })

      const [tasks, events] = await Promise.all([
        fetchTasks(dateStr),
        fetchTimeline(dateStr),
      ])

      days.push({
        date,
        dateStr,
        dayName,
        tasks: tasks || [],
        events: events || [],
      })
    }

    setWeekDays(days)
    setIsLoading(false)
  }

  useEffect(() => {
    loadWeekData()

    // Set up polling for new recognition events every 10 seconds
    const interval = setInterval(() => {
      loadWeekData()
    }, 10000)

    setPollInterval(interval)

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [])

  function formatTime(timeStr: string): string {
    try {
      const [hours, minutes] = timeStr.split(':').map(Number)
      const period = hours >= 12 ? 'PM' : 'AM'
      const displayHour = hours % 12 || 12
      return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`
    } catch {
      return timeStr
    }
  }

  function formatEventTime(isoTimestamp: string): string {
    try {
      const date = new Date(isoTimestamp)
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    } catch {
      return isoTimestamp
    }
  }

  function getGroupedItems(day: DayData): GroupedItem[] {
    const items: GroupedItem[] = []

    // Add tasks
    day.tasks.forEach((task) => {
      items.push({ time: task.time, type: 'task', data: task })
    })

    // Add events
    day.events.forEach((event) => {
      items.push({ time: formatEventTime(event.timestamp), type: 'event', data: event })
    })

    // Sort by time
    items.sort((a, b) => {
      const timeA = a.time.replace(/[^\d:]/g, '')
      const timeB = b.time.replace(/[^\d:]/g, '')
      return timeA.localeCompare(timeB)
    })

    return items
  }

  function isToday(dateStr: string): boolean {
    return dateStr === formatDateStr(now)
  }

  // Render expanded day details into the modal
  function renderDayDetails(day?: DayData | undefined) {
    if (!day) return null
    const items = getGroupedItems(day)

    if (items.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-8">
          No tasks or encounters scheduled
        </p>
      )
    }

    return items.map((item, idx) => (
      <div key={`${item.type}-${idx}`} className="pb-4 border-b last:border-b-0">
        {item.type === 'task' ? (
          (() => {
            const task = item.data as Task
            return (
              <div>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-2xl font-bold text-primary">
                    {formatTime(task.time)}
                  </span>
                  <h3 className="text-xl md:text-2xl font-semibold text-foreground">
                    {task.title}
                  </h3>
                  {task.completed && (
                    <span className="text-lg text-green-600">✓</span>
                  )}
                </div>
                {task.description && (
                  <p className="text-lg text-muted-foreground ml-24">
                    {task.description}
                  </p>
                )}
              </div>
            )
          })()
        ) : (
          (() => {
            const event = item.data as TimelineEvent
            return (
              <div>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-2xl font-bold text-blue-600">
                    {formatEventTime(event.timestamp)}
                  </span>
                  <h3 className="text-xl md:text-2xl font-semibold text-foreground">
                    {event.person_name || 'Unknown Person'}
                  </h3>
                </div>
                <div className="space-y-1 ml-24 text-lg text-muted-foreground">
                  {event.person_relationship && (
                    <p>Relationship: {event.person_relationship}</p>
                  )}
                  {event.confidence !== undefined && (
                    <p>
                      Confidence:{' '}
                      <span className="font-semibold">
                        {(event.confidence * 100).toFixed(1)}%
                      </span>
                    </p>
                  )}
                  {event.notes && <p>Notes: {event.notes}</p>}
                </div>
              </div>
            )
          })()
        )}
      </div>
    ))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">Weekly Calendar</h1>
        <p className="text-xl md:text-2xl text-muted-foreground">
          {now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">Loading week...</p>
        </div>
      )}

      {!isLoading && (
        <div>
          <div className="mb-6">
            <VoicePlanner onDone={loadWeekData} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {weekDays.map((day) => {
              const hasItems = day.tasks.length > 0 || day.events.length > 0
              const isCurrentDay = isToday(day.dateStr)

              return (
                <Card
                  key={day.dateStr}
                  className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                    isCurrentDay
                      ? 'border-2 border-primary bg-primary/5'
                      : 'border border-border hover:border-primary'
                  }`}
                  onClick={() => setExpandedDay(day.dateStr)}
                >
                  <div className="mb-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                      {day.dayName}
                    </h2>
                    <p className="text-lg md:text-xl text-muted-foreground">
                      {day.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                    {isCurrentDay && (
                      <span className="inline-block mt-2 text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                        Today
                      </span>
                    )}
                  </div>

                  {hasItems ? (
                    <div className="space-y-3">
                      {day.tasks.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground mb-2">
                            Tasks ({day.tasks.length})
                          </p>
                          <div className="space-y-2">
                            {day.tasks.slice(0, 2).map((task) => (
                              <div
                                key={task.id}
                                className={`text-sm p-2 rounded ${
                                  task.completed
                                    ? 'bg-muted/50 line-through text-muted-foreground'
                                    : 'bg-primary/10 text-foreground'
                                }`}
                              >
                                <span className="font-medium">{formatTime(task.time)}</span>
                                <span className="text-xs ml-2">{task.title}</span>
                              </div>
                            ))}
                            {day.tasks.length > 2 && (
                              <p className="text-xs text-muted-foreground">
                                +{day.tasks.length - 2} more
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {day.events.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground mb-2">
                            Encounters ({day.events.length})
                          </p>
                          <div className="space-y-2">
                            {day.events.slice(0, 2).map((event) => (
                              <div
                                key={event.id}
                                className="text-sm p-2 rounded bg-blue/10 text-foreground"
                              >
                                <span className="font-medium">{formatEventTime(event.timestamp)}</span>
                                {event.person_name && (
                                  <span className="text-xs ml-2">
                                    {event.person_name}
                                    {event.person_relationship && ` (${event.person_relationship})`}
                                  </span>
                                )}
                              </div>
                            ))}
                            {day.events.length > 2 && (
                              <p className="text-xs text-muted-foreground">
                                +{day.events.length - 2} more
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No events or tasks</p>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => setExpandedDay(day.dateStr)}
                  >
                    View Details
                  </Button>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Expanded Day Detail Modal */}
      {expandedDay && (
        <Dialog open={!!expandedDay} onOpenChange={() => setExpandedDay(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl md:text-3xl font-bold">
                {weekDays
                  .find((d) => d.dateStr === expandedDay)
                  ?.date.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {renderDayDetails(weekDays.find((d) => d.dateStr === expandedDay))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
