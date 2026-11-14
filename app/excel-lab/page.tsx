import type { Metadata } from 'next';
import ExcelLabClient from './excel-lab-client';

export const metadata: Metadata = {
  title: 'Excel Spreadsheet Practice Lab — Formulas, VLOOKUP, IF, RANK & Charts',
  description:
    'Interactive mobile-first Microsoft Excel spreadsheet simulator on NebCode. Practice SUM, AVERAGE, IF, IFS, RANK, VLOOKUP, absolute references ($A$1), conditional formatting, and charts for Cameroon GCE Computer Science and ICT.',
  alternates: {
    canonical: 'https://nebcode.com/excel-lab',
  },
};

export default function ExcelLabPage() {
  return <ExcelLabClient />;
}
