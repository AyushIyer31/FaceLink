import { Card } from "@/components/ui/card"

interface ScheduleEvent {
  id: string
  time: string
  title: string
  description?: string
}

const todayEvents: ScheduleEvent[] = [
  {
    id: "1",
    time: "9:00 AM",
    title: "Breakfast",
    description: "Oatmeal with berries",
  },
  {
    id: "2",
    time: "11:30 AM",
    title: "Morning Walk",
    description: "Around the neighborhood with Margaret",
  },
  {
    id: "3",
    time: "3:00 PM",
    title: "Doctor Appointment",
    description: "Dr. Lee - Regular checkup",
  },
  {
    id: "4",
    time: "6:30 PM",
    title: "Dinner with Ravi",
    description: "Ravi is bringing takeout from your favorite restaurant",
  },
  {
    id: "5",
    time: "8:00 PM",
    title: "Evening Routine",
    description: "Medication and bedtime",
  },
]

export function CalendarView() {
  const currentTime = new Date()
  const currentHour = currentTime.getHours()

  function isUpcoming(timeStr: string): boolean {
    const hour = Number.parseInt(timeStr.split(":")[0])
    const isPM = timeStr.includes("PM")
    const eventHour = isPM && hour !== 12 ? hour + 12 : hour === 12 && !isPM ? 0 : hour
    return eventHour >= currentHour
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="p-6 md:p-8">
        <header className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Today's Schedule</h2>
          <p className="text-xl md:text-2xl text-muted-foreground mt-2">
            {currentTime.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </header>

        <div className="space-y-4">
          {todayEvents.map((event) => (
            <Card
              key={event.id}
              className={`p-6 ${isUpcoming(event.time) ? "bg-primary/10 border-primary border-2" : "bg-muted/30"}`}
            >
              <div className="flex items-start gap-4">
                <div className="min-w-[120px]">
                  <p className="text-2xl md:text-3xl font-bold text-primary">{event.time}</p>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">{event.title}</h3>
                  {event.description && (
                    <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">{event.description}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  )
}
