"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Toggle } from "@/components/ui/toggle"
import { VideoDisplay } from "@/components/video-display"
import { PersonInfo } from "@/components/person-info"
import { Timeline } from "@/components/timeline"
import { PeopleList } from "@/components/people-list"
import { HelpButton } from "@/components/help-button"
import { CalendarView } from "@/components/calendar-view"
import { LocationView } from "@/components/location-view"
import type { Person, TimelineEvent } from "@/types"

const initialPeople: Person[] = [
  {
    id: "1",
    name: "Anika",
    relationship: "Daughter",
    reminder: "Lives in Seattle. Works as a teacher. Loves gardening.",
  },
  {
    id: "2",
    name: "Ravi",
    relationship: "Son",
    reminder: "Engineer at tech company. Visits every Sunday. Just got engaged.",
  },
  {
    id: "3",
    name: "Dr. Lee",
    relationship: "Neurologist",
    reminder: "Your doctor. Appointments on Tuesdays. Likes to hear about your walks.",
  },
  {
    id: "4",
    name: "Margaret",
    relationship: "Neighbor",
    reminder: "Brings fresh bread on Thursdays. Has a golden retriever named Buddy.",
  },
]

export default function HomePage() {
  const [people, setPeople] = useState<Person[]>(initialPeople)
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])
  const [currentPerson, setCurrentPerson] = useState<Person | null>(null)
  const [isVisitorMode, setIsVisitorMode] = useState(false)
  const [activeTab, setActiveTab] = useState<"home" | "calendar" | "location">("home")
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    startCamera()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  async function startCamera() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn("Camera API not available in this environment")
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
    } catch (err) {
      console.error("Camera access failed:", err)
    }
  }

  function recognizePerson() {
    setIsVisitorMode(true)

    setTimeout(() => {
      const randomPerson = people[Math.floor(Math.random() * people.length)]
      setCurrentPerson(randomPerson)

      const newEvent: TimelineEvent = {
        id: Date.now().toString(),
        personName: randomPerson.name,
        relationship: randomPerson.relationship,
        timestamp: new Date(),
      }
      setTimelineEvents((prev) => [newEvent, ...prev])
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <header className="mb-6">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">FaceLink</h1>
        <p className="text-xl md:text-2xl text-muted-foreground mt-2">Helping you remember the people you love</p>
      </header>

      <nav className="mb-6 flex gap-3" role="tablist" aria-label="Main navigation">
        <Button
          onClick={() => setActiveTab("home")}
          variant={activeTab === "home" ? "default" : "outline"}
          size="lg"
          className="text-xl px-8 py-6 font-semibold"
          role="tab"
          aria-selected={activeTab === "home"}
        >
          Home
        </Button>
        <Button
          onClick={() => setActiveTab("calendar")}
          variant={activeTab === "calendar" ? "default" : "outline"}
          size="lg"
          className="text-xl px-8 py-6 font-semibold"
          role="tab"
          aria-selected={activeTab === "calendar"}
        >
          Calendar
        </Button>
        <Button
          onClick={() => setActiveTab("location")}
          variant={activeTab === "location" ? "default" : "outline"}
          size="lg"
          className="text-xl px-8 py-6 font-semibold"
          role="tab"
          aria-selected={activeTab === "location"}
        >
          Location
        </Button>
      </nav>

      {activeTab === "home" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <main className="lg:col-span-2 space-y-6">
            <HelpButton />

            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground">Live View</h2>
                <Toggle
                  pressed={isVisitorMode}
                  onPressedChange={setIsVisitorMode}
                  className="text-sm px-3 py-1 font-semibold"
                  aria-label="Toggle Visitor Mode"
                >
                  {isVisitorMode ? "Visitor Mode: ON" : "Visitor Mode: OFF"}
                </Toggle>
              </div>
              <VideoDisplay videoRef={videoRef} />
            </Card>

            {currentPerson && <PersonInfo person={currentPerson} />}
          </main>

          <aside className="space-y-6">
            <Timeline events={timelineEvents} />
            <PeopleList people={people} onUpdate={setPeople} />
          </aside>
        </div>
      )}

      {activeTab === "calendar" && <CalendarView />}
      {activeTab === "location" && <LocationView />}
    </div>
  )
}
