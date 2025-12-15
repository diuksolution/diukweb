'use client'

import Image from 'next/image'
import landingData from '@/data/landing-page.json'
import { useScrollAnimation } from '@/lib/hooks/useScrollAnimation'

export default function Services() {
  const { services } = landingData
  const { ref: sectionRef, isVisible: sectionVisible } = useScrollAnimation({ triggerOnce: true })

  if (!services) return null

  return (
    <section id="services" className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, rgba(48,61,131,0.05), white, rgba(132,204,22,0.05))' }}>
      {/* Background Effects */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(48,61,131,0.03), white, rgba(132,204,22,0.03))' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 20% 30%, rgba(48,61,131,0.08), transparent 50%)' }}></div>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 80% 70%, rgba(132,204,22,0.08), transparent 50%)' }}></div>
      </div>

      <div ref={sectionRef} className="container mx-auto max-w-7xl relative z-10">
        {/* Header */}
        <div className={`text-center mb-12 transition-all duration-700 ${
          sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="bg-clip-text text-transparent" style={{ background: 'linear-gradient(to right, #303d83, #14b8a6, #84cc16)', WebkitBackgroundClip: 'text' }}>
              {services.titleHighlight}
            </span>
            <span className="text-gray-800">{services.title}</span>{' '}
          </h2>
          <p className="text-xl text-gray-600">{services.subtitle}</p>
        </div>

        {/* Main Content - Flex Layout (Kebalikan dari BusinessChallenges) */}
        <div className={`flex flex-col lg:flex-row-reverse gap-8 lg:gap-12 items-center transition-all duration-700 ${
          sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}>
          {/* Image Section - Kanan */}
          <div className="flex-1 w-full lg:w-auto">
            {services.image && (
              <div className="">
                <Image
                  src={services.image}
                  alt="DIUK Services"
                  width={500}
                  height={500}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}
          </div>

          {/* Content Card - Kiri */}
          <div className={`flex-1 w-full bg-white rounded-3xl p-8 md:p-12 shadow-xl transition-all duration-700 ${
            sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
          style={{ 
            background: 'linear-gradient(to bottom right, rgba(255,255,255,0.95), rgba(255,255,255,0.98))',
            boxShadow: '0 20px 60px rgba(48,61,131,0.1)'
          }}>
          {/* Benefits List */}
          <div className="space-y-4 mb-8">
            {services.benefits.map((benefit: string, index: number) => {
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
                    <p className="text-md md:text-lg font-semibold" style={{ color: '#14b8a6' }}>
                      {benefit}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Output */}
          <div className={`pt-8 border-t-2 border-gray-200 transition-all duration-700 ${
            sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '0.6s' }}>
            <p className="text-md md:text-lg font-bold text-gray-800 mb-4">
              {services.output.prefix}: <span className="text-gray-600 font-normal">
                {services.output.items.join(', ')}.
              </span>
            </p>
          </div>
          </div>
        </div>
      </div>
    </section>
  )
}

