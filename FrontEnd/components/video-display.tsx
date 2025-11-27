import type { RefObject } from "react"

interface VideoDisplayProps {
  videoRef: RefObject<HTMLVideoElement>
}

export function VideoDisplay({ videoRef }: VideoDisplayProps) {
  return (
    <div className="relative bg-muted rounded-lg overflow-hidden aspect-video">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      <div className="absolute inset-0 border-4 border-primary/20 rounded-lg pointer-events-none" />
    </div>
  )
}
