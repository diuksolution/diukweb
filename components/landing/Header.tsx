'use client'

import Link from 'next/link'
import Image from 'next/image'
import landingData from '@/data/landing-page.json'
import { useState, useEffect } from 'react'

export default function Header() {
  const { header } = landingData
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50">
      <nav className={`container mx-auto max-w-7xl transition-all duration-300  px-6 sm:px-8 lg:px-12 ${
          !isMobile ? 'rounded-full my-2' : 'rounded-lg my-0'
        } ${
          scrolled || mobileMenuOpen
          ? 'bg-white/30 backdrop-blur-xl border-b border-white shadow-lg' 
          : 'bg-transparent backdrop-blur-none border-b border-transparent'
        }`}
      >
        <div className="flex items-center justify-between h-15">
          {/* Logo */}
          <Link 
            href={header.logo.href} 
            className="flex items-center space-x-2 group animate-fade-in-up"
          >
            <div className="relative w-24 h-24 transition-transform duration-300 group-hover:scale-110">
              <Image
                src="/logonavbar.png"
                alt="DIUK Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {header.navItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-all duration-300 relative group ${
                  scrolled 
                    ? 'text-gray-700 hover:text-gray-900' 
                    : 'text-gray-800 hover:text-gray-900'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {item.label}
                <span 
                  className="absolute bottom-0 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300"
                  style={{ background: 'linear-gradient(to right, #303d83, #84cc16)' }}
                ></span>
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href={header.ctaButtons.login.href}
              className={`relative px-6 py-2.5 rounded-full font-semibold overflow-hidden group transition-all duration-300 ${
                scrolled
                  ? 'text-white'
                  : 'bg-white/90 backdrop-blur-sm text-gray-900 border border-gray-300'
              }`}
              style={scrolled ? { background: 'linear-gradient(to right, #303d83, #14b8a6, #84cc16)' } : {}}
            >
                            {scrolled ? (
                <>
                  <span 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'linear-gradient(to right, #252f6a, #119a8a, #6fb313)' }}
                  ></span>
                  <span className="relative z-10">{header.ctaButtons.login.label}</span>
                </>
              ) : (
                <span 
                  className="relative z-10 bg-clip-text text-transparent group-hover:text-gray-900 transition-all duration-300"
                  style={{ background: 'linear-gradient(to right, #303d83, #84cc16)', WebkitBackgroundClip: 'text' }}
                >
                  {header.ctaButtons.login.label}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className={`md:hidden p-2 transition-colors duration-300 ${
              scrolled ? 'text-gray-700' : 'text-gray-800'
            }`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4 animate-fade-in">
            {header.navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block transition-colors duration-300 ${
                  scrolled 
                    ? 'text-gray-700 hover:text-gray-900' 
                    : 'text-gray-800 hover:text-gray-900'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-gray-200/50">
              <Link
                href={header.ctaButtons.login.href}
                className="relative block w-full text-center px-6 py-2.5 rounded-full font-semibold overflow-hidden group transition-all duration-300"
                style={{ background: 'linear-gradient(to right, #303d83, #14b8a6, #84cc16)' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(to right, #252f6a, #119a8a, #6fb313)' }}
                ></span>
                <span className="relative z-10 text-white">{header.ctaButtons.login.label}</span>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
