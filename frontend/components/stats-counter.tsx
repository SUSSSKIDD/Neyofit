"use client"

import { useEffect, useRef } from "react"

interface StatsCounterProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  formatter?: (value: number) => string
}

export default function StatsCounter({
  value,
  duration = 2000,
  prefix = "",
  suffix = "",
  formatter = (val) => val.toLocaleString(),
}: StatsCounterProps) {
  const counterRef = useRef<HTMLDivElement>(null)
  const startValue = useRef(0)
  const startTime = useRef(0)
  const endValue = useRef(value)

  const countUp = (timestamp: number) => {
    if (!startTime.current) startTime.current = timestamp

    const progress = Math.min((timestamp - startTime.current) / duration, 1)
    const currentValue = Math.floor(startValue.current + progress * (endValue.current - startValue.current))

    if (counterRef.current) {
      counterRef.current.textContent = `${prefix}${formatter(currentValue)}${suffix}`
    }

    if (progress < 1) {
      requestAnimationFrame(countUp)
    }
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            requestAnimationFrame(countUp)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 },
    )

    if (counterRef.current) {
      observer.observe(counterRef.current)
    }

    return () => {
      if (counterRef.current) {
        observer.unobserve(counterRef.current)
      }
    }
  }, [value])

  return (
    <div ref={counterRef}>
      {prefix}
      {formatter(0)}
      {suffix}
    </div>
  )
}
