import Link from 'next/link';
import { Code2, Terminal, Smartphone, Zap, BookOpen, ArrowRight, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative px-4 pt-20 pb-24 overflow-hidden text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-neb-950/30 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-neb-600/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neb-800/50 bg-neb-950/50 text-neb-400 text-xs font-medium mb-6">
            <Zap className="h-3 w-3" /> Real code execution on any device
          </div>
          <h1 className="font-bold text-4xl sm:text-5xl text-white leading-tight mb-5">
            Learn <span className="text-gradient">C & MySQL</span><br />from your phone
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            Nebcode gives students a full programming lab — write, compile, and run real code — no laptop needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/courses" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-neb-600 hover:bg-neb-500 text-white font-semibold transition-all shadow-lg shadow-neb-950/50 active:scale-95">
              Browse Courses <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/auth/register" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-dark-700 hover:bg-dark-600 text-white font-semibold transition-all border border-dark-600 active:scale-95">
              Get started free
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: Code2, title: 'C File Explorer', desc: 'Create files and folders, switch between them, and run multi-file C projects.' },
            { icon: Terminal, title: 'Live MySQL Terminal', desc: 'A real MySQL container starts for you. Type CREATE DATABASE school; and go.' },
            { icon: Smartphone, title: 'Mobile First', desc: 'Every screen designed for phones. No laptop, no problem.' },
            { icon: BookOpen, title: 'Structured Courses', desc: 'Lessons with rich content, videos, exercises, and step-by-step guidance.' },
            { icon: Shield, title: 'Sandboxed & Safe', desc: 'Every execution runs in an isolated Docker container. Completely secure.' },
            { icon: Zap, title: 'Instant Feedback', desc: 'Compile and see output in seconds. Learn by doing, not watching.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card card-hover p-5 flex flex-col gap-3">
              <div className="w-9 h-9 rounded-lg bg-neb-900/60 border border-neb-800/40 flex items-center justify-center">
                <Icon className="h-4.5 w-4.5 text-neb-400 h-[18px] w-[18px]" />
              </div>
              <h3 className="font-semibold text-white text-sm">{title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
