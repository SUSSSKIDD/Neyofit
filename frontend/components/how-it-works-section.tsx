"use client"

import { Search, Calendar, Dumbbell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { motion } from "framer-motion"

const steps = [
  {
    number: "01",
    title: "Search",
    headline: "Find a gym that fits",
    description:
      "Enter your city or area. Filter by ratings, facilities, or price. Every listing is verified — no surprises.",
    icon: Search,
  },
  {
    number: "02",
    title: "Book",
    headline: "Pay securely & confirm",
    description:
      "Pick a day pass or plan. Pay online in seconds. You'll get instant confirmation — no calls, no waiting.",
    icon: Calendar,
  },
  {
    number: "03",
    title: "Train",
    headline: "Walk in & work out",
    description:
      "Show your booking at the gym. That's it. No paperwork, no registration desk. Just start your workout.",
    icon: Dumbbell,
  },
]

const faqs = [
  {
    q: "Do I have to pay online?",
    a: "Yes — online payment confirms your spot instantly. It's secure, fast, and means you can walk straight into the gym without any desk hassle.",
  },
  {
    q: "Can I cancel my booking?",
    a: "Anytime. Full refund, no questions asked. Refunds typically process within 3–5 business days.",
  },
  {
    q: "Do gyms accept walk-ins?",
    a: "Our partner gyms require advance booking through Neyofit. This guarantees your spot and gets you the best rates.",
  },
  {
    q: "What if the gym is closed when I arrive?",
    a: "Rare, but if it happens — contact us and we'll sort it out immediately. All timings are verified and regularly updated.",
  },
  {
    q: "Any hidden charges?",
    a: "Zero. The price you see is the price you pay. No booking fees, no convenience charges, nothing extra.",
  },
]

export default function HowItWorksSection() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mb-16 md:mb-20"
        >
          <p className="text-orange-500 font-semibold text-sm tracking-wide uppercase mb-3">
            How it works
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold leading-tight text-gray-900">
            Three steps to your <br className="hidden sm:block" />next workout
          </h2>
        </motion.div>

        {/* Steps — horizontal on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 lg:gap-12 mb-24">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.12 }}
              className="relative"
            >
              {/* Connector line (desktop only) */}
              {i < 2 && (
                <div className="hidden md:block absolute top-6 left-[calc(50%+40px)] w-[calc(100%-40px)] h-px bg-gray-200" />
              )}

              <div className="relative">
                {/* Step number + icon row */}
                <div className="flex items-center gap-4 mb-5">
                  <span className="text-4xl font-bold text-gray-200 tabular-nums select-none">
                    {step.number}
                  </span>
                  <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center">
                    <step.icon size={22} className="text-white" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {step.headline}
                </h3>
                <p className="text-gray-500 leading-relaxed text-[0.95rem]">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Common questions
            </h3>

            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-gray-200">
                  <AccordionTrigger className="text-left font-medium text-gray-900 hover:no-underline py-5">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-500 leading-relaxed pb-5">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-gray-400 text-sm mb-3">Something else on your mind?</p>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              >
                Get in touch
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
