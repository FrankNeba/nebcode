import { Metadata } from 'next';
import PricingPageClient from './pricing-client';

export const metadata: Metadata = {
  title: 'Pricing Plans — Unlock Full C & MySQL Learning Platform',
  description: 'Choose a monthly or yearly Nebcode subscription to unlock unlimited access to the online C compiler, interactive MySQL database lab, and earn verified programming certificates. Easy payments via Orange Money and MTN MoMo.',
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: 'Nebcode Premium Subscription — C & MySQL Learning',
    description: 'Get full access to the online C compiler, live database lab, and certified courses for Cameroon students.',
    url: 'https://nebcode.ngwafrank.com/pricing',
    type: 'website',
  },
};

export default function PricingPage() {
  return <PricingPageClient />;
}
