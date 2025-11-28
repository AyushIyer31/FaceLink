"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { fetchTasks, type Task } from "@/lib/api"

export function CalendarView() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const currentTime = new Date()

  useEffect(() => {
    async function loadTasks() {
      setIsLoading(true)
      // Get today's date in YYYY-MM-DD format
      const today = currentTime.toISOString().split('T')[0]
      const tasksData = await fetchTasks(today)
      setTasks(tasksData)
      setIsLoading(false)
    }
    loadTasks()
  }, [])

  function isUpcoming(timeStr: string): boolean {
    // Parse time like "08:00" or "14:30"
    const [hours, minutes] = timeStr.split(':').map(Number)
    const currentHour = currentTime.getHours()
    const currentMinute = currentTime.getMinutes()
    
    if (hours > currentHour) return true
    if (hours === currentHour && minutes >= currentMinute) return true
    return false
  }

  function formatTime(timeStr: string): string {
    // Convert "08:00" to "8:00 AM"
    const [hours, minutes] = timeStr.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHour = hours % 12 || 12
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`
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

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-xl text-muted-foreground">Loading schedule...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xl text-muted-foreground">No tasks scheduled for today.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <Card
                key={task.id}
                className={`p-6 ${
                  task.completed 
                    ? "bg-muted/30 opacity-60" 
                    : isUpcoming(task.time) 
                      ? "bg-primary/10 border-primary border-2" 
                      : "bg-muted/30"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="min-w-[120px]">
                    <p className={`text-2xl md:text-3xl font-bold ${task.completed ? "line-through text-muted-foreground" : "text-primary"}`}>
                      {formatTime(task.time)}
                    </p>
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-2xl md:text-3xl font-semibold mb-2 ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">{task.description}</p>
                    )}
                  </div>
                  {task.completed && (
                    <span className="text-2xl">✓</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
