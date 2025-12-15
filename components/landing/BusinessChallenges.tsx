'use client'

import Image from 'next/image'
import landingData from '@/data/landing-page.json'
import { useScrollAnimation } from '@/lib/hooks/useScrollAnimation'

export default function BusinessChallenges() {
  const { businessChallenges } = landingData
  const { ref: sectionRef, isVisible: sectionVisible } = useScrollAnimation({ triggerOnce: true })

  if (!businessChallenges) return null

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, rgba(48,61,131,0.05), white, rgba(132,204,22,0.05))' }}>
      {/* Background Effects */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(48,61,131,0.03), white, rgba(132,204,22,0.03))' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 20% 30%, rgba(48,61,131,0.08), transparent 50%)' }}></div>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 80% 70%, rgba(132,204,22,0.08), transparent 50%)' }}></div>
      </div>

      <div ref={sectionRef} className="container mx-auto max-w-7xl relative z-10">
        {/* Title */}
        <div className={`text-center mb-12 transition-all duration-700 ${
          sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="text-gray-800">{businessChallenges.title}</span>{' '}
            <span className="bg-clip-text text-transparent" style={{ background: 'linear-gradient(to right, #303d83, #14b8a6, #84cc16)', WebkitBackgroundClip: 'text' }}>
              {businessChallenges.titleHighlight}
            </span>
          </h2>
          <p className="text-xl text-gray-600">{businessChallenges.subtitle}</p>
        </div>

        {/* Main Content - Flex Layout */}
        <div className={`flex flex-col lg:flex-row gap-8 lg:gap-12 items-center transition-all duration-700 ${
          sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}>
          {/* Image Section */}
          <div className="flex-1 w-full lg:w-auto">
            {businessChallenges.image && (
              <div className="relative rounded-2xl overflow-hidden">
                <Image
                  src={businessChallenges.image}
                  alt="Business Challenges"
                  width={700}
                  height={700}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}
          </div>

          {/* Content Card */}
          <div className={`flex-1 w-full bg-white rounded-3xl p-8 md:p-12 shadow-xl transition-all duration-700 ${
            sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
          style={{ 
            background: 'linear-gradient(to bottom right, rgba(255,255,255,0.95), rgba(255,255,255,0.98))',
            boxShadow: '0 20px 60px rgba(48,61,131,0.1), 0 0 0 1px rgba(132,204,22,0.2)'
          }}>
          {/* Challenges List */}
          <div className="space-y-4 mb-8">
            {businessChallenges.challenges.map((challenge, index) => {
              const { ref, isVisible } = useScrollAnimation({ triggerOnce: true, threshold: 0.1 })
              return (
                <div
                  key={index}
                  ref={ref}
                  className={`flex items-start gap-4 transition-all duration-500 ${
                    isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                  }`}
                  style={{ transitionDelay: `${0.1 + index * 0.1}s` }}
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(to right, #303d83, #84cc16)' }}>
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-md md:text-md font-semibold" style={{ color: '#303d83' }}>
                      {challenge.text}
                      {challenge.consequence && (
                        <>
                          {' → '}
                          <span style={{ color: '#84cc16' }}>{challenge.consequence}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Consequences */}
          <div className={`pt-8 border-t-2 border-gray-200 transition-all duration-700 ${
            sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '0.6s' }}>
            <p className="text-md md:text-md font-bold text-gray-800 mb-4">
              {businessChallenges.consequences.prefix}
            </p>
            <div className="flex flex-wrap gap-3">
              {businessChallenges.consequences.items.map((item, index) => {
                const { ref, isVisible } = useScrollAnimation({ triggerOnce: true, threshold: 0.1 })
                return (
                  <span
                    key={index}
                    ref={ref}
                    className={`inline-block text-xs md:text-xs px-6 py-3 rounded-full font-semibold text-white transition-all duration-500 ${
                      isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                    }`}
                    style={{ 
                      background: 'linear-gradient(to right, #303d83, #14b8a6, #84cc16)',
                      transitionDelay: `${0.7 + index * 0.1}s`
                    }}
                  >
                    {item}
                  </span>
                )
              })}
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  )
}

