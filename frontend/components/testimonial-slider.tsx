"use client"

import { useState, useEffect, useRef } from "react"
import { Star, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Testimonial {
  name: string
  location: string
  image: string
  quote: string
  rating: number
  profession?: string
}

export default function TestimonialSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const sliderRef = useRef<HTMLDivElement>(null)

  const testimonials: Testimonial[] = [
    {
      name: "Priya Sharma",
      location: "Mumbai",
      profession: "Software Engineer",
      image: "/placeholder.svg?height=100&width=100&text=PS",
      quote:
  "Neyofit made it so easy to find gyms while I travel for work. I've used it in 5 different cities now and never had to miss a workout!",
      rating: 5,
    },
    {
      name: "Rahul Verma",
      location: "Delhi",
      profession: "Marketing Manager",
      image: "/placeholder.svg?height=100&width=100&text=RV",
      quote:
        "The day pass option is perfect for my unpredictable schedule. No more wasting money on monthly memberships I barely use. Highly recommended!",
      rating: 4,
    },
    {
      name: "Ananya Patel",
      location: "Bangalore",
      profession: "Fitness Enthusiast",
      image: "/placeholder.svg?height=100&width=100&text=AP",
      quote:
        "As a woman, I appreciate the women-friendly gym filter. It helped me find a comfortable place to workout with dedicated women's hours.",
      rating: 5,
    },
    {
      name: "Vikram Singh",
      location: "Hyderabad",
      profession: "Business Traveler",
      image: "/placeholder.svg?height=100&width=100&text=VS",
      quote:
  "I travel constantly for work and Neyofit has been a game-changer. I can maintain my fitness routine in any city without expensive hotel gym fees.",
      rating: 5,
    },
  ]

  const goToSlide = (index: number) => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentSlide(index)

    setTimeout(() => {
      setIsTransitioning(false)
    }, 500)
  }

  const goToPrevSlide = () => {
    const newIndex = currentSlide === 0 ? testimonials.length - 1 : currentSlide - 1
    goToSlide(newIndex)
  }

  const goToNextSlide = () => {
    const newIndex = (currentSlide + 1) % testimonials.length
    goToSlide(newIndex)
  }

  useEffect(() => {
    if (!sliderRef.current) return

    const translateValue = currentSlide * -100
    sliderRef.current.style.transform = `translateX(${translateValue}%)`
  }, [currentSlide])

  // Auto-advance slides
  useEffect(() => {
    const interval = setInterval(() => {
      const nextSlide = (currentSlide + 1) % testimonials.length
      goToSlide(nextSlide)
    }, 5000)

    return () => clearInterval(interval)
  }, [currentSlide, testimonials.length])

  return (
    <div className="relative">
      {/* Navigation Arrows */}
      <div className="absolute top-1/2 left-4 transform -translate-y-1/2 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-white/80 hover:bg-white text-blue-900 shadow-md"
          onClick={goToPrevSlide}
          aria-label="Previous testimonial"
        >
          <ArrowLeft size={20} />
        </Button>
      </div>

      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-white/80 hover:bg-white text-blue-900 shadow-md"
          onClick={goToNextSlide}
          aria-label="Next testimonial"
        >
          <ArrowRight size={20} />
        </Button>
      </div>

      <div className="overflow-hidden">
        <div
          ref={sliderRef}
          className="flex transition-transform duration-500 ease-in-out"
          style={{ width: `${testimonials.length * 100}%` }}
        >
          {testimonials.map((testimonial, index) => (
            <div key={index} className="w-full px-4" style={{ width: `${100 / testimonials.length}%` }}>
              <div className="bg-white rounded-xl p-6 md:p-8 shadow-md h-full flex flex-col">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 rounded-full overflow-hidden mr-4 border-2 border-orange-200 flex-shrink-0">
                    <img
                      src={testimonial.image || "/placeholder.svg"}
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    {" "}
                    {/* Prevent text overflow */}
                    <h3 className="font-bold text-lg truncate">{testimonial.name}</h3>
                    <p className="text-sm text-gray-600 truncate">{testimonial.location}</p>
                    {testimonial.profession && (
                      <p className="text-sm text-gray-500 truncate">{testimonial.profession}</p>
                    )}
                  </div>
                </div>
                <div className="flex mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < testimonial.rating ? "fill-orange-500 text-orange-500" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-gray-700 italic flex-grow text-base md:text-lg leading-relaxed line-clamp-4 md:line-clamp-none">
                  "{testimonial.quote}"
                </p>
                <div className="mt-6 flex items-center">
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Verified User
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center mt-8 gap-2">
        {testimonials.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all ${
              currentSlide === index
                ? "bg-blue-900 opacity-100"
                : "bg-gray-300 hover:bg-blue-900 opacity-50 hover:opacity-100"
            }`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
