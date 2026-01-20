'use client'

import landingData from '@/data/landing-page.json'
import { useScrollAnimation } from '@/lib/hooks/useScrollAnimation'
import Image from 'next/image'

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

        {/* Brands Marquee (logos only) */}
        <div
          ref={ref}
          className={`relative overflow-hidden transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          {/* Edge fade */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-24 bg-linear-to-r from-white to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-24 bg-linear-to-l from-white to-transparent z-10" />

          <div className="marquee">
            <div className="track flex w-max items-center py-2">
              {/* Group A */}
              <div className="group flex items-center gap-10 sm:gap-14">
                {trustedBy.brands.map((brand) => (
                  <div
                    key={`a-${brand.name}`}
                    className="shrink-0 flex items-center justify-center grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all duration-300"
                  >
                    <div className="h-16 w-36 sm:h-18 sm:w-48">
                      <Image
                        src={brand.logo}
                        alt={brand.name}
                        width={160}
                        height={80}
                        className="h-full w-full object-contain"
                        priority={false}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Group B (duplicate for seamless loop) */}
              <div className="group flex items-center gap-10 sm:gap-14" aria-hidden="true">
                {trustedBy.brands.map((brand) => (
                  <div
                    key={`b-${brand.name}`}
                    className="shrink-0 flex items-center justify-center grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all duration-300"
                  >
                    <div className="h-16 w-36 sm:h-18 sm:w-48">
                      <Image
                        src={brand.logo}
                        alt=""
                        width={160}
                        height={80}
                        className="h-full w-full object-contain"
                        priority={false}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .marquee {
          --duration: 28s;
        }

        .marquee:hover .track {
          animation-play-state: paused;
        }

        .track {
          animation: marquee var(--duration) linear infinite;
          will-change: transform;
          transform: translate3d(0, 0, 0);
        }

        @keyframes marquee {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .track {
            animation: none;
            transform: translateX(0);
          }
        }
      `}</style>
    </section>
  )
}
