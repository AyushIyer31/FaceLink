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
import { 
  recognizeFace, 
  captureVideoFrame,
  announcePersonWithTTS,
  type Person
} from "@/lib/api"

export default function HomePage() {
  const [currentPerson, setCurrentPerson] = useState<Person | null>(null)
  const [isVisitorMode, setIsVisitorMode] = useState(false)
  const [isRecognizing, setIsRecognizing] = useState(false)
  const [activeTab, setActiveTab] = useState<"home" | "calendar" | "location">("home")
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recognitionIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Start camera on mount
  useEffect(() => {
    startCamera()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (recognitionIntervalRef.current) {
        clearInterval(recognitionIntervalRef.current)
      }
    }
  }, [])

  // Handle visitor mode face recognition
  useEffect(() => {
    if (isVisitorMode && videoRef.current) {
      // Start periodic face recognition when visitor mode is ON
      recognitionIntervalRef.current = setInterval(async () => {
        if (videoRef.current && !isRecognizing) {
          await performRecognition()
        }
      }, 3000) // Check every 3 seconds
    } else {
      // Stop recognition when visitor mode is OFF
      if (recognitionIntervalRef.current) {
        clearInterval(recognitionIntervalRef.current)
        recognitionIntervalRef.current = null
      }
    }

    return () => {
      if (recognitionIntervalRef.current) {
        clearInterval(recognitionIntervalRef.current)
      }
    }
  }, [isVisitorMode, isRecognizing])

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

  async function performRecognition() {
    if (!videoRef.current || isRecognizing) return

    setIsRecognizing(true)
    
    try {
      const frameData = captureVideoFrame(videoRef.current)
      if (!frameData) {
        setIsRecognizing(false)
        return
      }

      const result = await recognizeFace(frameData)
      
      if (result && result.recognized && result.person) {
        setCurrentPerson(result.person)
        
        // Announce with TTS if should_announce is true (cooldown passed)
        if (result.should_announce) {
          announcePersonWithTTS(result.person)
        }
      }
    } catch (error) {
      console.error("Recognition error:", error)
    }
    
    setIsRecognizing(false)
  }

  // Manual recognition trigger
  function handleManualRecognition() {
    performRecognition()
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
                <div className="flex items-center gap-4">
                  <Toggle
                    pressed={isVisitorMode}
                    onPressedChange={setIsVisitorMode}
                    className="text-sm px-3 py-1 font-semibold"
                    aria-label="Toggle Visitor Mode"
                  >
                    {isVisitorMode ? "Visitor Mode: ON" : "Visitor Mode: OFF"}
                  </Toggle>
                  <Button 
                    onClick={handleManualRecognition} 
                    disabled={isRecognizing}
                    variant="outline"
                  >
                    {isRecognizing ? "Scanning..." : "Scan Face"}
                  </Button>
                </div>
              </div>
              <VideoDisplay videoRef={videoRef} />
              {isVisitorMode && (
                <p className="text-center text-muted-foreground mt-4">
                  {isRecognizing ? "🔍 Scanning for faces..." : "✅ Visitor mode active - scanning every 3 seconds"}
                </p>
              )}
            </Card>

            {currentPerson && <PersonInfo person={currentPerson} />}
          </main>

          <aside className="space-y-6">
            <Timeline />
            <PeopleList />
          </aside>
        </div>
      )}

      {activeTab === "calendar" && <CalendarView />}
      {activeTab === "location" && <LocationView />}
    </div>
  )
}
