import Link from "next/link"
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function Footer() {
  return (
    <footer className="bg-blue-950 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <div className="mb-4">
              <img
                src="/images/neyofit.png"
                alt="Neyofit Logo"
                className="h-12 rounded-lg"
              />
            </div>
            <p className="text-blue-200 mb-4">
              India's premier fitness platform offering pay-per-day access to the best gyms across the country.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-blue-200 hover:text-white">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-blue-200 hover:text-white">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-blue-200 hover:text-white">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-blue-200 hover:text-white">
                <Youtube size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-blue-200 hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/gyms" className="text-blue-200 hover:text-white">
                  Find Gyms
                </Link>
              </li>
              <li>
                <Link href="/passes" className="text-blue-200 hover:text-white">
                  Gym Passes
                </Link>
              </li>
              <li>
                <Link href="/partner" className="text-blue-200 hover:text-white">
                  Partner With Us
                </Link>
              </li>

            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin size={18} className="mr-2 mt-1 text-orange-500" />
                <span className="text-blue-200">
                  144-B, Sai Nagar, Rau
                  <br />
                  Indore, Madhya Pradesh 453331
                </span>
              </li>
              <li className="flex items-center">
                <Phone size={18} className="mr-2 text-orange-500" />
                <a href="tel:+919876543210" className="text-blue-200 hover:text-white">
                  +91 9359458887
                </a>
              </li>
              <li className="flex items-center">
                <Mail size={18} className="mr-2 text-orange-500" />
                <a href="mailto:info@fitconnect.in" className="text-blue-200 hover:text-white">
                  sm29@sft@gmail.com
                </a>
              </li>
            </ul>
          </div>


        </div>

        <div className="border-t border-blue-900 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-blue-300 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Neyofit. All rights reserved.
          </p>
          <div className="flex space-x-4 text-sm text-blue-300">
            <Link href="/terms" className="hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms of Service
            </Link>
            <Link href="/faq" className="hover:text-white">
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
