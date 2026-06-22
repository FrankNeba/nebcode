'use client';

import Link from 'next/link';
import { Compass, BookOpen, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] px-4 text-center select-none animate-in fade-in duration-300">
      {/* Visual Indicator */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-neb-600/20 blur-3xl rounded-full scale-150"></div>
        <div className="relative w-24 h-24 mx-auto rounded-full bg-dark-900 border border-dark-800 flex items-center justify-center shadow-2xl">
          <Compass className="h-12 w-12 text-neb-500 animate-spin-slow" />
        </div>
      </div>

      {/* Hero Text */}
      <h1 className="text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">
        404
      </h1>
      <h2 className="text-xl font-bold text-white mt-4">Lost in Code?</h2>
      <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto leading-relaxed">
        The page you are looking for doesn't exist, was removed, or is currently compiling somewhere in the cloud.
      </p>

      {/* Call to Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-8 w-full max-w-xs sm:max-w-none">
        <Link href="/dashboard" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto flex items-center justify-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Button>
        </Link>
        <Link href="/courses" className="w-full sm:w-auto">
          <Button variant="secondary" className="w-full sm:w-auto flex items-center justify-center gap-2">
            <BookOpen className="h-4 w-4" />
            Browse Courses
          </Button>
        </Link>
      </div>
    </div>
  );
}
