'use client'

import Link from 'next/link'
import Image from 'next/image'
import landingData from '@/data/landing-page.json'
import { useScrollAnimation } from '@/lib/hooks/useScrollAnimation'

export default function Footer() {
  const { footer } = landingData
  const { ref, isVisible } = useScrollAnimation({ triggerOnce: true })
  const email = footer.links.contact?.email || footer.company?.email
  const whatsappNumber = footer.links.contact?.whatsapp || ''
  const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}` : undefined

  return (
    <footer className="bg-gray-900 text-gray-300 py-16 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
      <div ref={ref} className="container mx-auto max-w-7xl">
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Company Info */}
          <div className={`transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="flex items-center">
              {footer.company.logo && (
                <div className="relative w-24 h-12 transition-transform duration-300">
                  <Image
                    src={footer.company.logo}
                    alt={footer.company.name || 'DIUK Logo'}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
            </div>
            {footer.company.name && (
              <p className="text-sm text-gray-400 mb-2 mt-3">{footer.company.name}</p>
            )}
            {footer.company.address && (
              <p className="text-sm text-gray-400 mb-4">{footer.company.address}</p>
            )}

            {footer.company.socialLinks?.length > 0 && (
              <div className="flex">
                {footer.company.socialLinks.map((link, index) => (
                  <Link
                    key={index}
                    href={link.href || '#'}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-lime-400 transition-all duration-300"
                    target="_blank"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="w-7 h-7 fill-current"
                    >
                      <path d="M7.75 2h8.5C19.43 2 22 4.57 22 7.75v8.5C22 19.43 19.43 22 16.25 22h-8.5C4.57 22 2 19.43 2 16.25v-8.5C2 4.57 4.57 2 7.75 2zm0 1.5A4.25 4.25 0 003.5 7.75v8.5A4.25 4.25 0 007.75 20.5h8.5a4.25 4.25 0 004.25-4.25v-8.5A4.25 4.25 0 0016.25 3.5h-8.5z" />
                      <path d="M12 7a5 5 0 100 10 5 5 0 000-10zm0 1.5a3.5 3.5 0 110 7 3.5 3.5 0 010-7z" />
                      <circle cx="17.5" cy="6.5" r="1.2" />
                    </svg>
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Product Links */}
          <div className={`transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '0.2s' }}
          >
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              {footer.links.product?.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-lime-400 transition-all duration-300 hover:translate-x-2 inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className={`transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '0.1s' }}
          >
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {email && (
                <li>
                  <Link
                    href={`mailto:${email}`}
                    className="hover:text-lime-400 transition-all duration-300 hover:translate-x-2 inline-block"
                  >
                    {email}
                  </Link>
                </li>
              )}
              {whatsappUrl && (
                <li>
                  <Link
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-lime-400 transition-all duration-300 hover:translate-x-2 inline-block"
                  >
                    WhatsApp: +{whatsappNumber}
                  </Link>
                </li>
              )}
            </ul>
          </div>


        </div>

        {/* Copyright */}
        <div className={`border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        style={{ transitionDelay: '0.4s' }}
        >
          <p className="text-sm text-gray-400 mb-4 sm:mb-0">{footer.copyright}</p>
          <div className="flex gap-4">
            {footer.legal?.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="text-sm text-gray-400 hover:text-lime-400 transition-all duration-300 hover:scale-110"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
