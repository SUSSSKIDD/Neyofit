"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  apiService,
  type TimeSlot,
  type GymSlotData,
  generateSlotId,
} from "@/lib/api"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, Save } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]

interface DayState {
  isClosed: boolean
  slots: TimeSlot[]
}

type WeekState = Record<string, DayState>

export default function GymSlotsPage() {
  const params = useParams()
  const gymId = params.id as string

  const [loading, setLoading] = useState(true)
  const [savingDay, setSavingDay] = useState<string | null>(null)
  const [week, setWeek] = useState<WeekState>({})

  useEffect(() => {
    async function fetchSlots() {
      try {
        const res = await apiService.getGymSlots(gymId)
        const initial: WeekState = {}
        DAYS_OF_WEEK.forEach((day) => {
          initial[day] = { isClosed: false, slots: [] }
        })

        if (res.data && Array.isArray(res.data)) {
          res.data.forEach((slot: GymSlotData) => {
            const dayKey = slot.dayOfWeek.toLowerCase()
            if (initial[dayKey]) {
              initial[dayKey] = {
                isClosed: slot.isClosed,
                slots: slot.slots || [],
              }
            }
          })
        }

        setWeek(initial)
      } catch {
        toast.error("Failed to load time slots")
      } finally {
        setLoading(false)
      }
    }
    fetchSlots()
  }, [gymId])

  const toggleClosed = (day: string) => {
    setWeek((prev) => ({
      ...prev,
      [day]: { ...prev[day], isClosed: !prev[day].isClosed },
    }))
  }

  const addSlot = (day: string) => {
    const newSlot: TimeSlot = {
      id: generateSlotId(),
      name: "New Slot",
      startTime: "09:00",
      endTime: "21:00",
      isActive: true,
    }
    setWeek((prev) => ({
      ...prev,
      [day]: { ...prev[day], slots: [...prev[day].slots, newSlot] },
    }))
  }

  const removeSlot = (day: string, slotId: string) => {
    setWeek((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter((s) => s.id !== slotId),
      },
    }))
  }

  const updateSlot = (day: string, slotId: string, field: keyof TimeSlot, value: string | boolean) => {
    setWeek((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((s) =>
          s.id === slotId ? { ...s, [field]: value } : s
        ),
      },
    }))
  }

  const saveDay = async (day: string) => {
    const dayData = week[day]

    // Validate time ranges
    if (!dayData.isClosed) {
      for (const slot of dayData.slots) {
        if (slot.startTime >= slot.endTime) {
          toast.error(`"${slot.name}": Start time must be before end time`)
          return
        }
      }
      // Check for overlapping slots
      const activeSlots = dayData.slots.filter(s => s.isActive).sort((a, b) => a.startTime.localeCompare(b.startTime))
      for (let i = 1; i < activeSlots.length; i++) {
        if (activeSlots[i].startTime < activeSlots[i - 1].endTime) {
          toast.error(`"${activeSlots[i].name}" overlaps with "${activeSlots[i - 1].name}"`)
          return
        }
      }
    }

    setSavingDay(day)
    try {
      const res = await apiService.createOrUpdateGymSlots(
        gymId,
        day,
        dayData.slots,
        dayData.isClosed
      )
      if (res.data) {
        toast.success(`${day.charAt(0).toUpperCase() + day.slice(1)} slots saved`)
      } else {
        toast.error(res.error || "Failed to save slots")
      }
    } catch {
      toast.error("Failed to save slots")
    } finally {
      setSavingDay(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Time Slots</h1>
        <p className="text-muted-foreground">Manage operating hours for each day</p>
      </div>

      <div className="space-y-4">
        {DAYS_OF_WEEK.map((day) => {
          const dayData = week[day] || { isClosed: false, slots: [] }
          const dayLabel = day.charAt(0).toUpperCase() + day.slice(1)

          return (
            <Card key={day}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{dayLabel}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={dayData.isClosed ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => toggleClosed(day)}
                    >
                      {dayData.isClosed ? "Closed" : "Open"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => saveDay(day)}
                      disabled={savingDay === day}
                    >
                      {savingDay === day ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="mr-1 h-3 w-3" />
                      )}
                      Save
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {!dayData.isClosed && (
                <CardContent className="space-y-3">
                  {dayData.slots.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No slots configured. Add a time slot below.
                    </p>
                  )}
                  {dayData.slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-end gap-3 p-3 border rounded-md"
                    >
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Name</Label>
                        <Input
                          value={slot.name}
                          onChange={(e) =>
                            updateSlot(day, slot.id, "name", e.target.value)
                          }
                          placeholder="Slot name"
                          className="h-8"
                        />
                      </div>
                      <div className="w-28 space-y-1">
                        <Label className="text-xs">Start</Label>
                        <Input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) =>
                            updateSlot(day, slot.id, "startTime", e.target.value)
                          }
                          className="h-8"
                        />
                      </div>
                      <div className="w-28 space-y-1">
                        <Label className="text-xs">End</Label>
                        <Input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) =>
                            updateSlot(day, slot.id, "endTime", e.target.value)
                          }
                          className="h-8"
                        />
                      </div>
                      <Button
                        variant={slot.isActive ? "default" : "secondary"}
                        size="sm"
                        className="h-8"
                        onClick={() =>
                          updateSlot(day, slot.id, "isActive", !slot.isActive)
                        }
                      >
                        {slot.isActive ? "Active" : "Inactive"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeSlot(day, slot.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addSlot(day)}
                  >
                    <Plus className="mr-1 h-3 w-3" /> Add Slot
                  </Button>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
