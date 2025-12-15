import Header from '@/components/landing/Header'
import Hero from '@/components/landing/Hero'
import TrustedBy from '@/components/landing/TrustedBy'
import BusinessChallenges from '@/components/landing/BusinessChallenges'
import Services from '@/components/landing/Services'
import Comparison from '@/components/landing/Comparison'
import Features from '@/components/landing/Features'
import Pricing from '@/components/landing/Pricing'
import Testimonials from '@/components/landing/Testimonials'
import FinalCTA from '@/components/landing/FinalCTA'
import Footer from '@/components/landing/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <TrustedBy />
      <BusinessChallenges />
      <Services />
      <Comparison />
      <Features />
      <Pricing />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </main>
  )
}
