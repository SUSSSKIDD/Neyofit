"use client";

import { ChevronDown, Search, Dumbbell, MapPin, CreditCard, Shield, Clock, Zap } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const faqCategories = [
  { id: "getting-started", name: "Getting Started", icon: Zap },
  { id: "passes", name: "Passes & Pricing", icon: CreditCard },
  { id: "gyms", name: "Gyms & Access", icon: Dumbbell },
  { id: "booking", name: "Booking & Check-in", icon: MapPin },
  { id: "account", name: "Account & Billing", icon: Shield },
  { id: "general", name: "General", icon: Clock },
];

const faqs = [
  // Getting Started
  {
    category: "getting-started",
    q: "What is Neyofit?",
    a: "Neyofit is a flexible fitness platform that lets you access 100+ partner gyms without long-term contracts. Buy passes for 1 day, 1 week, or 1 month and workout at any gym in our network."
  },
  {
    category: "getting-started",
    q: "How do I get started?",
    a: "Simply create an account, browse gyms near you, choose a pass, and start working out. No approval process — instant access after purchase."
  },
  {
    category: "getting-started",
    q: "Is there a membership fee?",
    a: "No monthly membership fees. You only pay for passes when you want to workout. Create an account for free."
  },
  {
    category: "getting-started",
    q: "Which cities are you in?",
    a: "We currently operate in 15+ major cities across India including Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Pune, and more. Check our gyms page for your city."
  },

  // Passes & Pricing
  {
    category: "passes",
    q: "What types of passes are available?",
    a: "Day Pass (₹299) - 24 hour access, Week Pass (₹999) - 7 consecutive days, Month Pass (₹2,499) - 30 days unlimited access. All passes work at any partner gym."
  },
  {
    category: "passes",
    q: "Can I buy multiple passes at once?",
    a: "Yes! You can purchase multiple passes and they'll stack. For example, buy 4 week passes for a month of flexible access."
  },
  {
    category: "passes",
    q: "Do passes expire?",
    a: "Passes activate when you first use them (check-in at a gym). Day passes last 24 hours, week passes 7 consecutive days, month passes 30 consecutive days from activation."
  },
  {
    category: "passes",
    q: "Can I get a refund?",
    a: "Unactivated passes can be refunded within 7 days of purchase. Once activated (first check-in), passes are non-refundable but month passes can be frozen for up to 7 days."
  },
  {
    category: "passes",
    q: "Are there any hidden fees?",
    a: "Absolutely not. The price you see is the price you pay. No joining fees, no maintenance fees, no cancellation fees."
  },

  // Gyms & Access
  {
    category: "gyms",
    q: "Can I go to any gym with my pass?",
    a: "Yes! Your pass gives you access to ALL 100+ partner gyms in our network. No restrictions on which gym or how many different gyms you visit."
  },
  {
    category: "gyms",
    q: "What facilities are included?",
    a: "All standard gym facilities: cardio area, strength training, free weights, functional training, and locker rooms. Premium facilities (pool, sauna, classes) vary by gym — check individual gym pages."
  },
  {
    category: "gyms",
    q: "Can I bring a guest?",
    a: "Month pass holders get 1 free guest pass per month. Day and week passes don't include guest access. Guests must be accompanied by the pass holder."
  },
  {
    category: "gyms",
    q: "What are the gym hours?",
    a: "Hours vary by gym. Most are open 6 AM – 11 PM, some 24/7. Check individual gym pages for exact timings before visiting."
  },

  // Booking & Check-in
  {
    category: "booking",
    q: "Do I need to book a slot?",
    a: "No booking required for most gyms! Just walk in during open hours and check in with your QR code. Some premium gyms may require slot booking during peak hours — we'll notify you."
  },
  {
    category: "booking",
    q: "How does check-in work?",
    a: "Open the Neyofit app, go to 'My Passes', tap 'Check In', show the QR code at reception. Takes 5 seconds. No physical card needed."
  },
  {
    category: "booking",
    q: "What if I forget my phone?",
    a: "You can check in using your registered email/phone at the front desk. However, we strongly recommend using the app for the fastest experience."
  },
  {
    category: "booking",
    q: "Can I check in multiple times a day?",
    a: "Yes, you can enter and exit the same gym multiple times during your pass validity. Just re-scan your QR code each time."
  },

  // Account & Billing
  {
    category: "account",
    q: "How do I update my payment method?",
    a: "Go to Settings → Payment Methods in your account. You can add UPI, cards, or net banking. All payments are secured by Razorpay."
  },
  {
    category: "account",
    q: "Can I pause my account?",
    a: "Your account doesn't need pausing — you simply don't buy passes when you don't want to workout. No monthly charges ever."
  },
  {
    category: "account",
    q: "How do I download receipts?",
    a: "All receipts are available in Settings → Purchase History. You can download PDF invoices for each transaction."
  },
  {
    category: "account",
    q: "Is my payment info secure?",
    a: "Yes. We use Razorpay (PCI DSS Level 1 certified) for all payments. We never store your card details on our servers."
  },

  // General
  {
    category: "general",
    q: "What if I have an issue at a gym?",
    a: "Contact our 24/7 support via the app chat or email support@neyofit.in. We'll resolve it within 2 hours during business hours."
  },
  {
    category: "general",
    q: "Can I transfer my pass to someone else?",
    a: "Passes are non-transferable and linked to your account. Sharing passes violates our terms and may result in account suspension."
  },
  {
    category: "general",
    q: "Do you have a referral program?",
    a: "Yes! Refer a friend and you both get ₹200 credit when they buy their first pass. Find your referral code in the app."
  },
  {
    category: "general",
    q: "How do I contact support?",
    a: "In-app chat (fastest), email support@neyofit.in, or call +91-80-XXXX-XXXX (Mon-Sat, 9 AM - 9 PM)."
  },
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const filteredFAQs = faqs.filter((faq) => {
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    const matchesSearch = faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/hero-background.jpeg')] bg-cover bg-center opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="max-w-3xl text-center mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Frequently Asked <span className="text-orange-400">Questions</span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 mb-8">
              Everything you need to know about Neyofit passes, gyms, and your account.
            </p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 w-5 h-5" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="py-8 bg-white sticky top-0 z-10 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => { setActiveCategory("all"); setSearchQuery(""); }}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === "all"
                  ? "bg-blue-900 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Questions
            </button>
            {faqCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setSearchQuery(""); }}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                  activeCategory === cat.id
                    ? "bg-blue-900 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <cat.icon className="w-4 h-4" />
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {filteredFAQs.map((faq, index) => (
              <div
                key={`${faq.category}-${index}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <button
                  onClick={() => toggleExpand(index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                >
                  <span className="font-medium text-gray-900 pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                      expandedItems.has(index) ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {expandedItems.has(index) && (
                  <div className="px-6 pb-6 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
            {filteredFAQs.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No questions match your search. Try different keywords or browse all categories.</p>
              </div>
            )}
          </div>

          {/* Still need help? */}
          <div className="mt-16 bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Still Have Questions?</h2>
            <p className="text-gray-600 mb-6 max-w-lg mx-auto">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="bg-blue-900 hover:bg-blue-800 text-white px-8 py-3 gap-2">
                  Chat with Support
                </Button>
              </Link>
              <a href="mailto:support@neyofit.in">
                <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 gap-2">
                  Email Us
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}