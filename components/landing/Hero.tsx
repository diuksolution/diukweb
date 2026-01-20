'use client'

import Link from 'next/link'
import landingData from '@/data/landing-page.json'
import { useState, useEffect } from 'react'

export default function Hero() {
  const { hero, header } = landingData
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  
  const whatsappNumber = header?.whatsapp?.number || '6281234567890'
  const whatsappUrl = `https://wa.me/${whatsappNumber}`

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center overflow-hidden" style={{ background: 'linear-gradient(to bottom right, rgba(48,61,131,0.1), white, rgba(132,204,22,0.1))' }}>
      {/* Animated Background Gradient */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom right, rgba(48,61,131,0.05), white, rgba(132,204,22,0.05))' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 30% 50%, rgba(48,61,131,0.1), transparent 50%)' }}></div>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 70% 80%, rgba(132,204,22,0.1), transparent 50%)' }}></div>
        <div className="absolute inset-0 animate-gradient" style={{ background: 'linear-gradient(to right, rgba(48,61,131,0.1), rgba(20,184,166,0.1), rgba(132,204,22,0.1))', backgroundSize: '200% 200%' }}></div>
      </div>

      {/* Floating Orbs with Parallax */}
      <div 
        className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl animate-float transition-transform duration-300"
        style={{ 
          transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
          background: 'rgba(48,61,131,0.3)'
        }}
      ></div>
      <div 
        className="absolute bottom-20 right-10 w-96 h-96 bg-lime-200/30 rounded-full blur-3xl animate-float transition-transform duration-300"
        style={{ 
          animationDelay: '1s',
          transform: `translate(${-mousePosition.x * 0.3}px, ${-mousePosition.y * 0.3}px)`
        }}
      ></div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-block mb-6 animate-fade-in-up cursor-default">
            <span className="relative backdrop-blur-sm border px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300" style={{ background: 'linear-gradient(to right, rgba(48,61,131,0.1), rgba(20,184,166,0.1), rgba(132,204,22,0.1))', borderColor: 'rgba(48,61,131,0.3)' }}>
              <span className="bg-clip-text text-transparent" style={{ background: 'linear-gradient(to right, #303d83, #14b8a6, #84cc16)', WebkitBackgroundClip: 'text' }}>
                {hero.badge}
              </span>
            </span>
          </div>

          {/* Title */}
          <h1 
            className="text-3xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight animate-fade-in-up cursor-default"
            style={{ animationDelay: '0.2s' }}
          >
            <span className="bg-clip-text text-transparent animate-gradient" style={{ background: 'linear-gradient(to right, #303d83, #14b8a6, #84cc16)', WebkitBackgroundClip: 'text', backgroundSize: '200% 200%' }}>
              {hero.title}
            </span>
          </h1>

          {/* Description */}
          <p 
            className="sm:text-xl text-sm text-gray-600 mb-12 max-w-3xl mx-auto animate-fade-in-up hover:text-gray-700 transition-colors duration-300"
            style={{ animationDelay: '0.4s' }}
          >
            {hero.description}
          </p>

          {/* CTA Buttons */}
          <div 
            className="flex flex-row gap-4 justify-center items-center mb-12 animate-fade-in-up"
            style={{ animationDelay: '0.6s' }}
          >
            {hero.ctaButtons.map((button, index) => {
              const isWhatsApp = button.label === 'Hubungi Kami'
              const href = isWhatsApp ? whatsappUrl : button.href
              return (
              <Link
                key={index}
                href={href}
                {...(isWhatsApp ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className={`
                  relative px-4 sm:px-8 py-2 sm:py-4 rounded-full font-semibold sm:text-lg text-[10px] transition-all duration-300 overflow-hidden group
                  ${
                    button.variant === 'primary'
                      ? 'text-gray-900 shadow-lg hover:shadow-xl'
                      : isWhatsApp 
                        ? 'text-white shadow-lg hover:shadow-xl'
                        : 'bg-white text-gray-900 border-2 border-gray-300 hover:border-lime-500 hover:bg-gray-50 shadow-md'
                  }
                `}
                style={
                  button.variant === 'primary' 
                    ? { background: 'linear-gradient(to right, #ffffff, #ffffff)' }
                    : isWhatsApp
                      ? { background: '#25D366' }
                      : {}
                }
              >
                {(button.variant === 'primary' || isWhatsApp) && (
                  <span 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                    style={isWhatsApp ? { background: '#128C7E' } : { background: 'linear-gradient(to right, #f6f6f6)' }}
                  ></span>
                )}
                <span className="relative z-10 flex items-center gap-2">
                                  {isWhatsApp && (
                                    <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 32 32"
                  className="w-4 h-4 sm:w-7 sm:h-7 fill-current"
                >
                  <path d="M16 0C7.164 0 0 7.163 0 16c0 2.82.736 5.57 2.133 8.004L0 32l8.246-2.133A15.89 15.89 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.09c-2.43 0-4.81-.65-6.87-1.88l-.49-.29-4.89 1.27 1.3-4.77-.32-.5A13.07 13.07 0 012.91 16C2.91 8.77 8.77 2.91 16 2.91S29.09 8.77 29.09 16 23.23 29.09 16 29.09zm7.42-9.94c-.41-.2-2.44-1.2-2.82-1.34-.38-.14-.66-.2-.94.21-.27.4-1.08 1.34-1.32 1.62-.24.27-.48.31-.89.1-.41-.2-1.72-.63-3.27-2.02-1.21-1.08-2.03-2.42-2.27-2.83-.24-.41-.03-.63.18-.83.19-.19.41-.48.61-.72.2-.24.27-.41.41-.68.14-.27.07-.51-.03-.72-.1-.2-.94-2.27-1.29-3.1-.34-.82-.69-.71-.94-.72h-.8c-.27 0-.72.1-1.1.51-.38.41-1.44 1.41-1.44 3.45 0 2.03 1.48 3.99 1.69 4.27.2.27 2.9 4.44 7.04 6.22.98.42 1.74.68 2.34.86.99.31 1.89.27 2.6.16.79-.12 2.44-1 2.78-1.96.34-.96.34-1.79.24-1.96-.1-.17-.38-.27-.79-.48z" />
                </svg>

                  )}
                  {button.label}
                </span>
              </Link>
            )})}
          </div>

          {/* Trusted By */}
          <p 
            className="sm:text-sm text-[12px] text-gray-500 mb-8 animate-fade-in-up hover:text-gray-600 transition-colors duration-300"
            style={{ animationDelay: '0.8s' }}
          >
            {hero.trustedBy}
          </p>
        </div>
      </div>
    </section>
  )
}
