import { Metadata } from 'next';
import Link from 'next/link';
import {
  Code2,
  Database,
  BookOpen,
  ArrowRight,
  FileCheck2,
  CheckCircle2,
  GraduationCap,
  Play,
  HelpCircle,
  Globe,
  Table2,
  KeyRound,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Nebcode — Learn C Programming, MySQL & Practice GCE MCQ Past Papers',
  description:
    'Nebcode is the easiest platform for secondary school students in Cameroon to learn C programming, practice MySQL databases, and solve 50-question timed GCE Computer Science MCQ past papers on any phone or computer.',
  alternates: {
    canonical: 'https://nebcode.ngwafrank.com',
  },
  openGraph: {
    title: 'Nebcode — C Programming, MySQL & GCE MCQ Platform for Students',
    description:
      'Write and run real C programs, query a live MySQL database, and practice 50-question GCE MCQ past papers with step-by-step explanations.',
    url: 'https://nebcode.ngwafrank.com',
    type: 'website',
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Can I write and run C programs and SQL queries on my mobile phone?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Nebcode provides a cloud C compiler and live MySQL database terminal that work directly in your mobile browser without installing any software.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do the 50-question MCQ Past Papers work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Each MCQ paper contains 50 exam questions with a countdown timer and fullscreen exam mode. When you submit, you immediately see your total score and a step-by-step explanation for every question.',
      },
    },
    {
      '@type': 'Question',
      name: 'Who is Nebcode designed for?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Nebcode is built specifically for secondary school and high school Computer Science and ICT students preparing for GCE O-Level and A-Level practical and theory examinations.',
      },
    },
  ],
};

