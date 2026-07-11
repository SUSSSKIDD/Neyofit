"use client"

import { useEffect, useState } from "react"
import { User } from "lucide-react"

export default function LiveUserCounter() {
  const [userCount, setUserCount] = useState(135) // Start with a consistent value
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // Start with a base number between 120-150
    const baseCount = Math.floor(Math.random() * 30) + 120
    setUserCount(baseCount)

    // Randomly increase or decrease the count every few seconds
    const interval = setInterval(() => {
      setUserCount((prevCount) => {
        const change = Math.floor(Math.random() * 5) - 2 // -2 to +2
        return Math.max(100, prevCount + change) // Ensure count doesn't go below 100
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  if (!isClient) {
    return (
      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">
        <div className="relative">
          <User className="h-4 w-4 text-white" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
        </div>
        <span className="text-sm font-medium text-white">{userCount} people online now</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">
      <div className="relative">
        <User className="h-4 w-4 text-white" />
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
      </div>
      <span className="text-sm font-medium text-white">{userCount} people online now</span>
    </div>
  )
}
