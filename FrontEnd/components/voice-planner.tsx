"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createTask } from "@/lib/api"

function parseTimeFromText(text: string): string | null {
  // Try to find patterns like '3 PM', '3:30 pm', 'at 15:00'
  const timeRegex = /(\b\d{1,2}(:\d{2})?\s*(am|pm)\b)|(at\s+\d{1,2}(:\d{2})?\s*(am|pm)?)|(\b\d{1,2}:\d{2}\b)/i
  const m = text.match(timeRegex)
  if (!m) return null

  // Extract numbers
  const matched = m[0]
  // Normalize
  const ampmMatch = matched.match(/(am|pm)/i)
  let hours = 0
  let minutes = 0
  if (matched.includes(':')) {
    const parts = matched.replace(/[^0-9:]/g, '').split(':')
    hours = parseInt(parts[0], 10)
    minutes = parseInt(parts[1] || '0', 10)
  } else {
    const num = matched.replace(/[^0-9]/g, '')
    hours = parseInt(num || '0', 10)
    minutes = 0
  }
  if (ampmMatch) {
    const ampm = ampmMatch[0].toLowerCase()
    if (ampm === 'pm' && hours < 12) hours += 12
    if (ampm === 'am' && hours === 12) hours = 0
  }

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

export function VoicePlanner({ onDone }: { onDone?: () => void }) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const startListening = async () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setStatus('Speech recognition not supported in this browser.')
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setListening(true)
      setStatus('Listening... Speak your daily plan clearly.')
      setTranscript('')
    }

    recognition.onerror = (e: any) => {
      setStatus('Error during recognition: ' + (e.error || 'unknown'))
      setListening(false)
    }

    recognition.onresult = (event: any) => {
      const text = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join(' ')
      setTranscript(text)
      setStatus('Transcribed. Parsing and saving...')
      // Parse and create tasks
      parseAndCreateTasks(text)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognition.start()
  }

  async function parseAndCreateTasks(text: string) {
    // Split into phrases by 'then' or comma
    const parts = text.split(/\bthen\b|,|\.|and then/gi).map(p => p.trim()).filter(Boolean)
    const created: string[] = []
    const skipped: string[] = []
    const today = new Date().toISOString().split('T')[0]

    for (const part of parts) {
      const time = parseTimeFromText(part)
      if (!time) {
        skipped.push(part)
        continue
      }

      // Use the spoken phrase as the title (shorten)
      const title = part.replace(/at\s+\d{1,2}(:\d{2})?\s*(am|pm)?/i, '').trim()
      if (!title) {
        skipped.push(part)
        continue
      }

      const payload = {
        title,
        time,
        date: today,
        description: '',
        reminder: false,
      }

      const res = await createTask(payload as any)
      if (res) created.push(`${time} ${title}`)
      else skipped.push(part)
    }

    setStatus(`Saved ${created.length} items. Skipped ${skipped.length} items.`)
    if (onDone) onDone()
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Button variant={listening ? 'destructive' : 'default'} onClick={() => (listening ? null : startListening())}>
          {listening ? 'Listening...' : 'Speak Today\'s Plan'}
        </Button>
        <Button variant="outline" onClick={() => { setTranscript(''); setStatus(null) }}>
          Clear
        </Button>
      </div>

      {transcript && (
        <div className="p-3 bg-muted/10 rounded">
          <p className="italic">"{transcript}"</p>
        </div>
      )}

      {status && <p className="text-sm text-muted-foreground">{status}</p>}
    </div>
  )
}
