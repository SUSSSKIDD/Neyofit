"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, CheckCircle } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { searchGyms } from "@/lib/api";

export default function PopularGymsSection() {
  const [gyms, setGyms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    searchGyms({ limit: 6 })
      .then((data) => {
        const gyms = (data.data?.gyms || []).map((gym: any) => ({
          id: gym._id,
          name: gym.name,
          location: gym.location?.address?.city || (typeof gym.locationId === "object" ? gym.locationId?.address?.city || gym.locationId?.name : gym.locationId) || "",
          rating: gym.rating || 0,
          image:
            gym.pictures && gym.pictures.length > 0
              ? `${process.env.NEXT_PUBLIC_API_BASE_URL || (process.env.NODE_ENV === "production" ? "http://api.neyofit.in/api/v1" : "http://localhost:5001/api/v1")}/gym-pictures/${gym.pictures[0]}/image`
              : "/placeholder.svg",
          price: gym.priceRange
            ? gym.priceRange === "budget"
              ? "₹299"
              : gym.priceRange === "mid-range"
              ? "₹499"
              : "₹999"
            : "₹499",
          features: (gym.facilities || []).map((f: any) => typeof f === "object" ? f.name : f),
          verified: gym.isActive || false,
        }));
        setGyms(gyms);
      })
      .catch(() => setError("Failed to load gyms"))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="text-center py-8 w-full col-span-full">
        Loading gyms...
      </div>
    );
  if (error)
    return (
      <div className="text-center text-red-500 py-8 w-full col-span-full">
        {error}
      </div>
    );
  if (gyms.length === 0)
    return (
      <div className="text-center text-gray-500 py-8 w-full col-span-full">
        No gyms found.
      </div>
    );

  return (
    <>
      {gyms.map((gym) => (
        <Card
          key={gym.id}
          className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] w-full"
        >
          <div className="relative h-48 sm:h-52">
            <img
              src={gym.image || "/placeholder.svg"}
              alt={gym.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3">
              <Badge className="bg-white text-gray-900 flex items-center gap-1 shadow-md">
                <Star className="fill-orange-500 text-orange-500" size={14} />
                {gym.rating}
              </Badge>
            </div>
            {gym.verified && (
              <div className="absolute top-3 left-3">
                <Badge className="bg-green-500 text-white flex items-center gap-1 shadow-md">
                  <CheckCircle size={14} />
                  Verified
                </Badge>
              </div>
            )}
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg sm:text-xl truncate">
              {gym.name}
            </CardTitle>
            <CardDescription className="flex items-center text-sm">
              <span className="mr-1">📍</span>
              <span className="truncate">{gym.location}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex flex-wrap gap-2 mb-3 max-h-16 overflow-hidden">
              {gym.features.slice(0, 3).map((feature: string, i: number) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="bg-orange-50 text-orange-700 border-orange-200"
                >
                  {feature}
                </Badge>
              ))}
              {gym.features.length > 3 && (
                <Badge variant="outline" className="bg-gray-50">
                  +{gym.features.length - 3} more
                </Badge>
              )}
            </div>
            <p className="font-bold text-gray-900">
              Starting from{" "}
              <span className="text-lg text-orange-600">{gym.price}</span>/day
            </p>
          </CardContent>
          <CardFooter>
            <Link href={`/gyms/${gym.id}`} className="w-full">
              <Button className="w-full bg-orange-500 hover:bg-orange-600 transition-colors shadow-md">
                View Gym
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </>
  );
}
