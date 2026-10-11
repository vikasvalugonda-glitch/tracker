import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SpendPulse - Daily Spending & Instant Budget Tracker',
  description: 'Production-ready daily spending and budget tracker with immediate real-time feedback, threshold alerts, and rollover analytics.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      <head>
        <script
          id="theme-initializer"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const saved = localStorage.getItem('tracker_theme');
                  const isLight = saved === 'light';
                  if (isLight) {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                    document.documentElement.setAttribute('data-theme', 'light');
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                    document.documentElement.setAttribute('data-theme', 'dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased selection:bg-indigo-500/30 selection:text-indigo-300">
        <Toaster 
          richColors 
          position="top-right" 
          closeButton 
          toastOptions={{
            style: {
              background: 'var(--card-bg, #09090b)',
              border: '1px solid var(--card-border, rgba(255, 255, 255, 0.12))',
              color: 'var(--foreground, #f8fafc)',
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
