"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, X, ChevronDown, User, Search, Dumbbell, MapPin, LogOut, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import CustomerLocationPicker from "@/components/customer-location-picker"

export default function AnimatedNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user, isAuthenticated, logout, isLoading } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsLoggingOut(false)
      setIsMenuOpen(false)
    }
  }

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const toggleDropdown = (name: string) => {
    if (activeDropdown === name) {
      setActiveDropdown(null)
    } else {
      setActiveDropdown(name)
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-md py-2" : "bg-transparent py-4"
        }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo + Location Picker */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link href="/" className="flex items-center flex-shrink-0">
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <img
                  src="/images/neyofit.png"
                  alt="Neyofit Logo"
                  className="h-10 rounded-lg"
                />
              </motion.div>
            </Link>
            <CustomerLocationPicker
              compact
              onLocationSelect={() => {
                window.dispatchEvent(new Event("Neyofit-location-changed"))
              }}
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1" ref={dropdownRef}>
            {([
              { name: "Home", href: "/", icon: null },
              {
                name: "Find Gyms",
                href: "/gyms",
                icon: Dumbbell,
                dropdown: [
                  { name: "By Location", href: "/gyms", icon: MapPin },
                  { name: "By Facilities", href: "/gyms", icon: Search },
                  { name: "Top Rated", href: "/gyms", icon: Star },
                ],
              },
              ...(isAuthenticated && user ? [{
                name: "Dashboard",
                href: user.userType === "superadmin" ? "/platform" : user.userType === "gym" ? "/gym" : "/customer",
                icon: null,
              }] : []),
            ] as Array<{
              name: string;
              href: string;
              icon: any;
              dropdown?: Array<{ name: string; href: string; icon: any }>;
              isScrollTo?: boolean;
            }>).map((item, index) => (
              <div key={item.name} className="relative group">
                {item.dropdown ? (
                  <button
                    onClick={() => toggleDropdown(item.name)}
                    className={`px-4 py-2 rounded-md flex items-center ${scrolled
                      ? "text-gray-700 hover:text-blue-900 hover:bg-blue-50"
                      : "text-white/90 hover:text-white hover:bg-white/10"
                      } font-medium transition-colors`}
                    aria-expanded={activeDropdown === item.name}
                    aria-haspopup="true"
                  >
                    {item.icon && <item.icon className="mr-1.5 h-4 w-4" />}
                    {item.name}
                    <ChevronDown
                      size={16}
                      className={`ml-1 transition-transform duration-200 ${activeDropdown === item.name ? "rotate-180" : ""
                        }`}
                    />
                  </button>
                ) : item.isScrollTo ? (
                  <button
                    onClick={() => {
                      window.scrollTo({
                        top: document.documentElement.scrollHeight,
                        behavior: 'smooth'
                      })
                    }}
                    className={`px-4 py-2 rounded-md flex items-center ${scrolled
                      ? "text-gray-700 hover:text-blue-900 hover:bg-blue-50"
                      : "text-white/90 hover:text-white hover:bg-white/10"
                      } font-medium transition-colors cursor-pointer`}
                  >
                    {item.icon && <item.icon className="mr-1.5 h-4 w-4" />}
                    {item.name}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={`px-4 py-2 rounded-md flex items-center ${scrolled
                      ? "text-gray-700 hover:text-blue-900 hover:bg-blue-50"
                      : "text-white/90 hover:text-white hover:bg-white/10"
                      } font-medium transition-colors`}
                  >
                    {item.icon && <item.icon className="mr-1.5 h-4 w-4" />}
                    {item.name}
                  </Link>
                )}

                {/* Dropdown menu */}
                {item.dropdown && (
                  <AnimatePresence>
                    {activeDropdown === item.name && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute left-0 mt-1 w-64 rounded-lg overflow-hidden shadow-lg bg-white ring-1 ring-black/5 z-50"
                        style={{ transformOrigin: "top center" }}
                      >
                        <div className="py-1">
                          {item.dropdown.map((subItem) => (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition-colors"
                            >
                              {subItem.icon && (
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-900 mr-3">
                                  <subItem.icon size={16} />
                                </span>
                              )}
                              <div>
                                <span className="font-medium block">{subItem.name}</span>
                                <span className="text-xs text-gray-500">
                                  {subItem.name === "By Location"
                                    ? "Find gyms in your area"
                                    : subItem.name === "By Facilities"
                                      ? "Search by equipment & amenities"
                                      : "Discover highest rated gyms"}
                                </span>
                              </div>
                            </Link>
                          ))}
                          <div className="px-4 py-3 bg-blue-50">
                            <Link
                              href="/gyms"
                              className="flex items-center justify-between text-sm font-medium text-blue-900 hover:text-blue-700"
                            >
                              View all gym options
                              <ArrowRight width={14} height={14} />
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            ))}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className={`h-4 w-4 animate-spin ${scrolled ? 'text-gray-600' : 'text-white/90'}`} />
                <span className={`text-sm ${scrolled ? 'text-gray-600' : 'text-white/90'}`}>Loading...</span>
              </div>
            ) : isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <User className={`h-4 w-4 ${scrolled ? 'text-gray-600' : 'text-white/90'}`} />
                  <span className={`text-sm ${scrolled ? 'text-gray-700' : 'text-white/90'}`}>Welcome, {user.name}</span>
                </div>
                <Button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  variant={scrolled ? "outline" : "ghost"}
                  className={
                    scrolled
                      ? "border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      : "border-red-400 text-red-400 hover:bg-red-500/20"
                  }
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Logging out...
                    </>
                  ) : (
                    <>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <>
                <Button
                  onClick={() => router.push('/login?tab=login')}
                  variant={scrolled ? "outline" : "ghost"}
                  className={
                    scrolled
                      ? "border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white transition-all duration-300"
                      : "border-white text-white hover:bg-white/20 transition-all duration-300"
                  }
                >
                  <User className="mr-2 h-4 w-4" />
                  Log In
                </Button>
                <Button
                  onClick={() => router.push('/login?tab=signup')}
                  className="bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden relative z-[60] flex-shrink-0"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X size={24} className="text-gray-800" />
            ) : (
              <Menu size={24} className={scrolled ? "text-gray-800" : "text-white"} />
            )}
          </button>
        </div>

      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "100vh" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white absolute w-full left-0 shadow-lg overflow-auto"
            style={{ top: "0", paddingTop: "70px" }}
          >
            <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
              <Link
                href="/"
                className="text-gray-700 hover:text-blue-900 font-medium py-3 border-b border-gray-100 flex items-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <div>
                <button
                  onClick={() => toggleDropdown("mobile-gyms")}
                  className="flex items-center justify-between w-full text-gray-700 hover:text-blue-900 font-medium py-3 border-b border-gray-100"
                >
                  <div className="flex items-center">
                    <Dumbbell className="mr-2 h-5 w-5 text-blue-900" />
                    <span>Find Gyms</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={
                      activeDropdown === "mobile-gyms" ? "rotate-180 transition-transform" : "transition-transform"
                    }
                  />
                </button>

                <AnimatePresence>
                  {activeDropdown === "mobile-gyms" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-4 mt-2 border-l-2 border-blue-100 space-y-3 py-2">
                        <Link
                          href="/gyms/location"
                          className="block py-2 text-gray-600 hover:text-blue-900 flex items-center"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <MapPin size={16} className="mr-2 text-blue-900" />
                          By Location
                        </Link>
                        <Link
                          href="/gyms/facilities"
                          className="block py-2 text-gray-600 hover:text-blue-900 flex items-center"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Search size={16} className="mr-2 text-blue-900" />
                          By Facilities
                        </Link>
                        <Link
                          href="/gyms/top-rated"
                          className="block py-2 text-gray-600 hover:text-blue-900 flex items-center"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Star width={16} height={16} className="mr-2 text-blue-900" />
                          Top Rated
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* <button
                onClick={() => {
                  setIsMenuOpen(false)
                  window.scrollTo({
                    top: document.documentElement.scrollHeight,
                    behavior: 'smooth'
                  })
                }}
                className="text-gray-700 hover:text-blue-900 font-medium py-3 border-b border-gray-100 text-left cursor-pointer"
              >
                About Us
              </button> */}

              <div className="flex flex-col space-y-3 pt-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-600">Loading...</span>
                  </div>
                ) : isAuthenticated && user ? (
                  <>
                    <div className="flex items-center space-x-2 py-2">
                      <User className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Welcome, {user.name}</span>
                    </div>
                    <Button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      variant="outline"
                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white w-full"
                    >
                      {isLoggingOut ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Logging out...
                        </>
                      ) : (
                        <>
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => {
                        setIsMenuOpen(false)
                        router.push('/login?tab=login')
                      }}
                      variant="outline"
                      className="border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white w-full flex items-center justify-center transition-all duration-300"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Log In
                    </Button>
                    <Button
                      onClick={() => {
                        setIsMenuOpen(false)
                        router.push('/login?tab=signup')
                      }}
                      className="bg-orange-500 hover:bg-orange-600 text-white w-full transition-all duration-300"
                    >
                      Sign Up
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

function Star(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function ArrowRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}
