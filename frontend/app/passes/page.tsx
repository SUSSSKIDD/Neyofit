"use client";

import Link from "next/link";
import { CreditCard, Calendar, Users, Shield, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PassesPage() {
  const passes = [
    {
      id: "day-pass",
      name: "Day Pass",
      price: "₹299",
      originalPrice: "₹499",
      description: "Perfect for trying out a gym or occasional visits",
      features: [
        "Access to any partner gym for 1 day",
        "Valid for 24 hours from activation",
        "All gym facilities included",
        "No commitment required",
      ],
      popular: false,
      cta: "Buy Day Pass",
    },
    {
      id: "week-pass",
      name: "Week Pass",
      price: "₹999",
      originalPrice: "₹1,999",
      description: "Great for short-term fitness goals or travelers",
      features: [
        "Access to any partner gym for 7 days",
        "Valid for 7 consecutive days",
        "All gym facilities included",
        "Perfect for visitors & travelers",
      ],
      popular: true,
      cta: "Buy Week Pass",
    },
    {
      id: "month-pass",
      name: "Month Pass",
      price: "₹2,499",
      originalPrice: "₹4,999",
      description: "Best value for regular gym-goers",
      features: [
        "Unlimited access to any partner gym for 30 days",
        "Access to all premium facilities",
        "Priority booking for classes",
        "Guest pass (1 per month)",
        "Freeze option (up to 7 days)",
      ],
      popular: false,
      cta: "Buy Month Pass",
    },
  ];

  const benefits = [
    { icon: CreditCard, title: "Pay Per Use", desc: "Only pay when you workout. No monthly commitments." },
    { icon: Calendar, title: "Flexible Duration", desc: "Choose from 1 day to 1 month passes." },
    { icon: Users, title: "100+ Partner Gyms", desc: "Access multiple gyms across your city." },
    { icon: Shield, title: "Secure Booking", desc: "Instant confirmation with QR code entry." },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/hero-background.jpeg')] bg-cover bg-center opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Flexible Gym <span className="text-orange-400">Passes</span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              No long-term contracts. No hidden fees. Just pay for what you use — from a single day to a full month.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/gyms">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg gap-2">
                  Find Gyms Near You
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-3 text-lg">
                  Login to Buy
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Why Choose Neyofit Passes?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Freedom to workout on your terms, without the commitment of traditional gym memberships.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 mb-4">
                  <benefit.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Passes Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Choose Your Pass</h2>
            <p className="text-xl text-gray-600">Select the pass that fits your fitness schedule</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {passes.map((pass) => (
              <div
                key={pass.id}
                className={`relative bg-white rounded-2xl shadow-xl p-8 flex flex-col ${
                  pass.popular ? "ring-2 ring-orange-500 scale-105 z-10" : ""
                }`}
              >
                {pass.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-orange-500 text-white text-sm font-semibold px-4 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{pass.name}</h3>
                  <p className="text-gray-600">{pass.description}</p>
                </div>
                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-bold text-gray-900">{pass.price}</span>
                    <span className="text-gray-400 line-through">{pass.originalPrice}</span>
                  </div>
                  <p className="text-sm text-green-600 font-medium">
                    Save {parseInt(pass.originalPrice.replace(/[^0-9]/g, '')) - parseInt(pass.price.replace(/[^0-9]/g, ''))}% 
                    vs regular price
                  </p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {pass.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 text-gray-700">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/login" className="text-center">
                  <Button 
                    className={`w-full py-3 text-lg ${
                      pass.popular 
                        ? "bg-orange-500 hover:bg-orange-600 text-white" 
                        : "bg-blue-900 hover:bg-blue-800 text-white"
                    }`}
                  >
                    {pass.cta}
                  </Button>
                </Link>
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
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Get started in 3 simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Browse & Select</h3>
              <p className="text-gray-600">Find gyms near you and choose the pass that fits your schedule</p>
            </div>
            <div className="text-center p-6">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Purchase Instantly</h3>
              <p className="text-gray-600">Buy your pass securely online and get instant confirmation</p>
            </div>
            <div className="text-center p-6">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Workout Anytime</h3>
              <p className="text-gray-600">Show your QR code at any partner gym and start your workout</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Frequently Asked Questions</h2>
          <dl className="space-y-4">
            {[
              {
                q: "Can I use my pass at any gym?",
                a: "Yes! Your pass gives you access to all 100+ partner gyms in our network across the city.",
              },
              {
                q: "What happens if I don't use all days?",
                a: "Passes are valid for consecutive days from activation. Unused days cannot be carried forward or refunded.",
              },
              {
                q: "Can I freeze my pass?",
                a: "Month passes include a freeze option (up to 7 days). Day and Week passes cannot be frozen.",
              },
              {
                q: "How do I enter the gym?",
                a: "Show the QR code in your Neyofit app at the gym reception. No physical card needed.",
              },
              {
                q: "Are there any hidden fees?",
                a: "No hidden fees. The price you see is the price you pay. All facilities are included.",
              },
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <dt className="font-semibold text-gray-900 mb-2">{faq.q}</dt>
                <dd className="text-gray-600">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Start Your Fitness Journey?</h2>
          <p className="text-blue-100 text-lg mb-8">Join thousands of members working out on their own terms.</p>
          <Link href="/gyms">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 text-lg gap-2">
              Find Gyms Near You
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}