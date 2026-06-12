import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { LandingHero } from '@/components/landing/LandingHero';
import {
  LandingAudiencesSection,
  LandingCtaSection,
  LandingFeaturesSection,
  LandingHowItWorksSection,
} from '@/components/landing/LandingSections';
export function WelcomePage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const target = document.querySelector(hash);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash]);

  return (
    <PublicLayout>
      <LandingHero />
      <LandingFeaturesSection />
      <LandingHowItWorksSection />
      <LandingAudiencesSection />
      <LandingCtaSection />
    </PublicLayout>
  );
}
