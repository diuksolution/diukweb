'use client'

import landingData from '@/data/landing-page.json'
import { useScrollAnimation } from '@/lib/hooks/useScrollAnimation'

export default function Comparison() {
  const { comparison } = landingData
  const { ref: sectionRef, isVisible: sectionVisible } = useScrollAnimation({ triggerOnce: true })
  const { ref: beforeRef, isVisible: beforeVisible } = useScrollAnimation({ triggerOnce: true, threshold: 0.2 })
  const { ref: afterRef, isVisible: afterVisible } = useScrollAnimation({ triggerOnce: true, threshold: 0.2 })

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(48,61,131,0.1), white, rgba(132,204,22,0.1))' }}></div>
      
      <div ref={sectionRef} className="container mx-auto max-w-7xl relative z-10">
        <div className={`text-center mb-16 transition-all duration-700 ${
          sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="bg-clip-text text-transparent" style={{ background: 'linear-gradient(to right, #303d83, #14b8a6, #84cc16)', WebkitBackgroundClip: 'text' }}>
              {comparison.title}
            </span>
          </h2>
          <p className="text-xl text-gray-600">{comparison.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Before */}
          <div 
            ref={beforeRef}
            className={`bg-white rounded-2xl p-8 border-2 border-red-200 hover:border-red-400 transition-all duration-500 group shadow-lg hover:shadow-xl cursor-pointer ${
              beforeVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
            }`}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div className="mb-6">
              <span className="text-red-600 font-bold text-sm uppercase tracking-wide">
                {comparison.before.title}
              </span>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">
                {comparison.before.subtitle}
              </h3>
            </div>
            <div className="space-y-6">
              {comparison.before.items.map((item, index) => (
                <div 
                  key={index} 
                  className={`flex gap-4 transition-all duration-500 ${
                    beforeVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                  }`}
                  style={{ transitionDelay: `${0.2 + index * 0.1}s` }}
                >
                  <div className="text-2xl flex-shrink-0 transition-transform duration-300">{item.icon}</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                    {item.description && (
                      <p className="text-gray-600 text-sm">{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* After */}
          <div 
            ref={afterRef}
            className={`rounded-2xl p-8 border-2 border-lime-300 hover:border-lime-500 transition-all duration-500 group relative overflow-hidden shadow-lg hover:shadow-xl cursor-pointer ${
              afterVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
            }`}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
            }}
            style={{ background: 'linear-gradient(to bottom right, rgba(48,61,131,0.1), rgba(20,184,166,0.1), rgba(132,204,22,0.1))' }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(to right, rgba(48,61,131,0.1), rgba(20,184,166,0.1), rgba(132,204,22,0.1))' }}></div>
            <div className="relative z-10">
              <div className="mb-6">
                <span className="text-lime-600 font-bold text-sm uppercase tracking-wide">
                  {comparison.after.title}
                </span>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">
                  {comparison.after.subtitle}
                </h3>
              </div>
              <div className="space-y-6">
                {comparison.after.items.map((item, index) => (
                  <div 
                    key={index} 
                    className={`flex gap-4 transition-all duration-500 ${
                      afterVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                    }`}
                    style={{ transitionDelay: `${0.3 + index * 0.1}s` }}
                  >
                    <div className="text-2xl flex-shrink-0 transition-transform duration-300">{item.icon}</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                      {item.description && (
                        <p className="text-gray-700 text-sm">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
