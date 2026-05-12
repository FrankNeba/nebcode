'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { courseService, paymentService } from '@/services';
import { Spinner } from '@/components/ui/Spinner';
import { BookOpen, Lock, CheckCircle, Star, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  price: number;
  is_free: boolean;
  module_count: number;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [purchases, setPurchases] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      courseService.getCourses(),
      paymentService.getMyPurchases().catch(() => ({ data: [] }))
    ]).then(([cRes, pRes]) => {
      setCourses(cRes.data?.results || cRes.data || []);
      setPurchases((pRes.data || []).map((p: any) => p.course_id || p.course));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-56px)]">
      <Spinner className="h-8 w-8" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 pb-24 md:pb-10">
      <div className="mb-10">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Course Catalog
        </h1>
        <p className="text-gray-500 mt-2">Master C programming and MySQL from beginner to professional.</p>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <BookOpen className="h-16 w-16 text-dark-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-400">No courses available yet</h3>
          <p className="text-gray-600 mt-2">Check back soon — new courses are on the way.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const owned = course.is_free || purchases.includes(course.id);
            return (
              <Link key={course.id} href={`/courses/${course.id}`}>
                <div className={cn(
                  "group relative bg-dark-900 border rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-neb-900/20 cursor-pointer h-full flex flex-col",
                  owned ? "border-dark-700 hover:border-neb-700/50" : "border-dark-700"
                )}>
                  {/* Thumbnail */}
                  <div className="h-44 bg-gradient-to-br from-dark-800 to-dark-950 flex items-center justify-center relative overflow-hidden">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-dark-600">
                        <BookOpen className="h-10 w-10" />
                        <span className="text-xs font-mono">nebcode</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 to-transparent" />
                    {owned && (
                      <div className="absolute top-3 right-3 bg-green-700/90 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Enrolled
                      </div>
                    )}
                    {!owned && !course.is_free && (
                      <div className="absolute top-3 right-3 bg-neb-800/90 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Premium
                      </div>
                    )}
                    {course.is_free && (
                      <div className="absolute top-3 right-3 bg-blue-700/90 text-white px-2.5 py-1 rounded-full text-xs font-bold">
                        Free
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-lg text-white group-hover:text-neb-400 transition-colors line-clamp-2">{course.title}</h3>
                    <p className="text-gray-500 text-sm mt-2 line-clamp-3 flex-1">{course.description}</p>

                    <div className="mt-4 flex items-center justify-between pt-4 border-t border-dark-700">
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>{course.module_count} modules</span>
                      </div>
                      <div className="font-bold">
                        {course.is_free ? (
                          <span className="text-green-400">Free</span>
                        ) : owned ? (
                          <span className="text-green-400">Enrolled</span>
                        ) : (
                          <span className="text-neb-400">{Number(course.price).toLocaleString()} XAF</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
