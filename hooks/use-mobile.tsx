"use client"

import { useState, useEffect } from "react"

export function useMediaQuery(query: string): boolean {
  // Default to false on server
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Skip effect on server
    if (typeof window === "undefined") return

    // Function to update matches
    const updateMatches = () => {
      const media = window.matchMedia(query)
      setMatches(media.matches)
    }

    // Set initial value
    updateMatches()

    // Add listener for changes
    window.addEventListener("resize", updateMatches)

    // Clean up
    return () => {
      window.removeEventListener("resize", updateMatches)
    }
  }, [query])

  return matches
}
