import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { initializeTheme } from '@/lib/theme';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OpenAI Chat Interface',
  description: 'A modern chat interface for OpenAI API',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'system';
                  var root = document.documentElement;
                  root.classList.remove('light', 'dark');
                  
                  if (theme === 'system') {
                    var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    root.classList.add(systemTheme);
                  } else {
                    root.classList.add(theme);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          {children}
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  ${initializeTheme.toString()};
                  initializeTheme();
                } catch (e) {}
              })();
            `,
          }}
        />
      </body>
    </html>
  );
} 