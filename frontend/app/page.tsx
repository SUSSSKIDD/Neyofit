"use client"

import { useRef, useEffect, useState } from "react"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import {
  ArrowRight,
  Shield,
  Zap,
  CreditCard,
  CalendarCheck,
  Globe,
  BadgeCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Footer from "@/components/footer"
import AnimatedNavbar from "@/components/animated-navbar"
import HowItWorksSection from "@/components/how-it-works-section"
import PopularGymsSection from "@/components/popular-gyms-section"
import dynamic from "next/dynamic"

const GymSearchWidget = dynamic(() => import("@/components/gym-search-widget"), { ssr: false })

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const [display, setDisplay] = useState("0")

  useEffect(() => {
    if (!isInView) return

    const duration = 2000
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.floor(eased * target).toLocaleString())
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [isInView, target])

  return (
    <span ref={ref} className="text-3xl md:text-4xl font-bold text-orange-500 tabular-nums">
      {display}{suffix}
    </span>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AnimatedNavbar />

      {/* ===== HERO SECTION ===== */}
      <section className="relative text-white pt-24 pb-36 md:pt-32 md:pb-44 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-blue-950/90 z-10" />
          <img
            src="/images/hero-background.jpeg"
            alt="Fitness training with battle ropes"
            className="w-full h-full object-cover scale-105"
          />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Animated badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-sm font-medium text-white/90">
                India&apos;s #1 Pay-Per-Day Gym Network
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-5 md:mb-7 leading-tight tracking-tight"
            >
              Transform Your{" "}
              <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                Fitness Journey
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="text-lg sm:text-xl md:text-2xl mb-10 text-gray-200 max-w-2xl mx-auto font-light"
            >
              Access verified fitness centers across India. No contracts. Pay only when you go.
            </motion.p>

            {/* Gym Search Widget */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7 }}
              className="max-w-3xl mx-auto"
            >
              <GymSearchWidget />
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 1 }}
              className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mt-8 text-sm text-white/70"
            >
              <span className="flex items-center gap-1.5">
                <BadgeCheck size={16} className="text-orange-400" />
                500+ Gyms
              </span>
              <span className="hidden sm:inline text-white/30">|</span>
              <span className="flex items-center gap-1.5">
                <Globe size={16} className="text-orange-400" />
                50+ Cities
              </span>
              <span className="hidden sm:inline text-white/30">|</span>
              <span className="flex items-center gap-1.5">
                <Shield size={16} className="text-orange-400" />
                Trusted by Thousands
              </span>
            </motion.div>
          </div>
        </div>

        {/* Clean fade to next section */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-blue-950 to-transparent z-10" />
      </section>

      {/* ===== STATS / TRUST BAR ===== */}
      <section className="bg-blue-950 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center">
            {[
              { value: 500, suffix: "+", label: "Verified Gyms" },
              { value: 50, suffix: "+", label: "Cities" },
              { value: 10000, suffix: "+", label: "Happy Members" },
              { value: 4.8, suffix: "", label: "Average Rating", isDecimal: true },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col items-center"
              >
                {stat.isDecimal ? (
                  <span className="text-3xl md:text-4xl font-bold text-orange-500">
                    {stat.value}{stat.suffix}
                  </span>
                ) : (
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                )}
                <span className="text-blue-200 text-sm mt-2 font-medium">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED GYMS SECTION ===== */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <p className="text-orange-500 font-semibold text-sm tracking-wide uppercase mb-3">
              Featured
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Gyms people love</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              Top-rated fitness centers across India, verified by our team
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <PopularGymsSection />
          </div>

          <div className="text-center mt-10">
            <Link href="/gyms">
              <Button
                size="lg"
                className="bg-blue-900 hover:bg-blue-800 text-white px-8 gap-2"
              >
                View All Gyms
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <HowItWorksSection />

      {/* ===== WHY NEYOFIT / BENEFITS ===== */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <span className="inline-block bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-sm font-medium mb-4">
              Why Choose Us
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Why Neyofit?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Everything you need for a flexible, hassle-free fitness experience
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: CalendarCheck,
                title: "No Commitment",
                description: "Pay per day, no monthly contracts. Work out on your own terms.",
                color: "text-orange-500",
                bg: "bg-orange-50",
              },
              {
                icon: BadgeCheck,
                title: "Verified Gyms",
                description: "Every gym is personally verified by our team for quality assurance.",
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                icon: Zap,
                title: "Instant Access",
                description: "Book online, walk in, and start working out — it's that simple.",
                color: "text-amber-500",
                bg: "bg-amber-50",
              },
              {
                icon: CreditCard,
                title: "Flexible Plans",
                description: "Daily, weekly, monthly — choose a plan that fits your lifestyle.",
                color: "text-green-600",
                bg: "bg-green-50",
              },
              {
                icon: Shield,
                title: "Secure Payments",
                description: "100% secure transactions with instant booking confirmation.",
                color: "text-purple-600",
                bg: "bg-purple-50",
              },
              {
                icon: Globe,
                title: "Pan-India Network",
                description: "Access gyms across 50+ cities, wherever life takes you.",
                color: "text-rose-500",
                bg: "bg-rose-50",
              },
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
              >
                <div className={`${benefit.bg} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <benefit.icon size={24} className={benefit.color} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950" />
        {/* Decorative blurs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-5">
              Ready to Transform Your{" "}
              <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                Fitness Journey?
              </span>
            </h2>
            <p className="text-blue-200 text-lg md:text-xl mb-10 font-light">
              Join thousands of fitness enthusiasts across India who trust Neyofit
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/gyms">
                <Button
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg gap-2 shadow-lg shadow-orange-500/20"
                >
                  Find a Gym
                  <ArrowRight size={20} />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg"
                >
                  Sign Up Free
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

