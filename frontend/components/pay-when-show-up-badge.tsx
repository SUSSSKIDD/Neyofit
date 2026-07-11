"use client"

import { motion } from "framer-motion"
import { CreditCard, CheckCircle, Shield, Zap, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PayWhenShowUpBadge() {
  const benefits = [
    "Book your session instantly with secure online payment",
    "Pay once and access your gym session anytime",
    "Easy cancellation with full refund if plans change",
  ]

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 opacity-95"></div>
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=500&width=800')] mix-blend-overlay opacity-10"></div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-700 rounded-full opacity-20 transform translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-700 rounded-full opacity-20 transform -translate-x-1/3 translate-y-1/3"></div>

      {/* Badge ribbon */}
      <div className="absolute -right-16 top-8 bg-gradient-to-r from-green-500 to-green-600 text-white px-20 py-2 transform rotate-45 shadow-lg">
        <span className="font-bold tracking-wider text-sm">SECURE PAYMENT</span>
      </div>

      <div className="relative z-10 p-8 md:p-10">
        <div className="flex items-center mb-6">
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-full mr-5">
            <CreditCard className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-white">Pay Online, Workout Anywhere</h3>
            <p className="text-blue-100">Secure payment, instant access</p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              className="flex items-start"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="bg-green-500 rounded-full p-1 mr-3 mt-0.5">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <span className="text-white text-lg">{benefit}</span>
            </motion.div>
          ))}
        </div>

        <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl mb-6">
          <div className="flex items-center mb-3">
            <Zap className="h-5 w-5 text-orange-400 mr-2" />
            <h4 className="font-bold text-white">How It Works</h4>
          </div>
          <p className="text-blue-100">
            Book your preferred gym session, pay securely online, and show up at the gym with instant access.
            Your payment is processed safely and you're all set!
          </p>
        </div>

        <div className="flex items-center justify-between bg-green-500 p-4 rounded-xl">
          <div className="flex items-center">
            <Shield className="h-6 w-6 text-white mr-3" />
            <p className="font-medium text-white">100% Secure. Instant Confirmation.</p>
          </div>
          <Button variant="ghost" className="text-white hover:bg-green-600 p-2">
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
