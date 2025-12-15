'use client'

import landingData from '@/data/landing-page.json'
import { useScrollAnimation } from '@/lib/hooks/useScrollAnimation'

export default function Testimonials() {
  const { testimonials } = landingData
  const { ref: sectionRef, isVisible: sectionVisible } = useScrollAnimation({ triggerOnce: true })

  return (
    <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden border-y border-gray-200">
      {/* Background Effects */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(48,61,131,0.08), white, rgba(132,204,22,0.08))' }}></div>
      
      <div ref={sectionRef} className="container mx-auto max-w-7xl relative z-10">
        <div className={`text-center mb-16 transition-all duration-700 ${
          sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="bg-clip-text text-transparent" style={{ background: 'linear-gradient(to right, #303d83, #14b8a6, #84cc16)', WebkitBackgroundClip: 'text' }}>
              {testimonials.title}
            </span>
          </h2>
          <p className="text-xl text-gray-600">{testimonials.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.items.map((testimonial, index) => {
            const { ref, isVisible } = useScrollAnimation({ triggerOnce: true, threshold: 0.1 })
            return (
              <div
                key={index}
                ref={ref}
                className={`bg-white rounded-xl p-6 border border-gray-200 hover:border-lime-400 transition-all duration-500 group shadow-md hover:shadow-lg cursor-pointer ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 0.1}s` }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div className="text-4xl bg-clip-text text-transparent mb-4 transition-transform duration-300" style={{ background: 'linear-gradient(to right, #303d83, #84cc16)', WebkitBackgroundClip: 'text' }}>"</div>
                <p className="text-gray-700 mb-4 italic group-hover:text-gray-900 transition-colors">{testimonial.text}</p>
                {testimonial.author && (
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">{testimonial.author}</span>
                    {testimonial.role && (
                      <span className="text-gray-500">, {testimonial.role}</span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
