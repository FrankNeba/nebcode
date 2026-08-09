import { Metadata } from 'next';
import MySQLLabPageClient from './mysql-lab-client';

export const metadata: Metadata = {
  title: 'Live MySQL Lab — Interactive Database Terminal in Your Browser',
  description: 'Practice SQL with a real live MySQL 8.0 database container in your browser. Run CREATE, SELECT, INSERT, and JOIN queries instantly. Perfect for Cameroon students learning MySQL.',
  alternates: {
    canonical: '/mysql-lab',
  },
  openGraph: {
    title: 'Nebcode MySQL Lab — Practice SQL in a Live Database',
    description: 'Your own persistent MySQL environment in the browser. No installation. Run real SQL and master databases fast.',
    url: 'https://nebcode.ngwafrank.com/mysql-lab',
    type: 'website',
  },
};

export default function MySQLLabPage() {
  return <MySQLLabPageClient />;
}