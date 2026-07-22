import { CinematicHero } from '@/components/landing/CinematicHero';
import { AppShowcaseSection } from '@/components/landing/AppShowcaseSection';
import { TechStackSection } from '@/components/TechStackSection';
import { LiveAppSection } from '@/components/LiveAppSection';
import { CreatorSection } from '@/components/CreatorSection';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import { SocialAndProjectsSection } from '@/components/SocialAndProjectsSection';
import { TermsFooterLink } from '@/components/TermsFooterLink';

export default function LandingPage() {
  return (
    <div className="bg-black text-white">
      <CinematicHero />

      <section id="recursos" className="scroll-mt-24">
        <AppShowcaseSection />
        <TechStackSection />
      </section>

      <section id="roadmap" className="scroll-mt-24">
        <LiveAppSection />
        <CreatorSection />
      </section>

      <section id="depoimentos" className="scroll-mt-24">
        <TestimonialsSection />
        <SocialAndProjectsSection />
      </section>

      <footer className="border-t border-white/10 py-8 px-4 text-center text-xs text-white/60">
        <p>Desenvolvido por: Kaique Aurelio & Decode Analytics</p>
        <div className="mt-3 flex justify-center">
          <TermsFooterLink variant="inline" />
        </div>
      </footer>
    </div>
  );
}
