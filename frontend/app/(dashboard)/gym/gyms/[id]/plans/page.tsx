"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { apiService, type SubscriptionListing } from "@/lib/api"
import { toast } from "sonner"
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PlanForm {
  name: string
  description: string
  type: string
  durationInDays: number
  cost: number
  currency: string
  features: string
}

const defaultForm: PlanForm = {
  name: "",
  description: "",
  type: "monthly",
  durationInDays: 30,
  cost: 0,
  currency: "INR",
  features: "",
}

export default function GymPlansPage() {
  const params = useParams()
  const gymId = params.id as string

  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<SubscriptionListing[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionListing | null>(null)
  const [form, setForm] = useState<PlanForm>(defaultForm)

  const fetchPlans = async () => {
    try {
      const res = await apiService.getGymSubscriptionListings(gymId)
      if (res.data) {
        setPlans(res.data)
      }
    } catch {
      toast.error("Failed to load plans")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [gymId])

  const openCreate = () => {
    setEditingPlan(null)
    setForm(defaultForm)
    setDialogOpen(true)
  }

  const openEdit = (plan: SubscriptionListing) => {
    setEditingPlan(plan)
    setForm({
      name: plan.name,
      description: plan.description || "",
      type: plan.type,
      durationInDays: plan.durationInDays,
      cost: plan.cost,
      currency: plan.currency || "INR",
      features: plan.features?.join(", ") || "",
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.cost) {
      toast.error("Name and cost are required")
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name,
        description: form.description,
        type: form.type,
        durationInDays: form.durationInDays,
        gymId,
        cost: form.cost,
        currency: form.currency,
        features: form.features
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean),
      }

      if (editingPlan) {
        const res = await apiService.updateSubscriptionListing(editingPlan._id, payload)
        if (res.data) {
          toast.success("Plan updated")
        } else {
          toast.error(res.error || "Failed to update plan")
        }
      } else {
        const res = await apiService.createSubscriptionListing(payload)
        if (res.success) {
          toast.success("Plan created")
        } else {
          toast.error(res.error || "Failed to create plan")
        }
      }

      setDialogOpen(false)
      fetchPlans()
    } catch {
      toast.error("Failed to save plan")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return

    try {
      const res = await apiService.deleteSubscriptionListing(planId)
      if (res.success) {
        toast.success("Plan deleted")
        fetchPlans()
      } else {
        toast.error(res.error || "Failed to delete plan")
      }
    } catch {
      toast.error("Failed to delete plan")
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subscription Plans</h1>
          <p className="text-muted-foreground">Manage pricing plans for this gym</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingPlan ? "Edit Plan" : "Create Plan"}</DialogTitle>
              <DialogDescription>
                {editingPlan
                  ? "Update the subscription plan details"
                  : "Add a new subscription plan for your gym"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="plan-name">Plan Name</Label>
                <Input
                  id="plan-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Monthly Basic"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-desc">Description</Label>
                <Input
                  id="plan-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Plan description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm({ ...form, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan-duration">Duration (days)</Label>
                  <Input
                    id="plan-duration"
                    type="number"
                    value={form.durationInDays}
                    onChange={(e) =>
                      setForm({ ...form, durationInDays: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plan-cost">Cost</Label>
                  <Input
                    id="plan-cost"
                    type="number"
                    value={form.cost}
                    onChange={(e) =>
                      setForm({ ...form, cost: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Input value="INR" disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-features">Features (comma separated)</Label>
                <Input
                  id="plan-features"
                  value={form.features}
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                  placeholder="e.g. Cardio, Weights, Trainer"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingPlan ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {plans.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No subscription plans yet. Click "Add Plan" to create one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan._id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell className="capitalize">{plan.type}</TableCell>
                    <TableCell>{plan.durationInDays} days</TableCell>
                    <TableCell>
                      {plan.currency} {plan.cost}
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.isActive ? "default" : "secondary"}>
                        {plan.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(plan)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(plan._id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
