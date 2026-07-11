"use client"

import { motion } from "framer-motion"
import { Smartphone, CheckCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function MobileBookingShowcase() {
  const features = [
    "Book a gym in under 30 seconds",
    "Get instant confirmation",
    "View gym details and directions",
    "Manage all your bookings in one place",
  ]

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-white to-blue-50 shadow-xl border border-blue-100">
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100 rounded-full opacity-20 transform translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-100 rounded-full opacity-30 transform -translate-x-1/3 translate-y-1/3"></div>

      <div className="relative z-10 p-8 md:p-12">
        <div className="flex flex-col md:flex-row items-center gap-12">
          {/* Content */}
          <div className="md:w-1/2">
            <div className="inline-block bg-blue-900 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
              Mobile Experience
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-4 text-blue-900">Book On The Go</h3>
            <p className="text-gray-700 mb-6 text-lg">
              Our mobile-friendly platform makes it easy to find and book gyms wherever you are.
            </p>

            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-start"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <div className="bg-blue-100 rounded-full p-1 mr-3 mt-0.5">
                    <CheckCircle className="h-5 w-5 text-blue-900" />
                  </div>
                  <span className="text-gray-700">{feature}</span>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button className="bg-blue-900 hover:bg-blue-800 shadow-lg hover:shadow-xl transition-all" disabled>
                <Smartphone className="mr-2 h-4 w-4" />
                App Coming Soon
              </Button>
              <Button variant="outline" className="border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white">
                Learn More
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Phone Mockup */}
          <div className="md:w-1/2 flex justify-center">
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="relative w-[300px] h-[600px]">
                <Image
                  src="/images/Neyofit-app-mockup.png"
                  alt="Neyofit mobile app"
                  width={600}
                  height={1200}
                  className="object-contain"
                  priority
                />
              </div>

              {/* Floating elements */}
              <motion.div
                className="absolute -top-4 -right-4 bg-orange-500 w-16 h-16 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                viewport={{ once: true }}
              >
                4.9 ★
              </motion.div>


            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
