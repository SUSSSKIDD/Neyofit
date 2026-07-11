"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Clock } from "lucide-react"

interface LimitedSpotsBadgeProps {
  initialSpots?: number
  minSpots?: number
  maxSpots?: number
}

export default function LimitedSpotsBadge({ initialSpots = 15, minSpots = 3, maxSpots = 20 }: LimitedSpotsBadgeProps) {
  const [spotsLeft, setSpotsLeft] = useState(initialSpots)
  const [isFlashing, setIsFlashing] = useState(false)

  useEffect(() => {
    // Randomly decrease spots every 20-40 seconds
    const interval = setInterval(
      () => {
        setSpotsLeft((prev) => {
          // Don't go below minSpots
          if (prev <= minSpots) return prev

          // Flash the badge when spots decrease
          setIsFlashing(true)
          setTimeout(() => setIsFlashing(false), 1000)

          return prev - 1
        })
      },
      Math.random() * 20000 + 20000,
    ) // Random interval between 20-40 seconds

    return () => clearInterval(interval)
  }, [minSpots])

  return (
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{
        scale: isFlashing ? 1.1 : 1,
        transition: {
          type: "spring",
          stiffness: 500,
          damping: 15,
        },
      }}
    >
      <div className="flex items-center gap-1 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1.5 rounded-full shadow-md">
        <Clock className="h-4 w-4" />
        <span className="font-bold">Only {spotsLeft} spots left today!</span>
      </div>
    </motion.div>
  )
}
