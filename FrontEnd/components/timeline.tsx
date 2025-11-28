"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { fetchTimeline, type TimelineEvent } from "@/lib/api"

export function Timeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTimeline()
    // Refresh timeline every 30 seconds
    const interval = setInterval(loadTimeline, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadTimeline() {
    setIsLoading(true)
    const data = await fetchTimeline()
    setEvents(data)
    setIsLoading(false)
  }

  function formatTime(timestamp: string): string {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
  }

  function getEventIcon(eventType: string): string {
    switch (eventType) {
      case 'recognition':
        return '👤'
      case 'help_requested':
        return '🆘'
      case 'task_completed':
        return '✅'
      default:
        return '📝'
    }
  }

  function getEventTitle(event: TimelineEvent): string {
    switch (event.event_type) {
      case 'recognition':
        return event.person_name || 'Someone recognized'
      case 'help_requested':
        return 'Help Requested'
      case 'task_completed':
        return 'Task Completed'
      default:
        return event.event_type
    }
  }

  function getEventSubtitle(event: TimelineEvent): string | null {
    if (event.event_type === 'recognition' && event.person_relationship) {
      return event.person_relationship
    }
    return event.notes || null
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Today's Timeline</h2>
      {isLoading ? (
        <p className="text-muted-foreground text-lg">Loading...</p>
      ) : events.length === 0 ? (
        <p className="text-muted-foreground text-lg">No activity yet today</p>
      ) : (
        <ul className="space-y-4" role="list">
          {events.map((event) => (
            <li key={event.id} className="border-l-4 border-primary pl-4 py-2">
              <div className="flex items-start gap-2">
                <span className="text-xl">{getEventIcon(event.event_type)}</span>
                <div className="flex-1">
                  <p className="text-xl font-semibold">{getEventTitle(event)}</p>
                  {getEventSubtitle(event) && (
                    <p className="text-lg text-muted-foreground">{getEventSubtitle(event)}</p>
                  )}
                  <time className="text-sm text-muted-foreground block mt-1">
                    {formatTime(event.timestamp)}
                  </time>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
