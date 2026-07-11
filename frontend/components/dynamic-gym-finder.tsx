"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface GymMatch {
  name: string
  match: number
  features: string[]
}

export default function DynamicGymFinder() {
  const [goals, setGoals] = useState<string[]>([])
  const [facilities, setFacilities] = useState<string[]>([])
  const [budget, setBudget] = useState(2500)
  const [matches, setMatches] = useState<GymMatch[]>([
    { name: "FitZone Premium", match: 98, features: ["Pool", "Trainer", "Classes"] },
    { name: "PowerHouse Gym", match: 92, features: ["24/7", "Free Weights", "Cardio"] },
    { name: "Elite Fitness Club", match: 87, features: ["Trainer", "Spa", "Cardio"] },
  ])

  const toggleGoal = (goal: string) => {
    if (goals.includes(goal)) {
      setGoals(goals.filter((g) => g !== goal))
    } else {
      setGoals([...goals, goal])
    }
  }

  const toggleFacility = (facility: string) => {
    if (facilities.includes(facility)) {
      setFacilities(facilities.filter((f) => f !== facility))
    } else {
      setFacilities([...facilities, facility])
    }
  }

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBudget(Number.parseInt(e.target.value))
  }

  const findMatches = () => {
    // In a real app, this would call an API with the selected criteria
    // For demo purposes, we'll just simulate a response

    // Simulate processing time
    setTimeout(() => {
      // Randomize match percentages slightly
      const updatedMatches = matches.map((match) => ({
        ...match,
        match: Math.max(70, Math.min(99, match.match + Math.floor(Math.random() * 10) - 5)),
      }))

      // Sort by match percentage
      updatedMatches.sort((a, b) => b.match - a.match)

      setMatches(updatedMatches)
    }, 500)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">What's your fitness goal?</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {["Weight Loss", "Muscle Gain", "General Fitness", "Strength", "Flexibility", "Sports"].map((goal) => (
            <div key={goal} className="relative">
              <input
                type="checkbox"
                id={`goal-${goal}`}
                className="peer sr-only"
                checked={goals.includes(goal)}
                onChange={() => toggleGoal(goal)}
              />
              <label
                htmlFor={`goal-${goal}`}
                className="flex items-center justify-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-900 peer-checked:border-blue-900 peer-checked:bg-blue-50 text-sm"
              >
                {goal}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">What facilities do you need?</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {["Pool", "Cardio Area", "Free Weights", "Group Classes", "Personal Trainer", "Locker Room"].map(
            (facility) => (
              <div key={facility} className="relative">
                <input
                  type="checkbox"
                  id={`facility-${facility}`}
                  className="peer sr-only"
                  checked={facilities.includes(facility)}
                  onChange={() => toggleFacility(facility)}
                />
                <label
                  htmlFor={`facility-${facility}`}
                  className="flex items-center justify-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-900 peer-checked:border-blue-900 peer-checked:bg-blue-50 text-sm"
                >
                  {facility}
                </label>
              </div>
            ),
          )}
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Your budget (per month)</label>
        <div className="px-2">
          <input
            type="range"
            min="500"
            max="5000"
            step="100"
            value={budget}
            onChange={handleBudgetChange}
            className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>₹500</span>
            <span>₹{budget}</span>
            <span>₹5,000+</span>
          </div>
        </div>
      </div>

      <Button className="w-full bg-blue-900 hover:bg-blue-800" onClick={findMatches}>
        Find My Perfect Gym Match
      </Button>
    </div>
  )
}
