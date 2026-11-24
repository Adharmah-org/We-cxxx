import type { Metadata } from 'next';
import {
  Cormorant_Garamond,
  IBM_Plex_Mono,
  Noto_Sans_Devanagari,
  Noto_Serif_Devanagari,
  Plus_Jakarta_Sans,
} from 'next/font/google';
import './globals.css';
import { SiteShell } from '@/components/SiteShell';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jakarta',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
});

const notoSerifDevanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-serif-devanagari',
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600'],
  variable: '--font-noto-sans-devanagari',
});

export const metadata: Metadata = {
  title: 'TEJAS · BENIYAAZ.ROOH — Literary Archive of Tejas Purvesh Phirake',
  description:
    'Official literary archive of Indian author, poet, and Marathi playwright Tejas Purvesh Phirake: novels, three-act stage drama, multilingual poetry, poetry song studio, and studio voiceovers.',
  openGraph: {
    title: 'TEJAS · BENIYAAZ.ROOH — Literary Archive of Tejas Purvesh Phirake',
    description:
      'Novels, Marathi theatre, multilingual poetry, poetry song studio, and studio voiceovers. Some feelings leave. The words stay.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TEJAS · BENIYAAZ.ROOH — Literary Archive of Tejas Purvesh Phirake',
    description:
      'Official literary archive of Tejas Purvesh Phirake (तेजस पुर्वेश फिरके).',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${jakarta.variable} ${plexMono.variable} ${notoSerifDevanagari.variable} ${notoSansDevanagari.variable}`}
    >
      <body suppressHydrationWarning>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
