"use client"

import { useEffect, useRef, useState } from "react"
import { useGoogleMaps } from "@/components/google-maps-provider"

interface AdvancedMarkerElementProps {
  position: { lat: number; lng: number }
  onClick?: () => void
  title?: string
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  zIndex?: number
}

export function AdvancedMarkerElement({
  position,
  onClick,
  title,
  children,
  className = "",
  style,
  zIndex,
}: AdvancedMarkerElementProps) {
  const { isLoaded } = useGoogleMaps()
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!isLoaded || !contentRef.current || markerRef.current) return

    // Create the marker content element
    const element = contentRef.current
    element.style.position = "absolute"

    const marker = new google.maps.marker.AdvancedMarkerElement({
      position,
      content: element,
      title,
      zIndex,
      gmpClickable: !!onClick,
    })

    markerRef.current = marker

    if (onClick) {
      marker.addListener("click", onClick)
    }

    // Cleanup
    return () => {
      if (markerRef.current) {
        markerRef.current.map = null
        markerRef.current = null
      }
    }
  }, [isLoaded, position, onClick, title, zIndex])

  if (!isLoaded || !mounted) {
    return null
  }

  return (
    <div
      ref={contentRef}
      className={className}
      style={{ ...style, display: "block" }}
    >
      {children}
    </div>
  )
}

// Helper to render a pin SVG as marker content
export function createPinElement(
  color: string,
  size: number = 36,
  borderColor: string = "#ffffff",
  borderWidth: number = 3
): HTMLElement {
  const pin = document.createElement("div")
  pin.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    border-radius: 50% 50% 50% 0;
    background: ${color};
    transform: rotate(-45deg);
    border: ${borderWidth}px solid ${borderColor};
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  `
  
  const inner = document.createElement("div")
  inner.style.cssText = `
    width: 100%;
    height: 100%;
    border-radius: 50% 50% 50% 0;
    background: ${color};
    transform: rotate(45deg);
    display: flex;
    align-items: center;
    justify-content: center;
  `
  
  pin.appendChild(inner)
  return pin
}

export function createUserPinElement(
  color: string = "#3B82F6",
  size: number = 24,
  borderColor: string = "#ffffff",
  borderWidth: number = 3
): HTMLElement {
  const pin = document.createElement("div")
  pin.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    background: ${color};
    border: ${borderWidth}px solid ${borderColor};
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    cursor: default;
  `
  return pin
}