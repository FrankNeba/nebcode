import type { Metadata } from 'next';
import AccessLabClient from './access-lab-client';

export const metadata: Metadata = {
  title: 'Microsoft Access Database Lab — Design View, Relationships, Queries & GCE Practicals',
  description:
    'Interactive web-based Microsoft Access database practice environment on Nebcode. Create tables, configure Primary Keys, set Validation Rules and constraints in Table Design View, enforce Referential Integrity relationships, and execute Access SQL queries for Cameroon GCE Computer Science and ICT exams.',
  alternates: {
    canonical: 'https://nebcode.com/access-lab',
  },
};

export default function AccessLabPage() {
  return <AccessLabClient />;
}
