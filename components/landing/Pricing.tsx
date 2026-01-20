'use client'

import landingData from '@/data/landing-page.json'
import { useScrollAnimation } from '@/lib/hooks/useScrollAnimation'

function splitPrice(price: string): { amount: string; per?: string } {
  const parts = price.split(' / ')
  if (parts.length >= 2) return { amount: parts[0], per: parts.slice(1).join(' / ') }
  return { amount: price }
}

function extractSetupFeeAmount(setupFee: string): string {
  const match = setupFee.match(/IDR\s.*$/i)
  return match ? match[0] : setupFee
}

function CheckItem({ children }: { children: string }) {
  return (
    <div className="flex items-start sm:gap-3 gap-1 sm:text-sm text-[10px] text-gray-800">
      <span className="mt-0.5 inline-flex items-center justify-center w-3 h-3 sm:w-6 sm:h-6 rounded-full bg-blue-600 text-white shrink-0">
        <svg viewBox="0 0 20 20" className="w-2 h-2 sm:w-4 sm:h-4" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M16.704 5.29a1 1 0 010 1.414l-7.11 7.11a1 1 0 01-1.414 0L3.296 8.93A1 1 0 114.71 7.516l3.163 3.163 6.403-6.403a1 1 0 011.428.014z"
            clipRule="evenodd"
          />
        </svg>
      </span>
      <span className="leading-relaxed">{children}</span>
    </div>
  )
}

function PricingCard({ plan, delay }: { plan: any; delay: string }) {
  const { ref, isVisible } = useScrollAnimation({ triggerOnce: true, threshold: 0.1 })
  const { amount, per } = splitPrice(plan.price || '')
  const setupFeeAmount = plan.setupFee ? extractSetupFeeAmount(plan.setupFee) : null

  return (
    <div
      ref={ref}
      className={`relative transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: delay }}
    >
      <div
        className="rounded-3xl p-[2px] shadow-lg hover:shadow-xl transition-shadow duration-300 h-[340px] sm:h-[500px]"
        style={{ background: 'linear-gradient(135deg, #303d83, #14b8a6, #84cc16)' }}
      >
        <div className="relative rounded-3xl bg-white px-6 pt-7 pb-20 overflow-hidden h-full flex flex-col">
          {/* subtle inner glow */}
          <div
            className="absolute inset-0 opacity-30"
            style={{ background: 'radial-gradient(circle at 30% 20%, rgba(48,61,131,0.10), transparent 55%)' }}
          />
          <div className="flex flex-col h-full justify-center items-center">
            <div className="text-center">
              <h3 className="sm:text-2xl text-[16px] font-extrabold text-gray-900">{plan.name}</h3>
              <div className="sm:mt-2 mt-1">
                <span className="sm:text-2xl text-[16px] font-extrabold" style={{ color: '#84cc16' }}>
                  {amount}
                </span>
                {per && <span className="sm:text-lg text-[12px] font-semibold text-gray-500">/{per}</span>}
              </div>
              {plan.period && <p className="mt-1 sm:text-sm text-[10px] text-gray-600">{plan.period}</p>}
            </div>

            <div className="sm:mt-6 mt-3 flex-1 overflow-hidden">
              <div className="h-full overflow-auto pr-1 sm:space-y-3 space-y-1">
                {(plan.features || []).map((feat: string, idx: number) => (
                  <CheckItem key={idx}>{feat}</CheckItem>
                ))}
              </div>
            </div>

            {/* Setup fee badge */}
            {setupFeeAmount && (
              <div className="absolute bottom-5 justify-center w-[85%]">
                <div
                  className="rounded-2xl bg-white border-2 px-4 py-3 text-center shadow-lg"
                  style={{ borderColor: '#84cc16' }}
                >
                  <p className="sm:text-sm text-[10px] font-semibold text-gray-700">Setup fee</p>
                  <p className="sm:text-xl text-[12px] font-extrabold text-gray-900">{setupFeeAmount}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Pricing() {
  const { pricing } = landingData
  const { ref: sectionRef, isVisible: sectionVisible } = useScrollAnimation({ triggerOnce: true })

  if (!pricing) return null

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

        {/* AI Packages */}
        <div className="grid md:grid-cols-2 gap-8 mb-14">
          {pricing.packages.map((plan: any, index: number) => {
            return <PricingCard key={plan.name} plan={plan} delay={`${0.1 * index}s`} />
          })}
        </div>

        {/* Website Packages */}
        <div className="grid md:grid-cols-3 gap-8">
          {pricing.website.map((plan: any, index: number) => {
            return <PricingCard key={plan.name} plan={plan} delay={`${0.1 * index}s`} />
          })}
        </div>

      </div>
    </section>
  )
}

