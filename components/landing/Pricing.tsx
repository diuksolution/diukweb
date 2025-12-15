'use client'

import Link from 'next/link'
import landingData from '@/data/landing-page.json'
import { useScrollAnimation } from '@/lib/hooks/useScrollAnimation'

export default function Pricing() {
  const { pricing, header } = landingData
  const { ref: sectionRef, isVisible: sectionVisible } = useScrollAnimation({ triggerOnce: true })

  if (!pricing) return null

  const whatsappNumber = header?.whatsapp?.number || '6281234567890'
  const whatsappUrl = `https://wa.me/${whatsappNumber}`

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, rgba(48,61,131,0.05), white, rgba(132,204,22,0.05))' }}>
      {/* Background accents */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(48,61,131,0.03), white, rgba(132,204,22,0.03))' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 15% 30%, rgba(48,61,131,0.08), transparent 55%)' }}></div>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 85% 70%, rgba(132,204,22,0.08), transparent 55%)' }}></div>
      </div>

      <div ref={sectionRef} className="container mx-auto max-w-7xl relative z-10">
        <div className={`text-center mb-14 transition-all duration-700 ${sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: '#303d83' }}>
            {pricing.title}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2 mb-4">
            <span className="bg-clip-text text-transparent" style={{ background: 'linear-gradient(to right, #303d83, #14b8a6, #84cc16)', WebkitBackgroundClip: 'text' as any }}>
              {pricing.subtitle}
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">{pricing.description}</p>
        </div>

        {/* Main Packages */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {pricing.packages.map((plan: any, index: number) => {
            const { ref, isVisible } = useScrollAnimation({ triggerOnce: true, threshold: 0.1 })
            const accent = plan.accent || '#303d83'
            return (
              <div
                key={plan.name}
                ref={ref}
                className={`relative rounded-2xl bg-white border border-gray-200 shadow-lg transition-all duration-500 hover:shadow-xl overflow-hidden ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${0.1 * index}s` }}
              >
                <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(135deg, rgba(48,61,131,0.08), rgba(132,204,22,0.08))' }}></div>
                <div className="relative p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: accent }}>
                      {plan.category}
                    </div>
                    {plan.tag && (
                      <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(132,204,22,0.12)', color: '#303d83' }}>
                        {plan.tag}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-2xl font-extrabold" style={{ color: '#303d83' }}>
                      {plan.price}
                    </p>
                    {plan.period && <p className="text-sm text-gray-500">{plan.period}</p>}
                  </div>

                  <div className="space-y-2">
                    {plan.features.map((feat: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="mt-1 inline-block w-2 h-2 rounded-full" style={{ background: 'linear-gradient(135deg, #303d83, #84cc16)' }}></span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  {plan.setupFee && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">{plan.setupFee}</p>
                    </div>
                  )}

                  {plan.highlight && (
                    <div className="pt-3">
                      <p className="text-sm font-semibold px-4 py-2 rounded-full inline-block" style={{ background: 'linear-gradient(135deg, #303d83, #14b8a6, #84cc16)', color: 'white' }}>
                        {plan.highlight}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Combo Packages */}
        {pricing.combos && (
          <div className="rounded-3xl bg-white border border-gray-200 shadow-xl p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.15em]" style={{ color: '#303d83' }}>
                  {pricing.combos.title}
                </p>
                <h3 className="text-2xl font-bold text-gray-900">{pricing.combos.subtitle}</h3>
              </div>
              <Link
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-white shadow-md transition-all duration-300"
                style={{ background: '#25D366' }}
              >
                Hubungi Kami
              </Link>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {pricing.combos.items.map((combo: any, index: number) => {
                const { ref, isVisible } = useScrollAnimation({ triggerOnce: true, threshold: 0.1 })
                return (
                  <div
                    key={combo.name}
                    ref={ref}
                    className={`relative rounded-2xl border border-gray-200 bg-white p-6 shadow-lg transition-all duration-500 hover:shadow-xl ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    style={{ transitionDelay: `${0.15 + index * 0.1}s` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-bold text-gray-900">{combo.name}</h4>
                      {combo.savings && (
                        <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(132,204,22,0.15)', color: '#303d83' }}>
                          {combo.savings}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-700 space-y-1 mb-3">
                      <p>{combo.agentPrice}</p>
                      <p>{combo.webPrice}</p>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">{combo.setupFee}</p>
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

