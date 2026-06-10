export interface User {
  id: string; email: string; full_name: string;
  avatar?: string; is_verified: boolean; created_at: string;
  is_subscribed: boolean; subscription_expires_at?: string;
  lab_access_days: string[]; is_staff: boolean; is_superuser: boolean;
}
export interface FileNode {
  id: string; name: string; node_type: 'file' | 'folder';
  parent: string | null; content: string; language: string;
  children: FileNode[]; created_at: string; updated_at: string;
}
export interface Course {
  id: string; title: string; description: string;
  thumbnail?: string; price: number; is_free: boolean; category: 'mysql' | 'programming' | 'others';
  module_count?: number; modules?: Module[]; locked?: boolean;
}
export interface Module {
  id: string; title: string; order: number; lessons: LessonSummary[];
}
export interface LessonSummary {
  id: string; title: string; lesson_type: string; order: number; has_exercise: boolean;
}
export interface Section {
  id: string; title: string; content: string; order: number;
}
export interface Lesson extends LessonSummary {
  content: string; video_url?: string; images?: string[]; content_format: string;
  sections?: Section[]; exercises: Exercise[];
}
export interface Exercise {
  id: string; question: string; exercise_type: 'c' | 'mysql';
  starter_code: string; order: number; answer?: Answer;
}
export interface Answer { correct_code: string; explanation: string; }
export interface Purchase {
  id: string; course_id: string; course_title: string;
  course_price: number; status: string; created_at: string;
}
export interface ExecutionResult {
  stdout: string; stderr: string; exit_code: number;
  timed_out: boolean; success: boolean;
}
export interface Subscription {
  id: string; status: string; amount: number; expires_at?: string; created_at: string;
}
