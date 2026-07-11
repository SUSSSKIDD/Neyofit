"use client"

import { useState, useEffect, useMemo } from "react"
import { Loader2, CreditCard, Activity, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { apiService } from "@/lib/api"

export default function CustomerPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const res = await apiService.getUserPayments()
        if (res.success && res.data) {
          setPayments(Array.isArray(res.data) ? res.data : [])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalSpent = payments
    .filter((p: any) => p.status === "paid")
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0)

  const filteredPayments = useMemo(() => {
    if (!searchQuery.trim()) return payments
    const q = searchQuery.toLowerCase()
    return payments.filter((p: any) => {
      const orderId = (p.razorpayOrderId || p.orderId || p._id || "").toLowerCase()
      return orderId.includes(q)
    })
  }, [payments, searchQuery])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payment History</h1>
        <p className="text-muted-foreground">All your past payments and transactions</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalSpent.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      {payments.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {filteredPayments.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground">
              {searchQuery ? "No payments match your search." : "No payments found."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Gym / Plan</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((p: any) => {
                  const sub = p.subscriptionId
                  const listing = sub?.subscriptionListingId
                  const gym = listing?.gymId
                  return (
                  <TableRow key={p._id}>
                    <TableCell>{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{gym?.name || "—"}</p>
                        {listing?.name && (
                          <p className="text-xs text-muted-foreground">{listing.name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.razorpayOrderId || p.orderId || p._id.slice(-8)}
                    </TableCell>
                    <TableCell className="font-medium">₹{p.amount}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "paid" ? "default" : p.status === "failed" ? "destructive" : "secondary"}>
                        {p.status}
                      </Badge>
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
