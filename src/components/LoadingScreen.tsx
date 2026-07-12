"use client"

import React, { useState, useEffect } from 'react'

const MESSAGES = [
  "Setting up your dashboard...",
  "Loading admission records...",
  "Fetching lead information...",
  "Preparing fee overview...",
  "Syncing student data...",
  "Loading your institution profile...",
  "Fetching calendar events...",
  "Preparing reports...",
  "Loading counsellor assignments...",
  "Syncing Vidhyaan marketplace data..."
]

export default function LoadingScreen() {
  const [messageIndex, setMessageIndex] = useState(0)
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    const interval = setInterval(() => {
      // Start fade out (takes 500ms)
      setOpacity(0)
      
      setTimeout(() => {
        // Change message index randomly
        setMessageIndex((prev) => {
          let next = prev
          while (next === prev) {
            next = Math.floor(Math.random() * MESSAGES.length)
          }
          return next
        })
        // Start fade in (takes 500ms)
        setOpacity(1)
      }, 500)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-between py-12 px-4 select-none">
      {/* Dynamic inline styles for concentric circles rotation and progress bar animation */}
      <style>{`
        @keyframes rotate-clockwise {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes rotate-counter-clockwise {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes progress-fill {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-clockwise-slow {
          animation: rotate-clockwise 3s linear infinite;
        }
        .animate-counter-clockwise-medium {
          animation: rotate-counter-clockwise 2s linear infinite;
        }
        .animate-clockwise-fast {
          animation: rotate-clockwise 1s linear infinite;
        }
        .animate-progress {
          animation: progress-fill 3s linear infinite;
        }
      `}</style>

      {/* Spacer to align content nicely */}
      <div />

      {/* Center content wrapper */}
      <div className="flex flex-col items-center text-center space-y-8 max-w-sm">
        {/* Branding & Logo */}
        <div className="flex flex-col items-center space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {/* loading=lazy stops React SSR from emitting a <link rel=preload> for a
              fallback that unmounts before the image counts as "used" */}
          <img src="/brand/vidhyaan-icon.svg" alt="" loading="lazy" className="w-12 h-12" />
          <h2 className="text-xl font-bold text-slate-800 font-sans tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Vidhyaan
          </h2>
        </div>

        {/* Triple ring spinner */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Outer ring: 30% opacity #1565D8, rotates clockwise slowly */}
          <div className="absolute w-24 h-24 rounded-full border-[3px] border-[#1565D8]/30 border-t-transparent border-r-transparent animate-clockwise-slow" />
          
          {/* Middle ring: 60% opacity #1565D8, rotates counter-clockwise */}
          <div className="absolute w-16 h-16 rounded-full border-[3px] border-[#1565D8]/60 border-b-transparent border-l-transparent animate-counter-clockwise-medium" />
          
          {/* Inner ring: full opacity #1565D8, rotates clockwise fast */}
          <div className="absolute w-8 h-8 rounded-full border-[3px] border-[#1565D8] border-t-transparent border-l-transparent animate-clockwise-fast" />
        </div>

        {/* Loading Message & Progress Bar */}
        <div className="flex flex-col items-center space-y-4">
          <p 
            className="text-sm font-semibold text-slate-600 h-5 transition-opacity duration-500 ease-in-out font-sans"
            style={{ opacity }}
          >
            {MESSAGES[messageIndex]}
          </p>

          {/* Progress Bar Container */}
          <div className="w-[280px] h-[3px] bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#1565D8] rounded-full animate-progress" />
          </div>
        </div>
      </div>

      {/* Powered by footer */}
      <div className="text-xs text-slate-400 font-medium tracking-wide font-sans">
        Powered by Vidhyaan
      </div>
    </div>
  )
}
