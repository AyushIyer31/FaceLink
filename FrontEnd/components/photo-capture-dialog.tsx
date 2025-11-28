"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Camera, X } from "lucide-react"

interface PhotoCaptureDialogProps {
  open: boolean
  onClose: () => void
  onCapture: (imageBase64: string) => void
  personName: string
}

export function PhotoCaptureDialog({ 
  open, 
  onClose, 
  onCapture,
  personName 
}: PhotoCaptureDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [captured, setCaptured] = useState<string | null>(null)

  useEffect(() => {
    if (open && !stream) {
      startCamera()
    }
    return () => {
      stopCamera()
    }
  }, [open])

  async function startCamera() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error("Camera access failed:", err)
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  function capturePhoto() {
    if (!videoRef.current) return
    
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.drawImage(videoRef.current, 0, 0)
    const imageData = canvas.toDataURL('image/jpeg', 0.9)
    setCaptured(imageData)
  }

  function handleUsePhoto() {
    if (!captured) return
    onCapture(captured)
    handleClose()
  }

  function handleClose() {
    stopCamera()
    setCaptured(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <h2 className="text-2xl font-semibold mb-4">
          Capture Photo for {personName}
        </h2>
        
        <div className="space-y-4">
          {!captured ? (
            <>
              <div className="relative bg-muted rounded-lg overflow-hidden aspect-video">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={capturePhoto} size="lg" className="flex-1">
                  <Camera className="mr-2 h-5 w-5" />
                  Capture Photo
                </Button>
                <Button onClick={handleClose} variant="outline" size="lg">
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="relative bg-muted rounded-lg overflow-hidden">
                <img src={captured} alt="Captured" className="w-full" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUsePhoto} size="lg" className="flex-1">
                  Use This Photo
                </Button>
                <Button onClick={() => setCaptured(null)} variant="outline" size="lg">
                  Retake
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
