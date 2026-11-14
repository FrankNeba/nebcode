'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { courseService, paymentService } from '@/services';
import { Spinner } from '@/components/ui/Spinner';
import { BookOpen, Lock, CheckCircle, Search, Grid3X3, Database, Code, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Course {
  id: string;
  slug?: string;
  title: string;
  description: string;
  thumbnail: string | null;
  price: number;
  is_free: boolean;
  category: 'mysql' | 'programming' | 'others';
  module_count: number;
}


const CATEGORIES = [
  { id: 'all', name: 'All Courses', icon: Grid3X3 },
  { id: 'mysql', name: 'MySQL Databases', icon: Database },
  { id: 'programming', name: 'C Programming', icon: Code },
  { id: 'others', name: 'Other Courses', icon: Layers },
];

export default function CoursesPageClient({ initialCourses = [] }: { initialCourses?: Course[] }) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [purchases, setPurchases] = useState<string[]>([]);
  const [loading, setLoading] = useState(initialCourses.length === 0);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (activeTab !== 'all' || courses.length === 0) {
      setLoading(true);
    }
    const params = activeTab !== 'all' ? { category: activeTab } : undefined;
    Promise.all([
      courseService.getCourses(params),
      paymentService.getMyPurchases().catch(() => ({ data: [] }))
    ]).then(([cRes, pRes]) => {
      setCourses(cRes.data?.results || cRes.data || []);
      setPurchases((pRes.data || []).map((p: any) => p.course_id || p.course));
    }).finally(() => setLoading(false));
  }, [activeTab]);

  const filtered = search.trim()
    ? courses.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase())
      )
    : courses;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 pb-24 md:pb-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Course Catalog
        </h1>
        <p className="text-gray-400 mt-2">Master C programming and MySQL databases from beginner to professional.</p>
      </div>

      {/* Search + Category Tabs row */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-dark-900 border border-dark-700 text-gray-200 placeholder-gray-600 text-sm focus:outline-none focus:border-neb-700 focus:ring-1 focus:ring-neb-800 transition"
          />
        </div>

        {/* Count badge */}
        {!loading && (
          <span className="text-xs text-gray-500 shrink-0">
            {filtered.length} {filtered.length === 1 ? 'course' : 'courses'} found
          </span>
        )}
      </div>

      {/* Categories Tabs */}
      <div className="flex border-b border-dark-800 gap-0.5 mb-8 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearch(''); }}
              className={cn(
                "flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-all relative border-b-2 whitespace-nowrap",
                activeTab === tab.id
                  ? "text-neb-400 border-neb-500"
                  : "text-gray-500 border-transparent hover:text-gray-300 hover:border-dark-600"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner className="h-8 w-8" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <BookOpen className="h-16 w-16 text-dark-750 mb-4" />
          <h3 className="text-xl font-semibold text-gray-400">
            {search ? `No courses match "${search}"` : 'No courses available in this category'}
          </h3>
          <p className="text-gray-600 mt-2">
            {search ? 'Try a different search term.' : 'Check back soon — new modules are on the way.'}
          </p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="mt-4 text-sm text-neb-400 hover:text-neb-300 font-medium transition"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {filtered.map((course) => {
            const owned = course.is_free || purchases.includes(course.id);
            return (
              <Link key={course.id} href={`/courses/${course.slug || course.id}`}>

                <div className={cn(
                  "group relative bg-dark-900/40 backdrop-blur-sm border rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-neb-900/10 cursor-pointer h-full flex flex-col",
                  owned ? "border-dark-800 hover:border-neb-800/40" : "border-dark-800 hover:border-dark-700"
                )}>
                  {/* Thumbnail */}
                  <div className="h-44 bg-gradient-to-br from-dark-800 to-dark-950 flex items-center justify-center relative overflow-hidden">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-dark-700">
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
                    {course.is_free && !owned && (
                      <div className="absolute top-3 right-3 bg-blue-700/90 text-white px-2.5 py-1 rounded-full text-xs font-bold">
                        Free
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-dark-950 text-gray-400 border border-dark-850">
                        {course.category === 'mysql' ? 'MySQL' : course.category === 'programming' ? 'C Programming' : 'Other'}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg text-white group-hover:text-neb-400 transition-colors line-clamp-2">{course.title}</h3>
                    <p className="text-gray-500 text-sm mt-2 line-clamp-3 flex-1">{course.description}</p>

                    <div className="mt-4 flex items-center justify-between pt-4 border-t border-dark-800">
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>{course.module_count} {course.module_count === 1 ? 'module' : 'modules'}</span>
                      </div>
                      <div className="font-bold">
                        {course.is_free ? (
                          <span className="text-green-400 text-sm">Free</span>
                        ) : owned ? (
                          <span className="text-green-400 text-sm">Enrolled</span>
                        ) : (
                          <span className="text-neb-400 text-sm">Premium</span>
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
