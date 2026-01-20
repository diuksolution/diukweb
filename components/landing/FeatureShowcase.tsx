'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import landingData from '@/data/landing-page.json'
import { useScrollAnimation } from '@/lib/hooks/useScrollAnimation'

type ShowcaseItem = {
  key: string
  title: string
  description: string
  bullets?: string[]
  image: string
}

export default function FeatureShowcase() {
  const { featureShowcase } = landingData as any
  const items: ShowcaseItem[] = featureShowcase?.items || []

  const { ref: sectionRef, isVisible: sectionVisible } = useScrollAnimation({ triggerOnce: true })
  const [activeKey, setActiveKey] = useState<string>(items[0]?.key ?? '')

  const active = useMemo(
    () => items.find((i) => i.key === activeKey) ?? items[0],
    [activeKey, items]
  )

  if (!featureShowcase || items.length === 0 || !active) return null

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-white">
      {/* Background accents (match other sections vibe) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(48,61,131,0.03), white, rgba(132,204,22,0.03))',
        }}
      >
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(circle at 20% 30%, rgba(48,61,131,0.08), transparent 55%)' }}
        ></div>
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(circle at 80% 70%, rgba(132,204,22,0.08), transparent 55%)' }}
        ></div>
      </div>

      <div ref={sectionRef} className="container mx-auto max-w-7xl relative z-10">
        <div
          className={`text-center mb-12 transition-all duration-700 ${
            sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span
              className="bg-clip-text text-transparent"
              style={{
                background: 'linear-gradient(to right, #303d83, #14b8a6, #84cc16)',
                WebkitBackgroundClip: 'text' as any,
              }}
            >
              {featureShowcase.title}
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">{featureShowcase.subtitle}</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left: tabs/list */}
          <div
            className={`lg:col-span-5 transition-all duration-700 ${
              sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-gray-200">
                <p className="text-sm font-semibold text-gray-900">Fitur</p>
                <p className="text-xs text-gray-600">Klik untuk lihat preview</p>
              </div>

              <div className="divide-y divide-gray-200">
                {items.map((item) => {
                  const isActive = item.key === activeKey
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActiveKey(item.key)}
                      className={`w-full text-left p-4 sm:p-5 transition-all duration-200 ${
                        isActive ? 'bg-lime-50' : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-1 inline-block w-2.5 h-2.5 rounded-full ${
                            isActive ? 'bg-lime-500' : 'bg-gray-300'
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900">{item.title}</p>
                          <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right: screenshot + details */}
          <div
            className={`lg:col-span-7 transition-all duration-700 ${
              sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '0.08s' }}
          >
            <div className="rounded-3xl border border-gray-200 bg-white shadow-xl overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{active.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{active.description}</p>
                  </div>
                  <span
                    className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: 'rgba(132,204,22,0.15)', color: '#303d83' }}
                  >
                    Preview
                  </span>
                </div>

                <div className="relative rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden">
                  <div className="relative w-full aspect-[16/9]">
                    <Image src={active.image} alt={`${active.title} screenshot`} fill className="object-contain p-6" />
                  </div>
                </div>

                {active.bullets && active.bullets.length > 0 && (
                  <div className="mt-6 grid sm:grid-cols-2 gap-3">
                    {active.bullets.map((b, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span
                          className="mt-1 inline-block w-2 h-2 rounded-full"
                          style={{ background: 'linear-gradient(135deg, #303d83, #84cc16)' }}
                        ></span>
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


