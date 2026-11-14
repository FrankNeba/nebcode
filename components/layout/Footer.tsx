'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, FileCheck2, Code2, Database, Phone, Mail, CreditCard } from 'lucide-react';

export function Footer() {
  const pathname = usePathname();

  // Hide footer in full-height workspace labs or active MCQ exam pages
  if (
    pathname?.startsWith('/editor') ||
    pathname?.startsWith('/mysql-lab') ||
    (pathname?.startsWith('/mcq/') && pathname !== '/mcq') ||
    pathname?.includes('/lesson/') ||
    pathname?.includes('/lessons/')
  ) {
    return null;
  }

  return (
    <footer className="border-t border-dark-700 bg-dark-900 mt-auto pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white overflow-hidden flex items-center justify-center border border-dark-700">
                <img src="/logo.jpeg" alt="Nebcode Logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-extrabold text-base tracking-tight">
                <span className="text-neb-600">Neb</span>
                <span className="text-white">code</span>
              </span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed">
              The interactive learning platform for secondary school Computer Science &amp; ICT students. Learn C programming, MySQL databases, and practice GCE MCQ past papers on any device.
            </p>
          </div>

          {/* Learning */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Learning</h3>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <Link href="/courses" className="hover:text-neb-500 transition flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-neb-500" /> All Courses
                </Link>
              </li>
              <li>
                <Link href="/mcq" className="hover:text-neb-500 transition flex items-center gap-1.5">
                  <FileCheck2 className="h-3.5 w-3.5 text-neb-500" /> GCE MCQ Past Papers
                </Link>
              </li>
              <li>
                <Link href="/editor" className="hover:text-neb-500 transition flex items-center gap-1.5">
                  <Code2 className="h-3.5 w-3.5 text-neb-500" /> Online C Compiler
                </Link>
              </li>
              <li>
                <Link href="/mysql-lab" className="hover:text-neb-500 transition flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-neb-500" /> MySQL Database Lab
                </Link>
              </li>
            </ul>
          </div>

          {/* Student Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Student Account</h3>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <Link href="/auth/register" className="hover:text-neb-500 transition">
                  Create Free Account
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-neb-500 transition">
                  Student Sign In
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-neb-500 transition flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-neb-500" /> Subscription Plans
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Student Support</h3>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <a href="tel:+237677482442" className="hover:text-neb-500 transition flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-neb-500" /> +237 677 482 442
                </a>
              </li>
              <li>
                <a href="mailto:nebcode26@gmail.com" className="hover:text-neb-500 transition flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-neb-500" /> nebcode26@gmail.com
                </a>
              </li>
              <li>
                <Link href="/contact" className="hover:text-neb-500 transition">
                  Contact Help Desk
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-dark-700 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} Nebcode Learning Platform. Built for secondary school students in Cameroon.</p>
          <div className="flex items-center gap-4">
            <Link href="/courses" className="hover:text-white transition">Courses</Link>
            <Link href="/mcq" className="hover:text-white transition">MCQ Papers</Link>
            <Link href="/contact" className="hover:text-white transition">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
