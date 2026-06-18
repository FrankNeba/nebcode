'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileCode,
  CheckCircle,
  AlertTriangle,
  Play,
  HelpCircle,
  Eye,
  Database,
  Code2,
  BookOpen,
  Layers,
  Users,
  Plus,
  Trash2,
  Edit,
  Download,
  Search,
  Check,
  X,
  ShieldAlert,
  UserCheck,
  Clock,
  Sparkles,
  Package,
  FileText,
  Minus,
  Settings,
  FolderOpen,
  AlertCircle,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import { courseService, authService } from '@/services';
import { Button } from '@/components/ui/Button';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

type Tab = 'uploader' | 'courses' | 'users' | 'content';

export default function CourseAdminPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>('courses');
  const [mounted, setMounted] = useState(false);

  // Uploader State
  const [jsonText, setJsonText] = useState('');
  const [courseData, setCourseData] = useState<any>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPreviewLesson, setSelectedPreviewLesson] = useState<any>(null);

  // Courses List / CRUD State
  const [courses, setCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isDeletingCourse, setIsDeletingCourse] = useState<string | null>(null);

  // Course JSON editor state
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonCourseId, setJsonCourseId] = useState<string | null>(null);
  const [jsonValue, setJsonValue] = useState('');
  const [isSavingJson, setIsSavingJson] = useState(false);
  const [isFetchingJson, setIsFetchingJson] = useState(false);

  // Course Content Browser state
  const [contentCourse, setContentCourse] = useState<any | null>(null);
  const [contentCourseLoading, setContentCourseLoading] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  // Editor modal for any item (module / lesson / section)
  const [editItem, setEditItem] = useState<{ type: 'module' | 'lesson' | 'section'; data: any } | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'module' | 'lesson' | 'section'; id: string } | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  // Add item modal
  const [addItem, setAddItem] = useState<{ type: 'module' | 'lesson' | 'section'; parentId?: string; courseId?: string } | null>(null);
  const [addForm, setAddForm] = useState<Record<string, any>>({});
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Users List / CRUD State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');

  // Course Form State
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    price: 0,
    category: 'programming',
    is_free: false,
    is_active: true,
  });

  // User Form State
  const [userForm, setUserForm] = useState({
    email: '',
    full_name: '',
    password: '',
    is_verified: false,
    is_active: true,
    is_staff: false,
    is_superuser: false,
    is_subscribed: false,
    subscription_expires_at: '',
  });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (authLoading) return;
    if (!isAuthenticated || !user?.is_staff) {
      toast.error('Access denied. Staff only.');
      router.push('/dashboard');
    } else {
      fetchCourses();
      fetchUsers();
    }
  }, [mounted, user, isAuthenticated, authLoading, router]);

  const fetchCourses = async () => {
    setCoursesLoading(true);
    try {
      const { data } = await courseService.getAdminCourses();
      const list = Array.isArray(data) ? data : (data?.results || []);
      setCourses(list);
    } catch (err) {
      toast.error('Failed to load courses.');
    } finally {
      setCoursesLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const { data } = await authService.getAdminUsers();
      const list = Array.isArray(data) ? data : (data?.results || []);
      setUsersList(list);
    } catch (err) {
      toast.error('Failed to load users.');
    } finally {
      setUsersLoading(false);
    }
  };

  if (!mounted || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)] bg-[#03001e]/10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neb-500"></div>
      </div>
    );
  }

  if (!user?.is_staff) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] p-6 text-center">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4 animate-bounce" />
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-gray-400 max-w-md">You do not have administrative privileges to access this dashboard.</p>
      </div>
    );
  }

  // Course handlers
  const handleOpenCourseEdit = (course: any) => {
    setSelectedCourse(course);
    setCourseForm({
      title: course.title,
      description: course.description || '',
      price: Number(course.price || 0),
      category: course.category || 'programming',
      is_free: !!course.is_free,
      is_active: !!course.is_active,
    });
    setIsCourseModalOpen(true);
  };

  const handleOpenCourseCreate = () => {
    setSelectedCourse(null);
    setCourseForm({
      title: '',
      description: '',
      price: 0,
      category: 'programming',
      is_free: false,
      is_active: true,
    });
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedCourse) {
        await courseService.updateAdminCourse(selectedCourse.id, courseForm);
        toast.success('Course updated successfully!');
      } else {
        await courseService.createAdminCourse(courseForm);
        toast.success('Course created successfully!');
      }
      setIsCourseModalOpen(false);
      fetchCourses();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save course.');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    setIsDeletingCourse(id);
    try {
      await courseService.deleteAdminCourse(id);
      toast.success('Course deleted successfully!');
      fetchCourses();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete course.');
    } finally {
      setIsDeletingCourse(null);
    }
  };

  const handleOpenCourseJsonEdit = async (courseId: string) => {
    setJsonCourseId(courseId);
    setIsJsonModalOpen(true);
    setIsFetchingJson(true);
    setJsonValue('');
    try {
      const { data } = await courseService.exportAdminCourseJson(courseId);
      setJsonValue(JSON.stringify(data, null, 2));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to fetch course JSON.');
      setIsJsonModalOpen(false);
    } finally {
      setIsFetchingJson(false);
    }
  };

  const handleSaveCourseJson = async () => {
    if (!jsonCourseId) return;
    let parsed: any;
    try {
      parsed = JSON.parse(jsonValue);
    } catch (e: any) {
      toast.error('Invalid JSON: ' + e.message);
      return;
    }
    setIsSavingJson(true);
    try {
      await courseService.updateAdminCourseJson(jsonCourseId, parsed);
      toast.success('Course structure updated successfully!');
      setIsJsonModalOpen(false);
      fetchCourses();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save course JSON.');
    } finally {
      setIsSavingJson(false);
    }
  };

  // User handlers
  const handleOpenUserEdit = (userData: any) => {
    setSelectedUser(userData);
    setUserForm({
      email: userData.email,
      full_name: userData.full_name || '',
      password: '', // blank by default
      is_verified: !!userData.is_verified,
      is_active: !!userData.is_active,
      is_staff: !!userData.is_staff,
      is_superuser: !!userData.is_superuser,
      is_subscribed: !!userData.is_subscribed,
      subscription_expires_at: userData.subscription_expires_at ? new Date(userData.subscription_expires_at).toISOString().slice(0, 16) : '',
    });
    setIsUserModalOpen(true);
  };

  const handleOpenUserCreate = () => {
    setSelectedUser(null);
    setUserForm({
      email: '',
      full_name: '',
      password: '',
      is_verified: false,
      is_active: true,
      is_staff: false,
      is_superuser: false,
      is_subscribed: false,
      subscription_expires_at: '',
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { ...userForm };
    if (!payload.password) {
      delete payload.password; // Do not send empty password on edit
    }
    if (!payload.subscription_expires_at) {
      payload.subscription_expires_at = null;
    } else {
      payload.subscription_expires_at = new Date(payload.subscription_expires_at).toISOString();
    }

    try {
      if (selectedUser) {
        await authService.updateAdminUser(selectedUser.id, payload);
        toast.success('User updated successfully!');
      } else {
        if (!userForm.password) {
          toast.error('Password is required for new users.');
          return;
        }
        await authService.createAdminUser(payload);
        toast.success('User created successfully!');
      }
      setIsUserModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save user.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    setIsDeletingUser(id);
    try {
      await authService.deleteAdminUser(id);
      toast.success('User deleted successfully!');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete user.');
    } finally {
      setIsDeletingUser(null);
    }
  };

  // Uploader Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setJsonText(text);
      validateAndParse(text);
    };
    reader.readAsText(file);
  };

  const validateAndParse = (text: string) => {
    setValidationError(null);
    setCourseData(null);
    setSelectedPreviewLesson(null);

    if (!text.trim()) return;

    try {
      const parsed = JSON.parse(text);
      if (!parsed.title) throw new Error("Missing 'title' at course root level.");
      if (parsed.price !== undefined && typeof parsed.price !== 'number') throw new Error("'price' must be a number.");
      if (parsed.modules && !Array.isArray(parsed.modules)) throw new Error("'modules' must be an array.");

      if (parsed.modules) {
        parsed.modules.forEach((mod: any, mIdx: number) => {
          if (!mod.title) throw new Error(`Module index ${mIdx} is missing a 'title'.`);
          if (mod.lessons && !Array.isArray(mod.lessons)) throw new Error(`Lessons in module '${mod.title}' must be an array.`);
          if (mod.lessons) {
            mod.lessons.forEach((les: any, lIdx: number) => {
              if (!les.title) throw new Error(`Lesson index ${lIdx} in module '${mod.title}' is missing a 'title'.`);
              if (les.sections && !Array.isArray(les.sections)) throw new Error(`Sections in lesson '${les.title}' must be an array.`);
              if (les.exercises && !Array.isArray(les.exercises)) throw new Error(`Exercises in lesson '${les.title}' must be an array.`);
            });
          }
        });
      }

      setCourseData(parsed);
      toast.success('JSON parsed and validated successfully!');
    } catch (err: any) {
      setValidationError(err.message || 'Invalid JSON syntax.');
    }
  };

  const handleImport = async () => {
    if (!courseData) return;
    setIsUploading(true);
    try {
      await courseService.importCourse(courseData);
      toast.success('Course imported successfully!');
      setJsonText('');
      setCourseData(null);
      setSelectedPreviewLesson(null);
      fetchCourses();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Import failed. Check server logs.');
    } finally {
      setIsUploading(false);
    }
  };

  const filteredUsers = usersList.filter(u =>
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.full_name && u.full_name.toLowerCase().includes(userSearch.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24">
      {/* Header Banner */}
      <div className="mb-8 p-6 rounded-2xl bg-dark-900 border border-dark-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-dark-800/30 rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-neb-950 border border-neb-700/50 text-neb-400">
              Admin Portal
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-dark-950 border border-dark-800 text-gray-400">
              System Control
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Layers className="h-8 w-8 text-neb-500" /> Nebcode Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1 max-w-xl">
            Manage your online coding courses, oversee user permissions and subscriptions, and upload learning content templates.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-dark-950 border border-dark-850 p-1.5 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
              activeTab === 'courses' ? 'bg-neb-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" /> Courses
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
              activeTab === 'users' ? 'bg-neb-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" /> Users CRUD
          </button>
          <button
            onClick={() => setActiveTab('uploader')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
              activeTab === 'uploader' ? 'bg-neb-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Settings className="h-3.5 w-3.5" /> JSON Import
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
              activeTab === 'content' ? 'bg-neb-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <FolderOpen className="h-3.5 w-3.5" /> Content Editor
          </button>
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="animate-in fade-in duration-300">
        
        {/* COURSES TAB */}
        {activeTab === 'courses' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-bold text-white">Platform Courses</h2>
                <p className="text-xs text-gray-400">See all active and inactive courses. Create or modify course structures manually.</p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="/course_example.json"
                  download="course_example.json"
                  className="px-4 py-2 bg-dark-900 hover:bg-dark-850 border border-dark-800 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <Download className="h-4 w-4" /> Download Sample JSON
                </a>
                <Button onClick={handleOpenCourseCreate} className="shadow-neb bg-neb-600 hover:bg-neb-500 text-xs py-2 px-4 flex items-center gap-1">
                  <Plus className="h-4 w-4" /> Create Course
                </Button>
              </div>
            </div>

            {coursesLoading ? (
              <div className="flex items-center justify-center py-20 bg-dark-900/30 border border-dark-800 rounded-2xl">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neb-500"></div>
              </div>
            ) : courses.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-12 bg-dark-900/20 border border-dark-800 rounded-2xl">
                <BookOpen className="h-12 w-12 text-dark-700 mb-3" />
                <h3 className="text-base font-bold text-white mb-1">No courses found</h3>
                <p className="text-xs text-gray-400 max-w-sm mb-4">You haven't uploaded or created any courses yet.</p>
                <Button onClick={handleOpenCourseCreate} size="sm">Create First Course</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((c: any) => (
                  <div key={c.id} className="card p-5 bg-dark-900/40 border-dark-800 flex flex-col justify-between hover:border-dark-700 transition relative group">
                    <div className="absolute top-4 right-4 flex items-center gap-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.is_active ? 'bg-green-950/50 border border-green-900/50 text-green-400' : 'bg-red-950/50 border border-red-900/50 text-red-400'
                      }`}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div>
                      <div className="mb-3">
                        <span className="text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded bg-[#0d0d18] border border-dark-850 text-neb-400">
                          {c.category}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white mb-2 line-clamp-1">{c.title}</h3>
                      <p className="text-xs text-gray-400 line-clamp-3 mb-4">{c.description || 'No description provided.'}</p>
                    </div>

                    <div className="border-t border-dark-800 pt-4 mt-2 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] text-gray-500">Modules count</p>
                        <p className="text-xs font-bold text-white">{c.module_count || 0} Modules</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 text-right">Price</p>
                        <p className="text-xs font-extrabold text-neb-400 text-right">
                          {c.is_free ? 'Free' : `${Number(c.price || 0).toLocaleString()} XAF`}
                        </p>
                      </div>
                    </div>

                    {/* Quick actions hover overlay or button set */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-dark-850/40">
                      <button
                        onClick={() => handleOpenCourseEdit(c)}
                        className="flex-1 py-1.5 bg-dark-800 hover:bg-dark-750 border border-dark-700 hover:text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                      >
                        <Edit className="h-3 w-3" /> Edit
                      </button>
                      <button
                        onClick={() => handleOpenCourseJsonEdit(c.id)}
                        className="px-3 py-1.5 bg-neb-950/40 hover:bg-neb-900/50 border border-neb-900/30 text-neb-400 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                        title="Edit full course JSON structure"
                      >
                        <Code2 className="h-3 w-3" /> JSON
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${c.title}"?`)) {
                            handleDeleteCourse(c.id);
                          }
                        }}
                        disabled={isDeletingCourse === c.id}
                        className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/50 border border-red-900/30 text-red-400 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        <Trash2 className="h-3 w-3" /> {isDeletingCourse === c.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-bold text-white">Platform Users</h2>
                <p className="text-xs text-gray-400">Perform CRUD actions on platform users. Assign admin roles or manage subscriptions.</p>
              </div>
              <Button onClick={handleOpenUserCreate} className="shadow-neb bg-neb-600 hover:bg-neb-500 text-xs py-2 px-4 flex items-center gap-1">
                <Plus className="h-4 w-4" /> Create User
              </Button>
            </div>

            {/* User Search & Info Bar */}
            <div className="flex items-center gap-3 bg-dark-900/40 border border-dark-800 p-4 rounded-xl">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by full name or email address..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-dark-950 border border-dark-800 rounded-lg outline-none text-white focus:border-neb-500 transition"
                />
              </div>
              <span className="text-[10px] text-gray-450 ml-auto font-mono">
                Showing {filteredUsers.length} of {usersList.length} users
              </span>
            </div>

            {usersLoading ? (
              <div className="flex items-center justify-center py-20 bg-dark-900/30 border border-dark-800 rounded-2xl">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neb-500"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-12 bg-dark-900/20 border border-dark-800 rounded-2xl">
                <Users className="h-12 w-12 text-dark-700 mb-3" />
                <h3 className="text-base font-bold text-white mb-1">No users matched</h3>
                <p className="text-xs text-gray-400 max-w-sm">Try searching for a different name or email.</p>
              </div>
            ) : (
              <div className="card bg-dark-900/20 border border-dark-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-dark-950/80 border-b border-dark-800 text-gray-400 font-bold uppercase tracking-wider">
                        <th className="p-4">Reg No</th>
                        <th className="p-4">Email / Name</th>
                        <th className="p-4 text-center">Status Roles</th>
                        <th className="p-4 text-center">Subscription</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-850">
                      {filteredUsers.map((u: any) => (
                        <tr key={u.id} className="hover:bg-dark-900/30 transition">
                          <td className="p-4 font-mono font-bold text-gray-400">
                            {u.registration_number ? `#${String(u.registration_number).padStart(4, '0')}` : 'N/A'}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-white">{u.full_name || 'No Name'}</span>
                              <span className="text-[10px] text-gray-500 mt-0.5">{u.email}</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {u.is_superuser && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-950/50 border border-red-800/40 text-red-400">
                                  Superuser
                                </span>
                              )}
                              {u.is_staff && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950/50 border border-amber-800/40 text-amber-400">
                                  Staff
                                </span>
                              )}
                              {u.is_verified ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-950/50 border border-green-800/40 text-green-400 flex items-center gap-0.5">
                                  <UserCheck className="h-2.5 w-2.5" /> Verified
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-950/50 border border-gray-800/40 text-gray-450">
                                  Unverified
                                </span>
                              )}
                              {!u.is_active && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-950/50 border border-red-850/50 text-red-500">
                                  Suspended
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            {u.is_subscribed ? (
                              <div className="flex flex-col items-center">
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-neb-950/50 border border-neb-800/45 text-neb-400 inline-flex items-center gap-0.5">
                                  <Sparkles className="h-2.5 w-2.5 text-neb-400" /> Premium
                                </span>
                                {u.subscription_expires_at && (
                                  <span className="text-[9px] text-gray-500 mt-1 flex items-center gap-0.5 font-mono">
                                    <Clock className="h-2.5 w-2.5" /> exp {new Date(u.subscription_expires_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[9px] text-gray-500">Free Tier</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenUserEdit(u)}
                                className="p-1.5 bg-dark-800 hover:bg-dark-700 border border-dark-700 text-gray-300 hover:text-white rounded-lg transition"
                                title="Edit User"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete user "${u.email}"?`)) {
                                    handleDeleteUser(u.id);
                                  }
                                }}
                                disabled={isDeletingUser === u.id || u.id === user.id}
                                className="p-1.5 bg-red-950/30 hover:bg-red-900/40 border border-red-900/25 text-red-400 rounded-lg transition disabled:opacity-50"
                                title="Delete User"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CONTENT EDITOR TAB */}
        {activeTab === 'content' && (
          <div className="flex flex-col gap-6">
            {/* Course Selector */}
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-bold text-white">Course Content Editor</h2>
                <p className="text-xs text-gray-400">Browse modules, lessons and sections. Click any item to edit its raw text (supports KaTeX / Markdown).</p>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <select
                  className="bg-dark-900 border border-dark-800 text-gray-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-neb-600"
                  value={contentCourse?.id || ''}
                  onChange={async (e) => {
                    const id = e.target.value;
                    if (!id) { setContentCourse(null); return; }
                    setContentCourseLoading(true);
                    try {
                      const { data } = await courseService.getCourse(id);
                      setContentCourse(data);
                      setExpandedModules(new Set());
                      setExpandedLessons(new Set());
                    } catch { toast.error('Failed to load course content'); }
                    finally { setContentCourseLoading(false); }
                  }}
                >
                  <option value="">— Select a course —</option>
                  {courses.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                {contentCourse && (
                  <button
                    onClick={() => setAddItem({ type: 'module', courseId: contentCourse.id })}
                    className="flex items-center gap-1.5 px-3 py-2 bg-neb-700 hover:bg-neb-600 text-white text-xs font-bold rounded-xl transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Module
                  </button>
                )}
              </div>
            </div>

            {contentCourseLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neb-500" />
              </div>
            )}

            {!contentCourse && !contentCourseLoading && (
              <div className="flex flex-col items-center justify-center py-20 bg-dark-900/20 border border-dark-800 rounded-2xl text-center">
                <Layers className="h-12 w-12 text-dark-700 mb-3" />
                <p className="text-gray-500 text-sm">Select a course above to browse its content</p>
              </div>
            )}

            {contentCourse && !contentCourseLoading && (
              <div className="flex flex-col gap-3">
                {(contentCourse.modules || []).length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-8">No modules yet. Click &ldquo;Add Module&rdquo; to create one.</p>
                )}
                {(contentCourse.modules || []).map((mod: any) => (
                  <div key={mod.id} className="border border-dark-800 rounded-2xl overflow-hidden">
                    {/* Module Header */}
                    <div className="flex items-center gap-3 px-5 py-3 bg-dark-900/60 hover:bg-dark-900/80 transition cursor-pointer"
                      onClick={() => setExpandedModules(prev => { const n = new Set(prev); n.has(mod.id) ? n.delete(mod.id) : n.add(mod.id); return n; })}>
                      <span className="text-neb-400 w-4 flex items-center justify-center shrink-0">
                        {expandedModules.has(mod.id) ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5 text-neb-400 shrink-0" /> {mod.title}
                        </p>
                        <p className="text-[10px] text-gray-500">{(mod.lessons || []).length} lessons · order {mod.order}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setAddItem({ type: 'lesson', parentId: mod.id })}
                          className="p-1.5 text-neb-400 hover:bg-neb-900/30 rounded-lg transition" title="Add Lesson"><Plus className="h-3.5 w-3.5" /></button>
                        <button onClick={() => { setEditItem({ type: 'module', data: mod }); setEditForm({ title: mod.title, order: mod.order }); }}
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-800 rounded-lg transition"><Edit className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDeleteConfirm({ type: 'module', id: mod.id })}
                          className="p-1.5 text-red-400 hover:bg-red-900/20 rounded-lg transition"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>

                    {/* Lessons */}
                    {expandedModules.has(mod.id) && (
                      <div className="bg-dark-950/40 divide-y divide-dark-850/30">
                        {(mod.lessons || []).length === 0 && (
                          <p className="text-gray-600 text-xs text-center py-4">No lessons in this module.</p>
                        )}
                        {(mod.lessons || []).map((lesson: any) => (
                          <div key={lesson.id}>
                            {/* Lesson Row */}
                            <div className="flex items-center gap-3 pl-10 pr-5 py-2.5 hover:bg-dark-900/40 transition cursor-pointer"
                              onClick={() => setExpandedLessons(prev => { const n = new Set(prev); n.has(lesson.id) ? n.delete(lesson.id) : n.add(lesson.id); return n; })}>
                              <span className="text-gray-500 w-4 flex items-center justify-center shrink-0">
                                {expandedLessons.has(lesson.id) ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-200 truncate flex items-center gap-1.5">
                                  <FileText className="h-3.5 w-3.5 text-gray-400 shrink-0" /> {lesson.title}
                                </p>
                                <p className="text-[10px] text-gray-600">{lesson.lesson_type} · order {lesson.order} · {(lesson.sections || []).length} sections</p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setAddItem({ type: 'section', parentId: lesson.id })}
                                  className="p-1.5 text-neb-400 hover:bg-neb-900/30 rounded-lg transition" title="Add Section"><Plus className="h-3.5 w-3.5" /></button>
                                <button onClick={() => { setEditItem({ type: 'lesson', data: lesson }); setEditForm({ title: lesson.title, content: lesson.content || '', video_url: lesson.video_url || '', lesson_type: lesson.lesson_type, order: lesson.order }); }}
                                  className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-800 rounded-lg transition"><Edit className="h-3.5 w-3.5" /></button>
                                <button onClick={() => setDeleteConfirm({ type: 'lesson', id: lesson.id })}
                                  className="p-1.5 text-red-400 hover:bg-red-900/20 rounded-lg transition"><Trash2 className="h-3.5 w-3.5" /></button>
                              </div>
                            </div>

                            {/* Sections */}
                            {expandedLessons.has(lesson.id) && (
                              <div className="bg-dark-950/60 divide-y divide-dark-850/20">
                                {(lesson.sections || []).length === 0 && (
                                  <p className="text-gray-700 text-[11px] text-center py-3 pl-16">No sections.</p>
                                )}
                                {(lesson.sections || []).map((sec: any) => (
                                  <div key={sec.id} className="flex items-center gap-3 pl-20 pr-5 py-2 hover:bg-dark-900/30 transition">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[11px] font-medium text-gray-300 truncate flex items-center gap-1.5">
                                        <Minus className="h-3 w-3 text-neb-500 shrink-0" /> {sec.title}
                                      </p>
                                      <p className="text-[10px] text-gray-600 line-clamp-1">{(sec.content || '').slice(0, 80) || '(empty)'}</p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button onClick={() => { setEditItem({ type: 'section', data: sec }); setEditForm({ title: sec.title, content: sec.content || '', order: sec.order }); }}
                                        className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-800 rounded-lg transition"><Edit className="h-3.5 w-3.5" /></button>
                                      <button onClick={() => setDeleteConfirm({ type: 'section', id: sec.id })}
                                        className="p-1.5 text-red-400 hover:bg-red-900/20 rounded-lg transition"><Trash2 className="h-3.5 w-3.5" /></button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* UPLOADER TAB */}
        {activeTab === 'uploader' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* JSON Editor / Uploader Panel */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="card p-6 bg-dark-900/40 border-dark-800 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <FileCode className="h-5 w-5 text-neb-400" /> JSON Course Template
                  </h2>
                  <div className="flex items-center gap-2">
                    <a
                      href="/course_example.json"
                      download="course_example.json"
                      className="text-xs cursor-pointer px-2.5 py-1.5 rounded-lg bg-dark-950 border border-dark-850 hover:bg-dark-800 hover:text-white transition flex items-center gap-1"
                      title="Download clean sample format"
                    >
                      <Download className="h-3.5 w-3.5 text-gray-400" /> Template
                    </a>
                    <label className="text-xs cursor-pointer px-3 py-1.5 rounded-lg bg-dark-800 border border-dark-750 hover:bg-dark-705 hover:text-white transition flex items-center gap-1.5">
                      <Upload className="h-3.5 w-3.5 text-gray-400" /> Upload
                      <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <textarea
                  value={jsonText}
                  onChange={(e) => {
                    setJsonText(e.target.value);
                    validateAndParse(e.target.value);
                  }}
                  placeholder={`Provide course JSON, see downloadable template...`}
                  className="w-full h-[320px] md:h-[450px] bg-dark-950 font-mono text-xs text-gray-300 p-4 rounded-xl border border-dark-800 outline-none focus:border-neb-500/50 resize-y"
                  spellCheck={false}
                />

                {/* Validation Feedback */}
                {validationError && (
                  <div className="flex items-start gap-2 p-3 bg-red-950/20 border border-red-900/30 rounded-xl text-xs text-red-400 animate-in fade-in duration-300">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{validationError}</span>
                  </div>
                )}

                {courseData && (
                  <div className="flex items-center gap-2 p-3 bg-green-950/20 border border-green-900/30 rounded-xl text-xs text-green-400 animate-in fade-in duration-300">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>JSON structural checks passed successfully! Ready to import.</span>
                  </div>
                )}

                <Button
                  onClick={handleImport}
                  disabled={!courseData || isUploading}
                  isLoading={isUploading}
                  className="w-full bg-neb-600 hover:bg-neb-500 font-bold"
                >
                  Import Selected Course JSON
                </Button>
              </div>
            </div>

            {/* Real-time Formatting & Hierarchy Preview Panel */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="card p-6 bg-dark-900/40 border-dark-800 flex flex-col gap-5 min-h-[480px]">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Eye className="h-5 w-5 text-neb-400" /> Structure & Render Preview
                </h2>

                {!courseData ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <BookOpen className="h-12 w-16 text-dark-700 mb-3" />
                    <p className="text-sm text-gray-500">Provide a valid JSON configuration on the left to review the formatting structure.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6 animate-in fade-in duration-500">
                    {/* Course Metadata Card */}
                    <div className="p-4 bg-dark-950/60 border border-dark-850 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-neb-950/40 border border-neb-800/30 text-neb-400">
                          {courseData.category || 'others'}
                        </span>
                        <h3 className="text-lg font-bold text-white mt-1.5">{courseData.title}</h3>
                        <p className="text-xs text-gray-400 mt-1">{courseData.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-500">Price Structure</p>
                        <p className="text-sm font-bold text-neb-400">
                          {courseData.is_free ? 'Free Course' : `${Number(courseData.price || 0).toLocaleString()} XAF`}
                        </p>
                      </div>
                    </div>

                    {/* Main Tree structure */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                      {/* Modules & Lessons Tree */}
                      <div className="md:col-span-5 flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Hierarchy Outline</p>
                        {courseData.modules?.map((mod: any, mIdx: number) => (
                          <div key={mIdx} className="flex flex-col gap-1">
                            <div className="text-xs font-bold text-gray-300 bg-dark-950 px-2.5 py-1.5 rounded-lg border border-dark-850 truncate">
                              {mod.title}
                            </div>
                            <div className="pl-4 flex flex-col gap-1 border-l border-dark-800 ml-2 mt-1">
                              {mod.lessons?.map((les: any, lIdx: number) => (
                                <button
                                  key={lIdx}
                                  onClick={() => setSelectedPreviewLesson(les)}
                                  className={`text-left text-xs px-2.5 py-2 rounded-lg transition-all ${
                                    selectedPreviewLesson === les
                                      ? 'bg-neb-900/50 text-neb-400 border border-neb-800/40'
                                      : 'text-gray-400 hover:text-white hover:bg-dark-950/40 border border-transparent'
                                  }`}
                                >
                                  📁 {les.title}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Render preview for selected lesson */}
                      <div className="md:col-span-7 flex flex-col gap-4 border border-dark-850 bg-dark-950/40 p-4 rounded-xl max-h-[380px] overflow-y-auto">
                        {!selectedPreviewLesson ? (
                          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
                            <HelpCircle className="h-8 w-8 mb-2 opacity-50" />
                            <p className="text-xs">Select a lesson from the outline to inspect content rendering.</p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-4">
                            <div>
                              <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-dark-800 text-gray-400">
                                {selectedPreviewLesson.lesson_type || 'text'}
                              </span>
                              <h4 className="text-sm font-bold text-white mt-1">{selectedPreviewLesson.title}</h4>
                            </div>

                            {/* YouTube Video Preview inside Previewer! */}
                            {selectedPreviewLesson.video_url && (() => {
                              const videoId = selectedPreviewLesson.video_url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([^&?/]+)/)?.[1];
                              if (videoId) {
                                return (
                                  <div className="w-full aspect-video rounded-lg overflow-hidden border border-dark-800 shadow">
                                    <iframe
                                      src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                                      className="w-full h-full"
                                      allowFullScreen
                                      title="Video Preview"
                                    />
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            {/* Rendering main content (Markdown + LaTeX) */}
                            {selectedPreviewLesson.content && (
                              <div className="p-3 bg-[#0d0d16]/30 border border-dark-850 rounded-lg">
                                <p className="text-[10px] text-gray-500 mb-2 font-semibold">Rendered Lesson Content:</p>
                                <div className="prose prose-invert prose-xs leading-relaxed max-w-none
                                  prose-headings:text-white prose-code:text-neb-400 prose-code:bg-dark-950 prose-code:rounded prose-code:px-1
                                  prose-pre:bg-dark-950 prose-pre:rounded-lg prose-pre:border prose-pre:border-dark-800 prose-pre:p-2.5">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkMath]}
                                    rehypePlugins={[rehypeKatex, rehypeRaw as any]}
                                  >
                                    {selectedPreviewLesson.content}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            )}

                            {/* Sections rendering */}
                            {selectedPreviewLesson.sections && selectedPreviewLesson.sections.length > 0 && (
                              <div className="flex flex-col gap-2.5">
                                <p className="text-[10px] text-gray-500 font-semibold">Hierarchy Subsections:</p>
                                {selectedPreviewLesson.sections.map((sect: any, sIdx: number) => (
                                  <div key={sIdx} className="p-3 bg-dark-950 border border-dark-850 rounded-lg">
                                    <h5 className="text-xs font-bold text-neb-400 mb-1">{sect.title}</h5>
                                    <div className="prose prose-invert prose-xs leading-relaxed max-w-none">
                                      <ReactMarkdown
                                        remarkPlugins={[remarkMath, remarkGfm]}
                                        rehypePlugins={[rehypeKatex, rehypeRaw as any]}
                                      >
                                        {sect.content}
                                      </ReactMarkdown>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Exercises rendering */}
                            {selectedPreviewLesson.exercises && selectedPreviewLesson.exercises.length > 0 && (
                              <div className="flex flex-col gap-2.5">
                                <p className="text-[10px] text-gray-500 font-semibold">Interactive Exercises:</p>
                                {selectedPreviewLesson.exercises.map((ex: any, eIdx: number) => {
                                  const isSQL = ex.exercise_type === 'mysql';
                                  return (
                                    <div key={eIdx} className="p-3 bg-dark-950 border border-dark-850 rounded-lg flex flex-col gap-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-bold text-gray-500 uppercase">Exercise {eIdx + 1}</span>
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${isSQL ? 'bg-blue-950/40 text-blue-400' : 'bg-neb-950/40 text-neb-400'}`}>
                                          {isSQL ? 'MySQL Terminal' : 'C Execution'}
                                        </span>
                                      </div>
                                      <div className="prose prose-invert prose-xs leading-relaxed max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                                          {ex.question}
                                        </ReactMarkdown>
                                      </div>
                                      {ex.starter_code && (
                                        <div>
                                          <p className="text-[9px] text-gray-500 mb-1">Starter Code Template:</p>
                                          <pre className="bg-[#05050b] text-gray-400 text-xs p-2 rounded-lg font-mono border border-dark-800/60 overflow-x-auto">
                                            <code>{ex.starter_code}</code>
                                          </pre>
                                        </div>
                                      )}
                                      {ex.answer && (
                                        <div className="p-2 bg-neb-950/20 border border-neb-900/30 rounded-lg text-xs">
                                          <p className="font-semibold text-neb-400 text-[10px]">Expected Answer:</p>
                                          <pre className="bg-dark-950 text-green-300 p-1.5 rounded font-mono text-[10px] mt-1 border border-dark-850">
                                            <code>{ex.answer.correct_code}</code>
                                          </pre>
                                          {ex.answer.explanation && (
                                            <p className="text-gray-450 text-[10px] mt-1.5"><strong>Explanation:</strong> {ex.answer.explanation}</p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* COURSE CREATION/EDIT MODAL */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-dark-950 border border-dark-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-dark-900 border-b border-dark-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">
                {selectedCourse ? `Edit Course: ${selectedCourse.title}` : 'Create New Course'}
              </h3>
              <button onClick={() => setIsCourseModalOpen(false)} className="text-gray-400 hover:text-white transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="p-6 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Course Title</label>
                <input
                  type="text"
                  required
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  placeholder="e.g. Mastering Advanced MySQL"
                  className="w-full px-3.5 py-2 text-xs bg-dark-900 border border-dark-800 rounded-lg outline-none text-white focus:border-neb-500 transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Description</label>
                <textarea
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  placeholder="Provide a detailed outline of this course..."
                  className="w-full h-24 px-3.5 py-2 text-xs bg-dark-900 border border-dark-800 rounded-lg outline-none text-white focus:border-neb-500 transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-400">Price (XAF)</label>
                  <input
                    type="number"
                    min="0"
                    disabled={courseForm.is_free}
                    value={courseForm.is_free ? 0 : courseForm.price}
                    onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-xs bg-dark-900 border border-dark-800 rounded-lg outline-none text-white focus:border-neb-500 transition disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-400">Category</label>
                  <select
                    value={courseForm.category}
                    onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-dark-900 border border-dark-800 rounded-lg outline-none text-white focus:border-neb-500 transition"
                  >
                    <option value="programming">Programming</option>
                    <option value="mysql">MySQL</option>
                    <option value="others">Others</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={courseForm.is_free}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setCourseForm({ ...courseForm, is_free: checked, price: checked ? 0 : courseForm.price });
                    }}
                    className="rounded bg-dark-900 border-dark-800 text-neb-600 focus:ring-0"
                  />
                  <span>Mark as Free Course</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={courseForm.is_active}
                    onChange={(e) => setCourseForm({ ...courseForm, is_active: e.target.checked })}
                    className="rounded bg-dark-900 border-dark-800 text-neb-600 focus:ring-0"
                  />
                  <span>Publish / Active Status</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-850">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-gray-400 hover:text-white bg-transparent border border-dark-800 hover:bg-dark-900 transition"
                >
                  Cancel
                </button>
                <Button type="submit" className="bg-neb-600 hover:bg-neb-500 text-xs py-2 px-5">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER CREATION/EDIT MODAL */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-dark-950 border border-dark-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 bg-dark-900 border-b border-dark-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">
                {selectedUser ? `Edit User: ${selectedUser.email}` : 'Create New User'}
              </h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-white transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-400">Email Address</label>
                  <input
                    type="email"
                    required
                    disabled={!!selectedUser}
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="email@nebcode.com"
                    className="w-full px-3.5 py-2 text-xs bg-dark-900 border border-dark-800 rounded-lg outline-none text-white focus:border-neb-500 transition disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-400">Full Name</label>
                  <input
                    type="text"
                    required
                    value={userForm.full_name}
                    onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                    placeholder="e.g. Ngwa Frank"
                    className="w-full px-3.5 py-2 text-xs bg-dark-900 border border-dark-800 rounded-lg outline-none text-white focus:border-neb-500 transition"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">
                  Password {selectedUser && <span className="text-[10px] text-gray-500">(leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  required={!selectedUser}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="Min 8 characters"
                  className="w-full px-3.5 py-2 text-xs bg-dark-900 border border-dark-800 rounded-lg outline-none text-white focus:border-neb-500 transition"
                />
              </div>

              {/* Roles configuration */}
              <div className="border border-dark-800 p-3.5 rounded-xl space-y-2.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">System Roles</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                    <input
                      type="checkbox"
                      checked={userForm.is_staff}
                      onChange={(e) => setUserForm({ ...userForm, is_staff: e.target.checked })}
                      className="rounded bg-dark-900 border-dark-800 text-neb-600 focus:ring-0"
                    />
                    <span>Staff Member</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                    <input
                      type="checkbox"
                      checked={userForm.is_superuser}
                      onChange={(e) => setUserForm({ ...userForm, is_superuser: e.target.checked })}
                      className="rounded bg-dark-900 border-dark-800 text-neb-600 focus:ring-0"
                    />
                    <span>Superuser</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                    <input
                      type="checkbox"
                      checked={userForm.is_verified}
                      onChange={(e) => setUserForm({ ...userForm, is_verified: e.target.checked })}
                      className="rounded bg-dark-900 border-dark-800 text-neb-600 focus:ring-0"
                    />
                    <span>Email Verified</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                    <input
                      type="checkbox"
                      checked={userForm.is_active}
                      onChange={(e) => setUserForm({ ...userForm, is_active: e.target.checked })}
                      className="rounded bg-dark-900 border-dark-800 text-neb-600 focus:ring-0"
                    />
                    <span>Active Account</span>
                  </label>
                </div>
              </div>

              {/* Subscription configuration */}
              <div className="border border-dark-800 p-3.5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Yearly Subscription</span>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                    <input
                      type="checkbox"
                      checked={userForm.is_subscribed}
                      onChange={(e) => setUserForm({ ...userForm, is_subscribed: e.target.checked })}
                      className="rounded bg-dark-900 border-dark-800 text-neb-600 focus:ring-0"
                    />
                    <span className="font-semibold text-neb-400">Active Subscription</span>
                  </label>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-400">Subscription Expiration Date</label>
                  <input
                    type="datetime-local"
                    disabled={!userForm.is_subscribed}
                    value={userForm.subscription_expires_at}
                    onChange={(e) => setUserForm({ ...userForm, subscription_expires_at: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-dark-900 border border-dark-800 rounded-lg outline-none text-white focus:border-neb-500 transition disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-850">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-gray-400 hover:text-white bg-transparent border border-dark-800 hover:bg-dark-900 transition"
                >
                  Cancel
                </button>
                <Button type="submit" className="bg-neb-600 hover:bg-neb-500 text-xs py-2 px-5">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── JSON Course Editor Modal ── */}
      {isJsonModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-12 bg-dark-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-3xl bg-dark-900 border border-dark-800 rounded-2xl shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-dark-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-neb-400" /> Edit Course JSON Structure
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Edit the full course structure including modules, lessons, sections, exercises, and exam.</p>
              </div>
              <button onClick={() => setIsJsonModalOpen(false)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-dark-800 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 flex-1">
              {isFetchingJson ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neb-500" />
                </div>
              ) : (
                <textarea
                  value={jsonValue}
                  onChange={(e) => setJsonValue(e.target.value)}
                  className="w-full h-[55vh] bg-dark-950 border border-dark-800 rounded-xl p-4 text-xs font-mono text-gray-200 resize-none focus:outline-none focus:border-neb-600 transition"
                  spellCheck={false}
                  placeholder="Loading course JSON..."
                />
              )}
            </div>

            <div className="flex items-center justify-between gap-3 p-5 border-t border-dark-800">
              <p className="text-[10px] text-gray-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Saving will replace ALL modules, lessons, sections, exercises, and exam.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsJsonModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-gray-400 hover:text-white bg-transparent border border-dark-800 hover:bg-dark-900 transition"
                >
                  Cancel
                </button>
                <Button
                  onClick={handleSaveCourseJson}
                  isLoading={isSavingJson}
                  disabled={isFetchingJson || !jsonValue}
                  className="bg-neb-600 hover:bg-neb-500 text-xs py-2 px-5"
                >
                  Save JSON
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Content Item Edit Modal ── */}
      {editItem && (() => {
        const isLesson = editItem.type === 'lesson';
        const isModule = editItem.type === 'module';
        const isSection = editItem.type === 'section';
        const handleSaveEdit = async () => {
          setIsSavingEdit(true);
          try {
            if (isModule) await courseService.updateAdminModule(editItem.data.id, editForm);
            else if (isLesson) await courseService.updateAdminLesson(editItem.data.id, editForm);
            else await courseService.updateAdminSection(editItem.data.id, editForm);
            toast.success(`${editItem.type} updated!`);
            setEditItem(null);
            // Reload course content
            if (contentCourse) {
              const { data } = await courseService.getCourse(contentCourse.id);
              setContentCourse(data);
            }
          } catch (e: any) {
            toast.error(e?.response?.data?.detail || 'Update failed');
          } finally { setIsSavingEdit(false); }
        };
        return (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-10 bg-dark-950/80 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-2xl bg-dark-900 border border-dark-800 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-dark-800">
                <h3 className="text-sm font-bold text-white capitalize flex items-center gap-2">
                  <Edit className="h-4 w-4 text-neb-400" /> Edit {editItem.type}: <span className="text-neb-300">{editItem.data.title}</span>
                </h3>
                <button onClick={() => setEditItem(null)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-dark-800 transition">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 flex flex-col gap-4">
                {/* Title */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1.5 block">Title</label>
                  <input
                    value={editForm.title || ''}
                    onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-neb-600"
                  />
                </div>

                {/* Order */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1.5 block">Order</label>
                  <input type="number"
                    value={editForm.order ?? 0}
                    onChange={e => setEditForm(f => ({ ...f, order: Number(e.target.value) }))}
                    className="w-32 bg-dark-950 border border-dark-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-neb-600"
                  />
                </div>

                {/* Lesson type */}
                {isLesson && (
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1.5 block">Lesson Type</label>
                    <select
                      value={editForm.lesson_type || 'text'}
                      onChange={e => setEditForm(f => ({ ...f, lesson_type: e.target.value }))}
                      className="bg-dark-950 border border-dark-800 text-gray-200 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-neb-600"
                    >
                      <option value="text">Text</option>
                      <option value="video">Video</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>
                )}

                {/* Video URL */}
                {isLesson && (
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1.5 block">Video URL (YouTube)</label>
                    <input
                      value={editForm.video_url || ''}
                      onChange={e => setEditForm(f => ({ ...f, video_url: e.target.value }))}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-neb-600"
                    />
                  </div>
                )}

                {/* Raw content textarea for lesson or section */}
                {(isLesson || isSection) && (
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1.5 flex items-center gap-2">
                      Content <span className="text-neb-400 normal-case font-normal">(raw Markdown / KaTeX — e.g. $E=mc^2$)</span>
                    </label>
                    <textarea
                      value={editForm.content || ''}
                      onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))}
                      rows={14}
                      className="w-full bg-dark-950 border border-dark-800 rounded-xl p-4 text-xs font-mono text-gray-200 resize-y focus:outline-none focus:border-neb-600 transition leading-relaxed"
                      spellCheck={false}
                      placeholder="Write Markdown here. Use $...$ for inline KaTeX and $$...$$ for block equations."
                    />
                    {editForm.content && (
                      <details className="mt-2">
                        <summary className="text-[10px] text-gray-500 cursor-pointer select-none hover:text-gray-300 transition">▶ Preview rendered output</summary>
                        <div className="mt-2 p-4 bg-dark-950 border border-dark-800 rounded-xl text-sm text-gray-200 prose prose-invert prose-sm max-w-none overflow-auto max-h-64">
                          <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
                            {editForm.content}
                          </ReactMarkdown>
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 p-5 border-t border-dark-800">
                <button onClick={() => setEditItem(null)} className="px-4 py-2 rounded-lg text-xs font-bold text-gray-400 hover:text-white border border-dark-800 hover:bg-dark-900 transition">
                  Cancel
                </button>
                <Button onClick={handleSaveEdit} isLoading={isSavingEdit} className="bg-neb-600 hover:bg-neb-500 text-xs py-2 px-5">
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Add Item Modal ── */}
      {addItem && (() => {
        const handleAdd = async () => {
          setIsAddingItem(true);
          try {
            if (addItem.type === 'module') {
              await courseService.createAdminModule({ ...addForm, course: addItem.courseId, order: Number(addForm.order ?? 0) });
            } else if (addItem.type === 'lesson') {
              await courseService.createAdminLesson({ ...addForm, module: addItem.parentId, order: Number(addForm.order ?? 0), lesson_type: addForm.lesson_type || 'text' });
            } else {
              await courseService.createAdminSection({ ...addForm, lesson: addItem.parentId, order: Number(addForm.order ?? 0) });
            }
            toast.success(`${addItem.type} created!`);
            setAddItem(null);
            setAddForm({});
            if (contentCourse) {
              const { data } = await courseService.getCourse(contentCourse.id);
              setContentCourse(data);
            }
          } catch (e: any) {
            toast.error(e?.response?.data?.detail || 'Create failed');
          } finally { setIsAddingItem(false); }
        };
        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-dark-900 border border-dark-800 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-dark-800">
                <h3 className="text-sm font-bold text-white capitalize flex items-center gap-2">
                  <Plus className="h-4 w-4 text-neb-400" /> New {addItem.type}
                </h3>
                <button onClick={() => { setAddItem(null); setAddForm({}); }} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-dark-800 transition">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1.5 block">Title</label>
                  <input value={addForm.title || ''} onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-neb-600" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1.5 block">Order</label>
                  <input type="number" value={addForm.order ?? 0} onChange={e => setAddForm(f => ({ ...f, order: e.target.value }))}
                    className="w-32 bg-dark-950 border border-dark-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-neb-600" />
                </div>
                {addItem.type === 'lesson' && (
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1.5 block">Type</label>
                    <select value={addForm.lesson_type || 'text'} onChange={e => setAddForm(f => ({ ...f, lesson_type: e.target.value }))}
                      className="bg-dark-950 border border-dark-800 text-gray-200 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-neb-600">
                      <option value="text">Text</option><option value="video">Video</option><option value="mixed">Mixed</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 p-5 border-t border-dark-800">
                <button onClick={() => { setAddItem(null); setAddForm({}); }} className="px-4 py-2 rounded-lg text-xs font-bold text-gray-400 hover:text-white border border-dark-800 hover:bg-dark-900 transition">Cancel</button>
                <Button onClick={handleAdd} isLoading={isAddingItem} disabled={!addForm.title} className="bg-neb-600 hover:bg-neb-500 text-xs py-2 px-5">Create</Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (() => {
        const handleDelete = async () => {
          setIsDeletingItem(true);
          try {
            if (deleteConfirm.type === 'module') await courseService.deleteAdminModule(deleteConfirm.id);
            else if (deleteConfirm.type === 'lesson') await courseService.deleteAdminLesson(deleteConfirm.id);
            else await courseService.deleteAdminSection(deleteConfirm.id);
            toast.success(`${deleteConfirm.type} deleted`);
            setDeleteConfirm(null);
            if (contentCourse) {
              const { data } = await courseService.getCourse(contentCourse.id);
              setContentCourse(data);
            }
          } catch (e: any) {
            toast.error(e?.response?.data?.detail || 'Delete failed');
          } finally { setIsDeletingItem(false); }
        };
        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-dark-900 border border-red-900/30 rounded-2xl shadow-2xl p-6 text-center">
              <Trash2 className="h-10 w-10 text-red-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">Delete {deleteConfirm.type}?</h3>
              <p className="text-xs text-gray-400 mb-6">This will permanently remove this {deleteConfirm.type} and all its nested content. This action cannot be undone.</p>
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="px-5 py-2 rounded-lg text-xs font-bold text-gray-400 hover:text-white border border-dark-800 hover:bg-dark-900 transition">Cancel</button>
                <Button onClick={handleDelete} isLoading={isDeletingItem} className="bg-red-700 hover:bg-red-600 text-xs py-2 px-5">Delete</Button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
