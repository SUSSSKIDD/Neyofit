"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Clock,
  Check,
  AlertCircle
} from "lucide-react"
import { TimeSlot, DaySchedule, generateSlotId } from "@/lib/api"
import { formatTime, parseTimeTo24, getDefaultTimeFormat, saveTimeFormat, TimeFormat } from "@/lib/utils"

interface TimeSlotManagerProps {
  daySchedule: DaySchedule
  onUpdate: (daySchedule: DaySchedule) => void
  dayName: string
}

export default function TimeSlotManager({ daySchedule, onUpdate, dayName }: TimeSlotManagerProps) {
  const [editingSlot, setEditingSlot] = useState<string | null>(null)
  const [newSlotName, setNewSlotName] = useState("")
  const [newSlotStartTime, setNewSlotStartTime] = useState("09:00")
  const [newSlotEndTime, setNewSlotEndTime] = useState("21:00")
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(() => getDefaultTimeFormat())

  // Convert display time to 24h for storage
  const to24h = (time: string) => parseTimeTo24(time)
  // Convert 24h storage to display format
  const toDisplay = (time: string) => formatTime(time, timeFormat)

  const addNewSlot = () => {
    if (!newSlotName.trim()) return

    const newSlot: TimeSlot = {
      id: generateSlotId(),
      name: newSlotName.trim(),
      startTime: to24h(newSlotStartTime),
      endTime: to24h(newSlotEndTime),
      isActive: true
    }

    const updatedSchedule = {
      ...daySchedule,
      slots: [...daySchedule.slots, newSlot]
    }

    onUpdate(updatedSchedule)
    setNewSlotName("")
    setNewSlotStartTime("09:00")
    setNewSlotEndTime("21:00")
  }

  const updateSlot = (slotId: string, updates: Partial<TimeSlot>) => {
    // Convert time fields to 24h for storage
    const processedUpdates = { ...updates }
    if (updates.startTime) processedUpdates.startTime = to24h(updates.startTime)
    if (updates.endTime) processedUpdates.endTime = to24h(updates.endTime)

    const updatedSchedule = {
      ...daySchedule,
      slots: daySchedule.slots.map(slot =>
        slot.id === slotId ? { ...slot, ...processedUpdates } : slot
      )
    }
    onUpdate(updatedSchedule)
  }

  const deleteSlot = (slotId: string) => {
    const updatedSchedule = {
      ...daySchedule,
      slots: daySchedule.slots.filter(slot => slot.id !== slotId)
    }
    onUpdate(updatedSchedule)
  }

  const toggleSlotActive = (slotId: string) => {
    const slot = daySchedule.slots.find(s => s.id === slotId)
    if (slot) {
      updateSlot(slotId, { isActive: !slot.isActive })
    }
  }

  const toggleDayClosed = () => {
    onUpdate({
      ...daySchedule,
      isClosed: !daySchedule.isClosed
    })
  }

  const validateTimeSlot = (startTime: string, endTime: string): boolean => {
    if (!startTime || !endTime) return false
    return to24h(startTime) < to24h(endTime)
  }

  const getSlotStatusColor = (slot: TimeSlot) => {
    if (!slot.isActive) return "bg-gray-100 text-gray-500"
    if (!validateTimeSlot(slot.startTime, slot.endTime)) return "bg-red-100 text-red-700"
    return "bg-green-100 text-green-700"
  }

  const getSlotStatusText = (slot: TimeSlot) => {
    if (!slot.isActive) return "Inactive"
    if (!validateTimeSlot(slot.startTime, slot.endTime)) return "Invalid Time"
    return "Active"
  }

  const handleTimeFormatChange = (format: TimeFormat) => {
    setTimeFormat(format)
    saveTimeFormat(format)
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg capitalize">{dayName}</CardTitle>
          <div className="flex items-center gap-2">
            <Label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={daySchedule.isClosed}
                onChange={toggleDayClosed}
                className="rounded"
              />
              <span className="text-sm">Closed</span>
            </Label>
            <Select value={timeFormat} onValueChange={handleTimeFormatChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Time Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
                <SelectItem value="24h">24 Hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {daySchedule.isClosed ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>This day is closed</p>
          </div>
        ) : (
          <>
            {/* Existing Slots */}
            <div className="space-y-3">
              {daySchedule.slots.map((slot) => (
                <div key={slot.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  {editingSlot === slot.id ? (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                      <Input
                        value={slot.name}
                        onChange={(e) => updateSlot(slot.id, { name: e.target.value })}
                        placeholder="Slot name"
                        className="text-sm"
                      />
                      <Input
                        type="time"
                        value={toDisplay(slot.startTime)}
                        onChange={(e) => updateSlot(slot.id, { startTime: e.target.value })}
                        className="text-sm"
                      />
                      <Input
                        type="time"
                        value={toDisplay(slot.endTime)}
                        onChange={(e) => updateSlot(slot.id, { endTime: e.target.value })}
                        className="text-sm"
                      />
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingSlot(null)}
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteSlot(slot.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{slot.name}</span>
                          <Badge className={getSlotStatusColor(slot)}>
                            {getSlotStatusText(slot)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="h-3 w-3" />
                          {toDisplay(slot.startTime)} - {toDisplay(slot.endTime)}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingSlot(slot.id)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleSlotActive(slot.id)}
                        >
                          {slot.isActive ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteSlot(slot.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Add New Slot */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Add New Time Slot</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <Input
                  value={newSlotName}
                  onChange={(e) => setNewSlotName(e.target.value)}
                  placeholder="Slot name (e.g., Morning, Evening)"
                  className="text-sm"
                />
                <Input
                  type="time"
                  value={toDisplay(newSlotStartTime)}
                  onChange={(e) => setNewSlotStartTime(e.target.value)}
                  className="text-sm"
                />
                <Input
                  type="time"
                  value={toDisplay(newSlotEndTime)}
                  onChange={(e) => setNewSlotEndTime(e.target.value)}
                  className="text-sm"
                />
                <Button
                  onClick={addNewSlot}
                  disabled={!newSlotName.trim() || !validateTimeSlot(toDisplay(newSlotStartTime), toDisplay(newSlotEndTime))}
                  className="text-sm"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Slot
                </Button>
              </div>
              {!validateTimeSlot(toDisplay(newSlotStartTime), toDisplay(newSlotEndTime)) && (
                <p className="text-xs text-red-500 mt-1">
                  End time must be after start time
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}





