"use client"

import { useEffect, useRef } from "react"
import { HeroSplineBackground } from "./HeroSplineBackground"
import { ScreenshotSection } from "./ScreenshotSection"
import { HeroContent } from "./HeroContent"
import CoursesPage from "./courses-home"
import { Navbar } from "./Navbar"
const HeroSection = () => {
  const screenshotRef = useRef<HTMLDivElement>(null)
  const heroContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (screenshotRef.current && heroContentRef.current) {
        requestAnimationFrame(() => {
          const scrollPosition = window.pageYOffset

          if (screenshotRef.current) {
            screenshotRef.current.style.transform = `translateY(-${scrollPosition * 0.5}px)`
          }

          const maxScroll = 400
          const opacity = 1 - Math.min(scrollPosition / maxScroll, 1)
          if (heroContentRef.current) {
            heroContentRef.current.style.opacity = opacity.toString()
          }
        })
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="relative">
      <Navbar />
      <div className="relative min-h-screen">
        <div className="absolute inset-0 z-0 pointer-events-auto">
          <HeroSplineBackground />
        </div>

        <div
          ref={heroContentRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          <HeroContent />
        </div>
      </div>
{/* 
      <div className="bg-black relative z-10" style={{ marginTop: "-10vh" }}>
        <div className="container mx-auto px-4 py-16 text-white">
          <h2 className="text-4xl font-bold text-center mb-8">Start Your Learning Journey</h2>
          <p className="text-center max-w-xl mx-auto opacity-80">
            Explore our curated courses, fork them to create your own versions, and earn NFTs while mastering new skills.
          </p>
        </div>
        <CoursesPage />
        <ScreenshotSection screenshotRef={screenshotRef} />
      </div> */}
    </div>
  )
}

export { HeroSection }
