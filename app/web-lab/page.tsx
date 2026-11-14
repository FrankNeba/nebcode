import { Metadata } from 'next';
import WebLabClient from './web-lab-client';

export const metadata: Metadata = {
  title: 'HTML, CSS & JavaScript Online Editor & Live Preview Lab',
  description:
    'Write and preview HTML5, CSS3, and JavaScript code in real time on your mobile phone or computer. Includes GCE Web Design templates and a built-in JavaScript console.',
  alternates: {
    canonical: 'https://nebcode.ngwafrank.com/web-lab',
  },
};

export default function WebLabPage() {
  return <WebLabClient />;
}
