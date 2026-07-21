"use client"

import React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock } from "lucide-react"

interface TimePickerProps {
  value: string
  onChange: (time: string) => void
  label?: string
  disabled?: boolean
  error?: string
  className?: string
  showSeconds?: boolean
}

export function TimePicker({
  value,
  onChange,
  label,
  disabled = false,
  error,
  className = "",
  showSeconds = false,
}: TimePickerProps) {
  const [hour, setHour] = useState<string>("")
  const [minute, setMinute] = useState<string>("")
  const [ampm, setAmpm] = useState<"AM" | "PM">("AM")
  const [second, setSecond] = useState<string>("")
  const [isFocused, setIsFocused] = useState<"hour" | "minute" | "second" | "ampm" | null>(null)

  const hourRef = useRef<HTMLInputElement>(null)
  const minuteRef = useRef<HTMLInputElement>(null)
  const secondRef = useRef<HTMLInputElement>(null)
  const ampmRef = useRef<HTMLSelectElement>(null)

  // Parse value (stored in 24h format) to 12h components
  useEffect(() => {
    if (value) {
      const [h, m, s] = value.split(":")
      let hour24 = parseInt(h, 10)
      const ampm = hour24 >= 12 ? "PM" : "AM"
      let hour12 = hour24 % 12
      if (hour12 === 0) hour12 = 12
      
      setHour(hour12.toString().padStart(2, "0"))
      setMinute(m.padStart(2, "0"))
      setAmpm(ampm)
      if (showSeconds && s) setSecond(s.padStart(2, "0"))
    } else {
      setHour("")
      setMinute("")
      setSecond("")
      setAmpm("AM")
    }
  }, [value, showSeconds])

  const formatTime = useCallback(() => {
    let h = parseInt(hour, 10) || 0
    const m = minute.padStart(2, "0")
    const s = second.padStart(2, "0")

    if (ampm === "PM" && h !== 12) h += 12
    if (ampm === "AM" && h === 12) h = 0

    const hour24 = h.toString().padStart(2, "0")
    return showSeconds ? `${hour24}:${m}:${s}` : `${hour24}:${m}`
  }, [hour, minute, second, ampm, showSeconds])

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "")
    if (val.length > 2) val = val.slice(0, 2)
    const num = parseInt(val, 10)
    if (num >= 1 && num <= 12) {
      setHour(val.padStart(2, "0"))
    } else if (val === "") {
      setHour("")
    }
    onChange(formatTime())
  }

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "")
    if (val.length > 2) val = val.slice(0, 2)
    const num = parseInt(val, 10)
    if (num >= 0 && num <= 59) {
      setMinute(val.padStart(2, "0"))
    } else if (val === "") {
      setMinute("")
    }
    onChange(formatTime())
  }

  const handleSecondChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "")
    if (val.length > 2) val = val.slice(0, 2)
    const num = parseInt(val, 10)
    if (num >= 0 && num <= 59) {
      setSecond(val.padStart(2, "0"))
    } else if (val === "") {
      setSecond("")
    }
    onChange(formatTime())
  }

  const handleAmPmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAmpm(e.target.value as "AM" | "PM")
    onChange(formatTime())
  }

  const handleKeyDown = (e: React.KeyboardEvent, nextRef?: React.RefObject<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === "ArrowRight" && nextRef?.current) {
      e.preventDefault()
      nextRef.current.focus()
    }
    if (e.key === "ArrowLeft") {
      // Could add previous ref logic
    }
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="flex items-center gap-1">
        <div className="relative">
          <svg className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <input
            ref={hourRef}
            type="text"
            value={hour}
            onChange={handleHourChange}
            onFocus={() => setIsFocused("hour")}
            onBlur={() => setIsFocused(null)}
            onKeyDown={(e) => handleKeyDown(e, minuteRef)}
            maxLength={2}
            minLength={1}
            placeholder="HH"
            disabled={disabled}
            className="w-14 pl-8 text-center"
            aria-label="Hour"
          />
        </div>
        <span className="text-muted-foreground">:</span>
        <input
          ref={minuteRef}
          type="text"
          value={minute}
          onChange={handleMinuteChange}
          onFocus={() => setIsFocused("minute")}
          onBlur={() => setIsFocused(null)}
          onKeyDown={(e) => handleKeyDown(e, showSeconds ? secondRef : ampmRef)}
          maxLength={2}
          placeholder="MM"
          disabled={disabled}
          className="w-12 text-center"
          aria-label="Minute"
        />
        {showSeconds && (
          <>
            <span className="text-muted-foreground">:</span>
            <input
              ref={secondRef}
              type="text"
              value={second}
              onChange={handleSecondChange}
              onFocus={() => setIsFocused("second")}
              onBlur={() => setIsFocused(null)}
              onKeyDown={(e) => handleKeyDown(e, ampmRef)}
              maxLength={2}
              placeholder="SS"
              disabled={disabled}
              className="w-12 text-center"
              aria-label="Second"
            />
          </>
        )}
        <select
          ref={ampmRef}
          value={ampm}
          onChange={handleAmPmChange}
          disabled={disabled}
          className="w-24"
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}