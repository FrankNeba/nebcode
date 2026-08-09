import { Metadata } from 'next';
import CoursesPageClient from './courses-client';

export const metadata: Metadata = {
  title: 'Programming & Database Courses — Learn C & MySQL on Mobile',
  description: 'Explore interactive courses on C programming and MySQL databases. Learn coding step-by-step with live compilers, instant code execution, and practice problems designed for Cameroon students.',
  alternates: {
    canonical: '/courses',
  },
  openGraph: {
    title: 'Nebcode Courses — Master C and MySQL Databases',
    description: 'Learn C and MySQL with structured lessons, live compiler sandboxes, and hands-on exercises.',
    url: 'https://nebcode.ngwafrank.com/courses',
    type: 'website',
  },
};

export default function CoursesPage() {
  return <CoursesPageClient />;
}
