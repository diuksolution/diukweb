'use client'

import landingData from '@/data/landing-page.json'
import { useScrollAnimation } from '@/lib/hooks/useScrollAnimation'

export default function TrustedBy() {
  const { trustedBy } = landingData
  const { ref, isVisible } = useScrollAnimation({ triggerOnce: true })

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-y border-gray-200">
      <div className="container mx-auto max-w-7xl">
        <p 
          className={`text-center text-gray-600 mb-12 text-lg transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {trustedBy.title}
        </p>
        
        {/* Brands Grid */}
        <div ref={ref} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center">
          {trustedBy.brands.map((brand, index) => (
            <div
              key={index}
              className={`flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-500 opacity-60 hover:opacity-100 group cursor-pointer ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ 
                transitionDelay: `${index * 0.05}s`,
                animation: isVisible ? `fadeInUp 0.6s ease-out ${index * 0.05}s forwards` : 'none'
              }}
            >
              <div 
                className="w-24 h-16 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center group-hover:border-lime-500/50 transition-all duration-300 shadow-sm group-hover:shadow-md"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to bottom right, rgba(48,61,131,0.1), rgba(132,204,22,0.1))'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f9fafb'
                }}
              >
                <span className="text-xs text-gray-600 group-hover:text-gray-900 font-medium text-center px-2 transition-colors">
                  {brand.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
