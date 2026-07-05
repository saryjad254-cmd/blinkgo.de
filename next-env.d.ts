import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/QueryProvider';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-cairo',
});

export const metadata: Metadata = {
  title: 'BlinkGo — لوحة الإدارة',
  description: 'منصة BlinkGo لإدارة طلبات التوصيل',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}