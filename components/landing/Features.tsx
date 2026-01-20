'use client'

import Image from 'next/image'
import landingData from '@/data/landing-page.json'
import { useScrollAnimation } from '@/lib/hooks/useScrollAnimation'

export default function Features() {
  const { features, header } = landingData
  const { ref: sectionRef, isVisible: sectionVisible } = useScrollAnimation({ triggerOnce: true })
  
  const whatsappNumber = header?.whatsapp?.number || '6281234567890'
  const whatsappUrl = `https://wa.me/${whatsappNumber}`

  if (!features) return null

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, rgba(48,61,131,0.05), white, rgba(132,204,22,0.05))' }}>
      {/* Background Effects */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(48,61,131,0.03), white, rgba(132,204,22,0.03))' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 20%, rgba(48,61,131,0.08), transparent 60%)' }}></div>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 80%, rgba(132,204,22,0.08), transparent 60%)' }}></div>
      </div>

      <div ref={sectionRef} className="container mx-auto max-w-7xl relative z-10">
        {/* Main Title */}
        <div className={`text-center mb-16 transition-all duration-700 ${
          sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className="bg-clip-text text-transparent" style={{ background: 'linear-gradient(to right, #303d83, #14b8a6, #84cc16)', WebkitBackgroundClip: 'text' as any }}>
              {features.title}
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">{features.subtitle}</p>
        </div>

        {/* What DIUK Does - 5 Steps */}
        {features.whatDiukDoes && (
          <div className="mb-24">
            <div className="relative">

              {/* 5 Steps Grid with Varied Layouts */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-16">
                {features.whatDiukDoes.steps.map((step: any, index: number) => {
                  const { ref, isVisible } = useScrollAnimation({ triggerOnce: true, threshold: 0.2 })
                  const isEven = index % 2 === 0
                  return (
                    <div
                      key={index}
                      ref={ref}
                      className={`relative group transition-all duration-500 ${
                        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                      }`}
                      style={{ transitionDelay: `${index * 0.1}s` }}
                    >
                      {/* Connecting Line with Animation */}
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-0.5 h-6 opacity-30 hidden lg:block group-hover:opacity-60 transition-opacity duration-300" style={{ 
                        background: 'linear-gradient(to bottom, #84cc16, transparent)',
                        animation: 'pulse 2s ease-in-out infinite'
                      }}></div>
                      
                      {/* Step Card with Varied Styles */}
                      <div 
                        className={`relative rounded-2xl p-6 border-2 transition-all duration-300 shadow-lg cursor-pointer h-full overflow-hidden hover:shadow-xl ${
                          isEven 
                            ? 'bg-white border-transparent hover:border-lime-400' 
                            : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-lime-400'
                        }`}
                      >
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300" style={{
                          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(48,61,131,0.15) 1px, transparent 0)',
                          backgroundSize: '20px 20px'
                        }}></div>
                        
                        {/* Image */}
                        {step.image && (
                          <div className="w-50 h-50 mx-auto mb-4 transition-all duration-300 relative z-10">
                            <Image
                              src={step.image}
                              alt={step.title}
                              fill
                              className="object-contain"
                            />
                          </div>
                        )}
                        
                        {/* Title */}
                        <p className="text-sm md:text-base font-semibold text-gray-800 leading-tight relative z-10 group-hover:text-gray-900 transition-colors duration-300">
                          {step.title}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Result */}
              <div className={`text-center transition-all duration-700 ${
                sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: '0.6s' }}>
                <div className="relative inline-block">
                  {/* Main Badge */}
                  <div className="relative px-10 py-5 rounded-2xl font-bold text-white text-lg md:text-xl shadow-2xl transition-all duration-300 hover:shadow-3xl" style={{ 
                    background: 'linear-gradient(135deg, #303d83, #14b8a6, #84cc16)',
                    boxShadow: '0 20px 60px rgba(48,61,131,0.4)'
                  }}>
                    <span className="relative z-10">{features.whatDiukDoes.result}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Workflow Section with Clear Flow */}
        {features.workflow && (
          <div className="mb-24">
            <h3 className={`text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-16 transition-all duration-700 ${
              sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '0.8s' }}>
              <span className="bg-clip-text text-transparent" style={{ background: 'linear-gradient(to right, #303d83, #14b8a6, #84cc16)', WebkitBackgroundClip: 'text' as any }}>
                {features.workflow.title}
              </span>
            </h3>

            {/* Workflow Flow - Clean Horizontal Layout */}
            <div className="relative">
              {/* Desktop: Horizontal Flow */}
              <div className="hidden lg:flex items-center justify-center gap-0 relative">
                {features.workflow.steps.map((step: any, index: number) => {
                  const { ref, isVisible } = useScrollAnimation({ triggerOnce: true, threshold: 0.1 })
                  const isLast = index === features.workflow.steps.length - 1
                  
                  return (
                    <div key={index} className="flex items-center">
                      {/* Step Container */}
                      <div
                        ref={ref}
                        className={`flex flex-col items-center transition-all duration-500 ${
                          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                        }`}
                        style={{ transitionDelay: `${0.9 + index * 0.1}s` }}
                      >
                        {/* Step Circle */}
                        <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-xl mb-4 transition-all duration-300 hover:shadow-2xl" style={{ 
                          background: 'linear-gradient(135deg, #303d83, #14b8a6, #84cc16)',
                          boxShadow: '0 8px 30px rgba(48,61,131,0.3)'
                        }}>
                          {step.number}
                        </div>
                        
                        {/* Step Content Card */}
                        <div className="w-56 bg-white rounded-xl p-4 border-2 border-gray-200 shadow-lg hover:shadow-xl hover:border-lime-400 transition-all duration-300 text-center h-68">
                          {/* Image */}
                          {step.image && (
                            <div className="relative w-30 h-30 mx-auto mb-3">
                              <Image
                                src={step.image}
                                alt={step.title}
                                fill
                                className="object-contain"
                              />
                            </div>
                          )}
                          
                          {/* Title */}
                          <h4 className="text-sm font-bold text-gray-900 mb-1.5">
                            {step.title}
                          </h4>
                          
                          {/* Description */}
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>

                      {/* Flow Arrow */}
                      {!isLast && (
                        <div className="flex items-center mx-1">
                          <div className="w-5 h-0.5" style={{ background: 'linear-gradient(to right, #84cc16, #14b8a6)' }}></div>
                          <div className="w-0 h-0 border-l-6 border-l-lime-400 border-t-3 border-t-transparent border-b-3 border-b-transparent"></div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Mobile: Vertical Flow */}
              <div className="lg:hidden space-y-6">
                {features.workflow.steps.map((step: any, index: number) => {
                  const { ref, isVisible } = useScrollAnimation({ triggerOnce: true, threshold: 0.1 })
                  const isLast = index === features.workflow.steps.length - 1
                  
                  return (
                    <div key={index} className="flex items-start gap-4">
                      {/* Flow Line & Arrow */}
                      {/* {!isLast && (
                        <div className="flex flex-col items-center pt-1">
                          <div className="w-0.5 h-10" style={{ background: 'linear-gradient(to bottom, #84cc16, #14b8a6)' }}></div>
                          <div className="w-0 h-0 border-t-5 border-t-lime-400 border-l-3 border-l-transparent border-r-3 border-r-transparent"></div>
                        </div>
                      )} */}
                      
                      {/* Step Content */}
                      <div
                        ref={ref}
                        className={`flex-1 transition-all duration-500 ${
                          isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                        }`}
                        style={{ transitionDelay: `${0.9 + index * 0.1}s` }}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          {/* Number Circle */}
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-lg flex-shrink-0" style={{ 
                            background: 'linear-gradient(135deg, #303d83, #14b8a6, #84cc16)',
                            boxShadow: '0 4px 15px rgba(48,61,131,0.3)'
                          }}>
                            {step.number}
                          </div>
                          
                          {/* Image */}
                          {step.image && (
                            <div className="relative w-10 h-10 flex-shrink-0">
                              <Image
                                src={step.image}
                                alt={step.title}
                                fill
                                className="object-contain"
                              />
                            </div>
                          )}
                        </div>
                        
                        {/* Title */}
                        <h4 className="text-sm font-bold text-gray-900 mb-1">
                          {step.title}
                        </h4>
                        
                        {/* Description */}
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Advantages Section with Staggered Layout */}
        {features.advantages && (
          <div>
            <div className={`text-center mb-16 transition-all duration-700 ${
              sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '1.5s' }}>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">
                <span className="bg-clip-text text-transparent" style={{ background: 'linear-gradient(to right, #303d83, #14b8a6, #84cc16)', WebkitBackgroundClip: 'text' as any }}>
                  {features.advantages.title}
                </span>
              </h3>
              <p className="text-xl text-gray-700 font-semibold">
                {features.advantages.subtitle}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.advantages.items.map((item: any, index: number) => {
                const { ref, isVisible } = useScrollAnimation({ triggerOnce: true, threshold: 0.1 })
                const isEven = index % 2 === 0
                const isThird = index % 3 === 0
                return (
                  <div
                    key={index}
                    ref={ref}
                    className={`relative group transition-all duration-500 ${
                      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                    }`}
                    style={{ transitionDelay: `${1.6 + index * 0.1}s` }}
                  >
                    {/* Card with Varied Backgrounds */}
                    <div 
                      className={`rounded-2xl p-8 border-2 transition-all duration-300 shadow-lg cursor-pointer h-full overflow-hidden relative hover:shadow-xl ${
                        isThird
                          ? 'bg-gradient-to-br from-white via-blue-50/50 to-white border-gray-200 hover:border-lime-400'
                          : isEven
                          ? 'bg-white border-gray-200 hover:border-lime-400'
                          : 'bg-gradient-to-br from-white via-lime-50/30 to-white border-gray-200 hover:border-lime-400'
                      }`}
                    >
                      {/* Animated Background Pattern */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300" style={{
                        backgroundImage: isEven 
                          ? 'radial-gradient(circle at 20% 30%, rgba(48,61,131,0.1), transparent 50%)'
                          : 'radial-gradient(circle at 80% 70%, rgba(132,204,22,0.1), transparent 50%)'
                      }}></div>

                      {/* Icon Container */}
                      <div className="relative mb-6">
                        <div className="text-6xl transition-all duration-300 relative z-10">
                          {item.icon}
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="relative z-10 text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-800 transition-colors duration-300">
                        {item.title}
                      </h4>

                      {/* Description */}
                      <p className="relative z-10 text-sm text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                        {item.description}
                      </p>

                      {/* Corner Decoration */}
                      <div className={`absolute ${isEven ? 'top-0 right-0' : 'bottom-0 left-0'} w-32 h-32 opacity-0 group-hover:opacity-10 transition-opacity duration-300`} style={{
                        background: `radial-gradient(circle at ${isEven ? 'top right' : 'bottom left'}, #84cc16, transparent)`
                      }}></div>

                      {/* Bottom Accent Line */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                        background: 'linear-gradient(to right, #303d83, #14b8a6, #84cc16)'
                      }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
