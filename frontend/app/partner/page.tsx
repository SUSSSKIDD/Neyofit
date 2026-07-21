"use client";

import Link from "next/link";
import { Building, Users, TrendingUp, Shield, Target, Clock, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PartnerPage() {
  const benefits = [
    { icon: Users, title: "New Members", desc: "Access thousands of active members looking for flexible gym options." },
    { icon: TrendingUp, title: "Increase Revenue", desc: "Monetize unused capacity with day/week/month pass holders." },
    { icon: Target, title: "Targeted Exposure", desc: "Reach fitness enthusiasts actively searching for gyms in your area." },
    { icon: Shield, title: "No Risk", desc: "No upfront costs. You only earn when members visit your gym." },
    { icon: Clock, title: "Flexible Terms", desc: "Set your own pricing, capacity limits, and blackout dates." },
    { icon: Building, title: "Easy Management", desc: "Simple dashboard to track visits, revenue, and member feedback." },
  ];

  const howItWorks = [
    { step: "1", title: "Apply Online", desc: "Submit your gym details through our partner application form." },
    { step: "2", title: "Verification", desc: "Our team verifies your facilities, equipment, and certifications." },
    { step: "3", title: "Go Live", desc: "Get listed on Neyofit and start receiving members instantly." },
    { step: "4", title: "Earn & Grow", desc: "Track visits, collect revenue, and build your community." },
  ];

  const requirements = [
    "Valid gym license and registration",
    "Certified trainers on staff",
    "Clean, well-maintained facilities",
    "Standard equipment (cardio, strength, free weights)",
    "Liability insurance coverage",
    "Minimum 2,000 sq ft workout area",
  ];

  const faqs = [
    {
      q: "How do I get paid?",
      a: "Payments are processed weekly. You receive revenue from pass redemptions minus our platform fee (15-20% based on volume).",
    },
    {
      q: "Can I set capacity limits?",
      a: "Yes! You control daily/monthly capacity limits and can set blackout dates for peak times or maintenance.",
    },
    {
      q: "What if a member damages equipment?",
      a: "All Neyofit members sign a liability waiver. Our insurance covers accidental damage during pass visits.",
    },
    {
      q: "Can I choose which passes to accept?",
      a: "Absolutely. You can accept Day, Week, Month passes individually or all of them. You set the rules.",
    },
    {
      q: "How do members check in?",
      a: "Members show a QR code in the app. Your front desk scans it — takes 2 seconds. No extra hardware needed.",
    },
    {
      q: "Is there a contract?",
      a: "No long-term contracts. Partnership is month-to-month. Cancel anytime with 30 days notice.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/hero-background.jpeg')] bg-cover bg-center opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Partner with <span className="text-orange-400">Neyofit</span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl">
              Join 100+ gyms growing their revenue with flexible membership passes. No contracts, no risk.
            </p>
            <Link href="#apply">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 text-lg gap-2 w-full sm:w-auto">
                Become a Partner
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Why Partner with Neyofit?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Unlock new revenue streams without changing your operations.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-100 text-blue-600 mb-4">
                  <benefit.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Get set up in 4 simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="relative text-center">
                <div className="absolute left-1/2 -translate-x-1/2 top-0 w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600 mb-6 z-10">
                  {step.step}
                </div>
                {index < 3 && (
                  <div className="absolute left-1/2 top-8 w-0.5 h-[calc(100%-64px)] bg-gray-200 hidden lg:block" />
                )}
                <div className="pt-16">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Partnership Requirements</h2>
              <p className="text-gray-600 mb-8">We maintain high standards to ensure members have a great experience at every partner gym.</p>
              <ul className="space-y-4">
                {requirements.map((req, index) => (
                  <li key={index} className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Revenue Calculator</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Average Monthly Visits</label>
                  <input type="number" defaultValue="200" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Average Pass Value</label>
                  <input type="number" defaultValue="350" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>Estimated Monthly Revenue</span>
                    <span className="text-blue-900">₹70,000</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-center">After platform fee. Actual earnings vary by location and demand.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white" id="faq">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          </div>
          <dl className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <dt className="font-semibold text-gray-900 mb-2">{faq.q}</dt>
                <dd className="text-gray-600">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Apply CTA */}
      <section className="py-20 bg-blue-900 text-white" id="apply">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Grow Your Gym?</h2>
          <p className="text-blue-100 text-lg mb-8">Join 100+ partner gyms earning extra revenue with Neyofit.</p>
          <form className="space-y-4 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
            <div className="grid sm:grid-cols-2 gap-4">
              <input type="text" placeholder="Your Name" className="px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-orange-500" required />
              <input type="email" placeholder="Email Address" className="px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-orange-500" required />
            </div>
            <input type="text" placeholder="Gym Name" className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-orange-500" required />
            <input type="text" placeholder="Gym Location (City, Area)" className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-orange-500" required />
            <textarea placeholder="Tell us about your gym (facilities, equipment, trainers)" rows={3} className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-orange-500" required />
            <Button type="submit" size="lg" className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 text-lg">
              Submit Application
            </Button>
            <p className="text-sm text-blue-200 text-center">Our team will contact you within 24 hours.</p>
          </form>
        </div>
      </section>
    </div>
  );
}