export default function Home() {
  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative px-4 pt-14 pb-16 md:pt-20 md:pb-24 overflow-hidden border-b border-dark-700/60">
        <div className="absolute inset-0 bg-gradient-to-b from-neb-950/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-neb-600/30 bg-neb-600/10 text-neb-500 text-xs font-bold mb-6">
            <GraduationCap className="h-4 w-4" /> Built for Secondary School Computer Science Students
          </div>

          <h1 className="font-extrabold text-3xl sm:text-5xl md:text-6xl text-white leading-tight tracking-tight mb-5">
            Master <span className="text-gradient">C Programming, MySQL</span> &amp; GCE MCQ Papers
          </h1>

          <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Everything you need to pass your Computer Science exams in one clean platform. Read simple lessons, write and run real code on your phone or PC, and practice timed 50-question past papers.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-lg mx-auto sm:max-w-none">
            <Link
              href="/courses"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-neb-600 hover:bg-neb-500 text-white font-bold text-sm transition-all shadow-lg shadow-neb-950/30 active:scale-95"
            >
              <BookOpen className="h-4 w-4" /> Explore Courses <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/mcq"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-white font-bold text-sm transition-all border border-dark-600 active:scale-95"
            >
              <FileCheck2 className="h-4 w-4 text-neb-500" /> Practice MCQ Papers
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-dark-900 hover:bg-dark-800 text-gray-200 font-semibold text-sm transition-all border border-dark-700 active:scale-95"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* 4 Main Student Tools */}
      <section aria-label="Main learning tools" className="px-4 py-14 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            What Would You Like to Study Today?
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            Tap any section below to start learning immediately. No complicated setup required.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Card 1: Courses */}
          <Link
            href="/courses"
            className="card card-hover p-6 flex flex-col justify-between gap-4 group"
          >
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-neb-600/15 border border-neb-600/30 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-neb-500" />
              </div>
              <h3 className="text-lg font-extrabold text-white group-hover:text-neb-500 transition">
                1. Step-by-Step Courses
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Clear, easy-to-follow lessons in C Programming and MySQL Databases. Each topic includes simple explanations, examples, and practice exercises.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-neb-500 pt-2">
              <span>Open Courses</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: MCQ Past Papers */}
          <Link
            href="/mcq"
            className="card card-hover p-6 flex flex-col justify-between gap-4 group"
          >
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <FileCheck2 className="h-5 w-5 text-emerald-500" />
              </div>
              <h3 className="text-lg font-extrabold text-white group-hover:text-emerald-500 transition">
                2. 50-Question MCQ Past Papers
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Practice real exam papers by year under a countdown timer. Submit to see your score, the option you selected, the correct answer, and a clear explanation.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 pt-2">
              <span>Take a Practice Test</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 3: C Code Editor */}
          <Link
            href="/editor"
            className="card card-hover p-6 flex flex-col justify-between gap-4 group"
          >
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                <Code2 className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="text-lg font-extrabold text-white group-hover:text-blue-500 transition">
                3. Online C Code Editor
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Write, compile, and run C programs on your phone or computer. Switch between Desktop Mode (VS Code horizontal scroll) and Mobile Mode anytime.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-500 pt-2">
              <span>Open C Editor</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 4: MySQL Lab */}
          <Link
            href="/mysql-lab"
            className="card card-hover p-6 flex flex-col justify-between gap-4 group"
          >
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                <Database className="h-5 w-5 text-amber-500" />
              </div>
              <h3 className="text-lg font-extrabold text-white group-hover:text-amber-500 transition">
                4. Live MySQL Database Lab
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Practice SQL commands like CREATE TABLE, INSERT, and SELECT inside a real MySQL database terminal with one-tap command copying.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 pt-2">
              <span>Open MySQL Lab</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 5: HTML, CSS & JS Web Lab */}
          <Link
            href="/web-lab"
            className="card card-hover p-6 flex flex-col justify-between gap-4 group"
          >
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
                <Globe className="h-5 w-5 text-sky-400" />
              </div>
              <h3 className="text-lg font-extrabold text-white group-hover:text-sky-400 transition">
                5. HTML, CSS &amp; JS Web Lab
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Write HTML5, CSS3, and JavaScript in one editor with an instant live browser preview and interactive JS console on mobile or desktop.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 pt-2">
              <span>Open Web Lab</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 6: Microsoft Excel Spreadsheet Lab */}
          <Link
            href="/excel-lab"
            className="card card-hover p-6 flex flex-col justify-between gap-4 group"
          >
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center">
                <Table2 className="h-5 w-5 text-teal-400" />
              </div>
              <h3 className="text-lg font-extrabold text-white group-hover:text-teal-400 transition">
                6. Microsoft Excel Practice Lab
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Practice 80+ Excel functions (SUM, AVERAGE, IF, RANK, VLOOKUP), $A$1 absolute references, AutoFill, conditional formatting, and charts on your phone.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-400 pt-2">
              <span>Open Excel Lab</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 7: Microsoft Access Database Lab */}
          <Link
            href="/access-lab"
            className="card card-hover p-6 flex flex-col justify-between gap-4 group"
          >
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
                <KeyRound className="h-5 w-5 text-rose-400" />
              </div>
              <h3 className="text-lg font-extrabold text-white group-hover:text-rose-400 transition">
                7. Microsoft Access Lab
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Master GCE database practicals: design tables, enforce validation rules, define 1-to-many relationships with referential integrity, and run SQL queries.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 pt-2">
              <span>Open Access Lab</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* How It Works — 3 Simple Steps */}
      <section aria-label="How Nebcode works" className="px-4 py-14 bg-dark-900/60 border-y border-dark-700/60">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl font-extrabold text-white">How to Study on Nebcode</h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1.5">
              Three simple steps designed for secondary school students.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: 'Step 1',
                icon: BookOpen,
                title: 'Read the Lesson',
                desc: 'Open a C Programming or MySQL module and read the short, clear notes and examples.',
              },
              {
                step: 'Step 2',
                icon: Play,
                title: 'Run Code in the Lab',
                desc: 'Test your code in the built-in C compiler or MySQL terminal right from your phone or computer.',
              },
              {
                step: 'Step 3',
                icon: CheckCircle2,
                title: 'Solve Past MCQ Papers',
                desc: 'Take 50-question timed MCQ exams and review the explanation for every single question.',
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="card p-6 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-neb-600/15 text-neb-500 border border-neb-600/30">
                    {step}
                  </span>
                  <Icon className="h-5 w-5 text-neb-500" />
                </div>
                <h3 className="text-base font-bold text-white mt-1">{title}</h3>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section aria-label="Frequently Asked Questions" className="px-4 py-14 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-white flex items-center justify-center gap-2">
            <HelpCircle className="h-5 w-5 text-neb-500" /> Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-bold text-white">
              Do I need a laptop to practice C programming and MySQL on Nebcode?
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mt-1.5 leading-relaxed">
              No. You can use any smartphone, tablet, or computer. Nebcode compiles your C code and runs your MySQL queries on our cloud servers and shows the output immediately on your screen.
            </p>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-bold text-white">
              How does Desktop Mode work in the Code Editor on a phone?
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mt-1.5 leading-relaxed">
              In Desktop Mode, lines of code do not wrap to the next line — you can swipe left and right to view long lines just like in VS Code. You can also copy and paste code or switch to Mobile Mode anytime.
            </p>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-bold text-white">
              What happens after I submit an MCQ Past Paper?
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mt-1.5 leading-relaxed">
              You immediately see your total score out of 50, followed by a complete breakdown of all 50 questions showing the option you selected, the correct answer, and a detailed explanation of why that answer is correct.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
