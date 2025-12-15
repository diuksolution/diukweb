'use client'

import Link from 'next/link'
import landingData from '@/data/landing-page.json'
import { useScrollAnimation } from '@/lib/hooks/useScrollAnimation'

export default function FinalCTA() {
  const { finalCTA } = landingData
  const { ref, isVisible } = useScrollAnimation({ triggerOnce: true })

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 animate-gradient" style={{ background: 'linear-gradient(to bottom right, #303d83, #14b8a6, #84cc16)', backgroundSize: '200% 200%' }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]"></div>
      </div>
      
      {/* Floating Orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>

      <div 
        ref={ref}
        className={`container mx-auto max-w-4xl text-center relative z-10 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'
        }`}
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          {finalCTA.title}
        </h2>
        <p className="text-xl text-white/90 mb-8">{finalCTA.description}</p>
        
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {finalCTA.benefits.map((benefit, index) => (
            <span 
              key={index} 
              className={`text-white font-medium bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30 hover:bg-white/30 transition-all duration-300 cursor-default ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${0.2 + index * 0.1}s` }}
            >
              {benefit}
            </span>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {finalCTA.buttons.map((button, index) => (
            <Link
              key={index}
              href={button.href}
                className={`
                relative px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 overflow-hidden group
                ${
                  button.variant === 'primary'
                    ? 'bg-white shadow-xl hover:shadow-2xl'
                    : 'bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 hover:bg-white/20 hover:border-white'
                }
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
              `}
              style={{ 
                transitionDelay: `${0.4 + index * 0.1}s`,
                ...(button.variant === 'primary' ? { color: '#303d83' } : {})
              }}
            >
              {button.variant === 'primary' && (
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(to right, #303d83, #84cc16)', WebkitBackgroundClip: 'text' }}></span>
              )}
              <span className="relative z-10">{button.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
