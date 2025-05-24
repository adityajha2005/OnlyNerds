import React from "react"
import { motion } from "framer-motion"
// import { CTA } from "./call-to-action"
interface ScreenshotSectionProps {
  screenshotRef: React.RefObject<HTMLDivElement | null>
}

export function ScreenshotSection({ screenshotRef }: ScreenshotSectionProps) {
  return (
    <section className="relative z-10 container mx-auto px-4 md:px-6 lg:px-8">
      {/* <CTA /> */}
    </section>
  )
} 