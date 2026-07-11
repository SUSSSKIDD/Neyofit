"use client"

import { useEffect, useState } from "react"

interface CountdownTimerProps {
  targetDate: Date
  className?: string
}

export default function CountdownTimer({ targetDate, className = "" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59,
  })
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime()

      if (difference <= 0) {
        // Reset to a new target 24 hours from now if expired
        const newTarget = new Date()
        newTarget.setHours(newTarget.getHours() + 24)
        targetDate = newTarget
      }

      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ hours, minutes, seconds })
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="bg-white/20 backdrop-blur-md px-2 py-1 rounded">
        <span className="font-mono font-bold">{String(timeLeft.hours).padStart(2, "0")}</span>
      </div>
      <span className="text-white font-bold">:</span>
      <div className="bg-white/20 backdrop-blur-md px-2 py-1 rounded">
        <span className="font-mono font-bold">{String(timeLeft.minutes).padStart(2, "0")}</span>
      </div>
      <span className="text-white font-bold">:</span>
      <div className="bg-white/20 backdrop-blur-md px-2 py-1 rounded">
        <span className="font-mono font-bold">{String(timeLeft.seconds).padStart(2, "0")}</span>
      </div>
    </div>
  )
}
