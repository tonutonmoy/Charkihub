import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'ChakriHub BD',
  description:
    'বাংলাদেশে সরকারি চাকরি, পরীক্ষার প্রস্তুতি, সাজেশন, প্রশ্ন ব্যাংক ও সিভি বিল্ডার',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
