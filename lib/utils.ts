import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number | string) {
  return new Intl.NumberFormat('fr-CM', {
    style: 'currency', currency: 'XAF', minimumFractionDigits: 0,
  }).format(Number(amount));
}

export function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as any).response?.data;
    if (data?.detail) return data.detail;
    const key = Object.keys(data || {})[0];
    if (key) return Array.isArray(data[key]) ? data[key][0] : data[key];
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred.';
}
