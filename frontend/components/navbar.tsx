"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, X, LogOut, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import CustomerLocationPicker from "@/components/customer-location-picker"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
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

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Location Picker */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link href="/" className="flex items-center flex-shrink-0">
              <img
                src="/images/neyofit.png"
                alt="Neyofit Logo"
                className="h-10 rounded-lg"
              />
            </Link>
            <CustomerLocationPicker
              compact
              onLocationSelect={() => {
                window.dispatchEvent(new Event("Neyofit-location-changed"))
              }}
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-blue-900 font-medium">
              Home
            </Link>
            <Link href="/gyms" className="text-gray-700 hover:text-blue-900 font-medium">
              Find Gyms
            </Link>
            {isAuthenticated && user && (
              <Link
                href={user.userType === 'superadmin' ? '/platform' : user.userType === 'gym' ? '/gym' : '/customer'}
                className="text-gray-700 hover:text-blue-900 font-medium"
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-600">Loading...</span>
              </div>
            ) : isAuthenticated && user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-700">Welcome, {user.name}</span>
                </div>
                <Button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Logging out...
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <>
                <Button
                  onClick={() => router.push('/login?tab=login')}
                  variant="outline"
                  className="border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white transition-all duration-300"
                >
                  Log In
                </Button>
                <Button
                  onClick={() => router.push('/login?tab=signup')}
                  className="bg-orange-500 hover:bg-orange-600 text-white transition-all duration-300"
                >
                  Sign Up
                </Button>
              </>
            )}          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 py-4">
          <div className="container mx-auto px-4 flex flex-col space-y-4">
            <Link
              href="/"
              className="text-gray-700 hover:text-blue-900 font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/gyms"
              className="text-gray-700 hover:text-blue-900 font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Find Gyms
            </Link>
            {isAuthenticated && user && (
              <Link
                href={user.userType === 'superadmin' ? '/platform' : user.userType === 'gym' ? '/gym' : '/customer'}
                className="text-gray-700 hover:text-blue-900 font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
            )}
            {/* <button
              onClick={() => {
                setIsMenuOpen(false)
                window.scrollTo({
                  top: document.documentElement.scrollHeight,
                  behavior: 'smooth'
                })
              }}
              className="text-gray-700 hover:text-blue-900 font-medium py-2 text-left cursor-pointer"
            >
              About Us
            </button> */}

            <div className="flex flex-col space-y-2 pt-2 border-t border-gray-200">
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
                        <LogOut className="h-4 w-4 mr-2" />
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
                    className="border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white w-full transition-all duration-300"
                  >
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
        </div>
      )}
    </header>
  )
}
