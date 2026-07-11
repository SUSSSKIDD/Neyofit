"use client"

import { useState } from "react"

interface VideoBackgroundProps {
  videoSrc: string
  fallbackImageSrc: string
}

export default function VideoBackground({ videoSrc, fallbackImageSrc }: VideoBackgroundProps) {
  const [videoError, setVideoError] = useState(false)

  return (
    <>
      <div className="absolute inset-0 bg-black/40 z-10"></div>
      {!videoError ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          onError={() => setVideoError(true)}
        >
          <source src={videoSrc} type="video/mp4" />
          {/* Fallback to image if video fails */}
          <img
            src={fallbackImageSrc || "/placeholder.svg"}
            alt="Fitness background"
            className="w-full h-full object-cover"
          />
        </video>
      ) : (
        <img
          src={fallbackImageSrc || "/placeholder.svg"}
          alt="Fitness background"
          className="w-full h-full object-cover"
        />
      )}
    </>
  )
}
