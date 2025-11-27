import { Card } from "@/components/ui/card"
import type { TimelineEvent } from "@/types"

interface TimelineProps {
  events: TimelineEvent[]
}

export function Timeline({ events }: TimelineProps) {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Today's Timeline</h2>
      {events.length === 0 ? (
        <p className="text-muted-foreground text-lg">No recognitions yet today</p>
      ) : (
        <ul className="space-y-4" role="list">
          {events.map((event) => (
            <li key={event.id} className="border-l-4 border-primary pl-4 py-2">
              <p className="text-xl font-semibold">{event.personName}</p>
              <p className="text-lg text-muted-foreground">{event.relationship}</p>
              <time className="text-sm text-muted-foreground block mt-1">
                {event.timestamp.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </time>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
