import { Metadata } from 'next';
import Link from 'next/link';
import { Phone, Mail, MessageSquare, MapPin, Clock, ArrowRight, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us — Nebcode',
  description: 'Get in touch with the Nebcode team. Contact us via phone +237677482442 or email nebcode26@gmail.com for student support, billing, or course inquiries.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact Nebcode — Student Support & Inquiries',
    description: 'Contact Nebcode support via Phone, WhatsApp (+237 677 482 442), or Email (nebcode26@gmail.com).',
    url: 'https://nebcode.ngwafrank.com/contact',
    type: 'website',
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen py-16 px-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neb-800/50 bg-neb-950/50 text-neb-400 text-xs font-medium mb-4">
          <MessageSquare className="h-3.5 w-3.5" /> Direct Support
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Get in Touch with <span className="text-gradient">Nebcode</span>
        </h1>
        <p className="text-gray-400 text-base leading-relaxed">
          Have questions about your subscription, course access, or MySQL labs? Reach out to us directly through phone, WhatsApp, or email.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Phone / WhatsApp Card */}
        <div className="card p-6 flex flex-col justify-between hover:border-neb-500/50 transition-all group">
          <div>
            <div className="w-12 h-12 rounded-xl bg-neb-900/80 border border-neb-700/50 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Phone className="h-6 w-6 text-neb-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Phone &amp; WhatsApp</h2>
            <p className="text-sm text-gray-400 mb-4">
              Call us directly or send a message on WhatsApp for instant assistance.
            </p>
            <p className="text-lg font-mono font-bold text-neb-300 mb-6">
              +237 677 482 442
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="tel:+237677482442"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neb-600 hover:bg-neb-500 text-white font-medium text-sm transition-all shadow-md active:scale-95"
            >
              <Phone className="h-4 w-4" /> Call Now
            </a>
            <a
              href="https://wa.me/237677482442"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-md active:scale-95"
            >
              <MessageSquare className="h-4 w-4" /> WhatsApp Us
            </a>
          </div>
        </div>

        {/* Email Card */}
        <div className="card p-6 flex flex-col justify-between hover:border-neb-500/50 transition-all group">
          <div>
            <div className="w-12 h-12 rounded-xl bg-neb-900/80 border border-neb-700/50 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Mail className="h-6 w-6 text-neb-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Email Support</h2>
            <p className="text-sm text-gray-400 mb-4">
              Send us an email for general inquiries, feedback, or technical support.
            </p>
            <p className="text-lg font-mono font-bold text-neb-300 mb-6">
              nebcode26@gmail.com
            </p>
          </div>
          <div>
            <a
              href="mailto:nebcode26@gmail.com"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-dark-700 hover:bg-dark-600 text-white font-medium text-sm transition-all border border-dark-600 active:scale-95"
            >
              <Mail className="h-4 w-4" /> Send Email <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="card p-6 border border-dark-700/60 bg-dark-900/40 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-neb-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Response Time</h3>
            <p className="text-xs text-gray-400">Within 1–2 hours during business hours</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-neb-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Location</h3>
            <p className="text-xs text-gray-400">Cameroon</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-neb-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Student Guarantee</h3>
            <p className="text-xs text-gray-400">24/7 account &amp; lab assistance</p>
          </div>
        </div>
      </div>
    </div>
  );
}
