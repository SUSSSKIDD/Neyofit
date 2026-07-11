"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Users,
  UserCheck,
  IndianRupee,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { apiService, Gym } from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";

interface DashboardData {
  gyms: Gym[];
  pendingGyms: Gym[];
  subscriptions: Array<{
    _id: string;
    userId?: { _id: string; name: string; email?: string };
    subscriptionListingId?: {
      _id: string;
      name: string;
      type: string;
      cost: number;
      gymId?: { _id: string; name: string };
    };
    startDate: string;
    status: string;
    createdAt: string;
  }>;
  users: Array<{
    _id: string;
    name: string;
    email: string;
    userType: string;
  }>;
  stats: {
    totalGyms: number;
    publishedGyms: number;
    draftGyms: number;
    archivedGyms: number;
    totalUsers: number;
    customers: number;
    gymOwners: number;
    totalSubscriptions: number;
    activeSubscriptions: number;
  };
}

const PIE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function PlatformDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await apiService.getSuperAdminDashboard();
        if (response.data) {
          setData(response.data as unknown as DashboardData);
        }
      } catch {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold">Platform Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[200px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const { stats, subscriptions, pendingGyms } = data;

  // Calculate revenue from paid/active subscriptions
  const paidSubscriptions = subscriptions.filter(
    (s) => s.status === "active" || s.status === "completed"
  );
  const totalRevenue = paidSubscriptions.reduce(
    (sum, s) => sum + (s.subscriptionListingId?.cost || 0),
    0
  );
  // Estimate platform commission at ~15%
  const platformCommission = Math.round(totalRevenue * 0.15);

  // Revenue by month (last 6 months)
  const revenueByMonth = (() => {
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
      months[key] = 0;
    }
    paidSubscriptions.forEach((s) => {
      const d = new Date(s.startDate || s.createdAt);
      const key = d.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
      if (key in months) {
        months[key] += s.subscriptionListingId?.cost || 0;
      }
    });
    return Object.entries(months).map(([month, revenue]) => ({
      month,
      revenue,
    }));
  })();

  // Subscription type breakdown
  const typeBreakdown = (() => {
    const counts: Record<string, number> = {};
    subscriptions.forEach((s) => {
      const type = s.subscriptionListingId?.type || "unknown";
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
      .sort((a, b) => b.value - a.value);
  })();

  // Recent paid orders (from subscriptions with active status)
  const recentOrders = paidSubscriptions.slice(0, 5);

  const statCards = [
    {
      title: "Total Gyms",
      value: stats.totalGyms,
      icon: Building2,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Published Gyms",
      value: stats.publishedGyms,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Gym Owners",
      value: stats.gymOwners,
      icon: UserCheck,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "Customers",
      value: stats.customers,
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Total Revenue",
      value: `INR ${totalRevenue.toLocaleString()}`,
      icon: IndianRupee,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      title: "Platform Commission",
      value: `INR ${platformCommission.toLocaleString()}`,
      icon: IndianRupee,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  const barChartConfig: ChartConfig = {
    revenue: { label: "Revenue (INR)", color: "hsl(var(--chart-1))" },
  };

  const pieChartConfig: ChartConfig = typeBreakdown.reduce(
    (acc, item, i) => {
      acc[item.name.toLowerCase()] = {
        label: item.name,
        color: PIE_COLORS[i % PIE_COLORS.length],
      };
      return acc;
    },
    {} as ChartConfig
  );

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Platform Dashboard</h1>

      {/* 6 Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {typeof stat.value === "number"
                  ? stat.value.toLocaleString()
                  : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Trend Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue over last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={barChartConfig} className="h-[250px] w-full">
              <BarChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => `INR ${Number(value).toLocaleString()}`}
                    />
                  }
                />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Subscription Type Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Types</CardTitle>
            <CardDescription>Breakdown by plan type</CardDescription>
          </CardHeader>
          <CardContent>
            {typeBreakdown.length === 0 ? (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                No subscription data
              </div>
            ) : (
              <ChartContainer config={pieChartConfig} className="h-[250px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={typeBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {typeBreakdown.map((_, i) => (
                      <Cell
                        key={i}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Recent Orders + Pending Gyms */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Paid Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest paid subscriptions</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/platform/orders">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent orders</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order._id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {order.userId?.name || "Unknown"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {order.subscriptionListingId?.gymId?.name || "—"} &middot;{" "}
                        {order.subscriptionListingId?.name || "—"}
                      </p>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-sm font-semibold">
                        INR{" "}
                        {(
                          order.subscriptionListingId?.cost || 0
                        ).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(
                          order.startDate || order.createdAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Gyms */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pending Gyms</CardTitle>
              <CardDescription>Awaiting review</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/platform/gyms">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendingGyms && pendingGyms.length > 0 ? (
              <div className="space-y-3">
                {pendingGyms.slice(0, 5).map((gym) => (
                  <div
                    key={gym._id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{gym.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(gym.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{gym.status}</Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/platform/gyms/${gym._id}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No pending gyms
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
