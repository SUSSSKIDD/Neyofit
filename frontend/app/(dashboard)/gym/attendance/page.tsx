"use client"

import { useEffect, useState, useCallback } from "react"
import { useGymSelector } from "@/contexts/gym-selector-context"
import { apiService, GymMember, Visit, VisitStats } from "@/lib/api"
import { toast } from "sonner"
import {
  Loader2, Search, LogIn, LogOut, Users, Clock, UserCheck, Activity,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

export default function AttendancePage() {
  const { selectedGymId, gyms } = useGymSelector()
  const [loading, setLoading] = useState(true)
  const [todayVisits, setTodayVisits] = useState<Visit[]>([])
  const [stats, setStats] = useState<VisitStats>({ today: 0, thisWeek: 0, thisMonth: 0, currentlyIn: 0 })

  // Quick check-in search
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<GymMember[]>([])
  const [searching, setSearching] = useState(false)
  const [checkingIn, setCheckingIn] = useState<string | null>(null)

  const activeGymId = selectedGymId && selectedGymId !== "all" ? selectedGymId : gyms[0]?._id

  const fetchData = useCallback(async () => {
    if (!activeGymId) return
    setLoading(true)
    try {
      const [attendanceRes, statsRes] = await Promise.all([
        apiService.getTodayAttendance(activeGymId),
        apiService.getVisitStats(activeGymId),
      ])
      if (attendanceRes.success && attendanceRes.data) {
        setTodayVisits(attendanceRes.data)
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data)
      }
    } catch {
      toast.error("Failed to fetch attendance data")
    } finally {
      setLoading(false)
    }
  }, [activeGymId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Search members
  useEffect(() => {
    if (!activeGymId || searchQuery.length < 2) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await apiService.searchGymMembers(activeGymId, searchQuery)
        if (res.success && res.data) {
          setSearchResults(res.data)
        }
      } catch { /* ignore */ }
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, activeGymId])

  const handleCheckIn = async (memberId: string) => {
    if (!activeGymId) return
    setCheckingIn(memberId)
    try {
      const res = await apiService.checkInMember({ gymId: activeGymId, memberId })
      if (res.success) {
        toast.success(res.warning ? `Checked in (Warning: ${res.warning})` : "Checked in successfully")
        setSearchQuery("")
        setSearchResults([])
        fetchData()
      } else {
        toast.error(res.message || "Check-in failed")
      }
    } catch {
      toast.error("Check-in failed")
    } finally {
      setCheckingIn(null)
    }
  }

  const handleCheckOut = async (visitId: string) => {
    try {
      const res = await apiService.checkOutMember(visitId)
      if (res.success) {
        toast.success("Checked out successfully")
        fetchData()
      } else {
        toast.error(res.message || "Check-out failed")
      }
    } catch {
      toast.error("Check-out failed")
    }
  }

  if (!activeGymId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please select a gym first</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="text-muted-foreground">Track member check-ins and check-outs</p>
      </div>

      {/* Quick Check-in Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <LogIn className="h-5 w-5" /> Quick Check-In
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Type phone number or member name to check in..."
              className="pl-10 text-lg h-12"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-3 border rounded-lg divide-y">
              {searchResults.map(member => (
                <div key={member._id} className="flex items-center justify-between p-3 hover:bg-muted/50">
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.phone} | #{member.membershipNumber}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={
                      member.membershipStatus === "active" ? "bg-green-100 text-green-800" :
                      member.membershipStatus === "expired" ? "bg-red-100 text-red-800" :
                      "bg-gray-100 text-gray-800"
                    }>
                      {member.membershipStatus}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => handleCheckIn(member._id)}
                      disabled={checkingIn === member._id}
                    >
                      {checkingIn === member._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <LogIn className="h-4 w-4 mr-1" /> Check In
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
            <p className="text-sm text-muted-foreground mt-3">No members found matching &quot;{searchQuery}&quot;</p>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Currently In</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{stats.currentlyIn}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold">{stats.today}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold">{stats.thisWeek}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{stats.thisMonth}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Register */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Today&apos;s Register</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : todayVisits.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <Clock className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No check-ins today yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayVisits.map(visit => {
                  const member = typeof visit.memberId === "object" ? visit.memberId : null
                  return (
                    <TableRow key={visit._id}>
                      <TableCell className="font-medium">{member?.name || "-"}</TableCell>
                      <TableCell>{member?.phone || "-"}</TableCell>
                      <TableCell>{new Date(visit.checkInTime).toLocaleTimeString()}</TableCell>
                      <TableCell>
                        {visit.checkOutTime
                          ? new Date(visit.checkOutTime).toLocaleTimeString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {visit.checkOutTime ? (
                          <Badge variant="outline">Left</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">In Gym</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!visit.checkOutTime && (
                          <Button size="sm" variant="outline" onClick={() => handleCheckOut(visit._id)}>
                            <LogOut className="h-4 w-4 mr-1" /> Check Out
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
