"use client";

import Link from "next/link";
import { Dumbbell, Heart, Users, Target, Shield, Clock, MapPin, Zap, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  const values = [
    { icon: Heart, title: "Member First", desc: "Every decision we make starts with what's best for our members." },
    { icon: Target, title: "Transparency", desc: "No hidden fees, no fine print. What you see is what you pay." },
    { icon: Users, title: "Community", desc: "Fitness is better together. We build connections, not just gyms." },
    { icon: Shield, title: "Quality", desc: "Hand-picked partner gyms with verified facilities and trainers." },
    { icon: Clock, title: "Flexibility", desc: "Your schedule, your rules. Workout when and where you want." },
    { icon: Dumbbell, title: "Results", desc: "We measure success by your progress, not our revenue." },
  ];

  const team = [
    { name: "Pratyush", role: "Founder & CEO", bio: "Fitness enthusiast turned entrepreneur. Built Neyofit to solve his own gym commitment issues." },
    { name: "Team Neyofit", role: "Operations", bio: "Dedicated team ensuring seamless gym partnerships and member experience." },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/hero-background.jpeg')] bg-cover bg-center opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              About <span className="text-orange-400">Neyofit</span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl">
              We&apos;re on a mission to make fitness accessible, flexible, and commitment-free for everyone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/gyms">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3">
                  Find Your Gym
                </Button>
              </Link>
              <Link href="/passes">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-3">
                  View Passes
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
                <p>
                  Neyofit was born from a simple frustration: why should staying fit require a yearly contract, 
                  expensive cancellation fees, and being locked into a single gym?
                </p>
                <p>
                  We believe fitness should fit your life — not the other way around. Whether you&apos;re a busy 
                  professional who can only workout twice a week, a traveler needing gym access in a new city, 
                  or someone who wants to try different gyms before committing — Neyofit gives you that freedom.
                </p>
                <p>
                  Today, we partner with 100+ premium gyms across major cities, serving thousands of members 
                  who value flexibility as much as fitness.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">By the Numbers</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-blue-900">100+</p>
                  <p className="text-gray-600">Partner Gyms</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-blue-900">10K+</p>
                  <p className="text-gray-600">Active Members</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-blue-900">50K+</p>
                  <p className="text-gray-600">Workouts Logged</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-blue-900">15+</p>
                  <p className="text-gray-600">Cities Covered</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">The principles that guide everything we do</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value) => (
              <div key={value.title} className="text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 mb-4">
                  <value.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How We're Different */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How We&apos;re Different</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Traditional gyms vs. Neyofit</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="pb-4 font-semibold text-gray-900 w-1/3">Feature</th>
                  <th className="pb-4 font-semibold text-gray-900 w-1/3">Traditional Gym</th>
                  <th className="pb-4 font-semibold text-gray-900 w-1/3">Neyofit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { feature: "Contract Length", traditional: "12+ months", neyofit: "1 day – 1 month" },
                  { feature: "Cancellation Fee", traditional: "₹2,000 – ₹10,000", neyofit: "Zero" },
                  { feature: "Gym Access", traditional: "Single location", neyofit: "100+ partner gyms" },
                  { feature: "Payment Model", traditional: "Monthly auto-renewal", neyofit: "Pay per use" },
                  { feature: "Freeze Option", traditional: "Limited/paid", neyofit: "Free (month pass)" },
                  { feature: "Trial Period", traditional: "Rare/paid", neyofit: "Day pass from ₹299" },
                ].map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="py-4 font-medium text-gray-900">{row.feature}</td>
                    <td className="py-4 text-gray-600">{row.traditional}</td>
                    <td className="py-4 font-semibold text-green-700">{row.neyofit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Meet the Team</h2>
            <p className="text-xl text-gray-600">Passionate people building the future of fitness</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {team.map((member) => (
              <div key={member.name} className="bg-gray-50 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-blue-600 font-medium mb-4">{member.role}</p>
                <p className="text-gray-700">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Join the Fitness Revolution?</h2>
          <p className="text-blue-100 text-lg mb-8">Join thousands of members working out on their own terms.</p>
          <Link href="/gyms">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 text-lg gap-2">
              Find Gyms Near You
              <Zap className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}