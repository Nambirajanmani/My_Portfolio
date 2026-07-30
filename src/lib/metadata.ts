import { Metadata } from 'next';

export const siteMetadata: Metadata = {
  title: {
    default: 'Nambi Rajan - Full Stack Developer',
    template: '%s | Nambi Rajan',
  },
  description:
    'Web developer specializing in React, Next.js, and MERN Stack development. Building fast, scalable, and user-focused web applications.',
  keywords: [
    'Nambi Rajan',
    'Web Developer',
    'Frontend Developer',
    'Full Stack Developer',
    'Next.js',
    'React',
    'JavaScript',
    'MERN Stack',
    'Portfolio',
  ],
  authors: [
    {
      name: 'Nambi Rajan Khan',
    },
  ],
  creator: 'Nambi Rajan',
  metadataBase: new URL('https://aitezaz.xyz'),
  icons: {
    icon: '/logo.webp',
  },
  openGraph: {
    title: 'Nambi Rajan - Full Stack Developer',
    description:
      'Portfolio of Nambi Rajan, Full Stack Developer specializing in MERN stack, Next.js, and polished web experiences.',
    url: 'https://aitezaz.xyz',
    siteName: 'Nambi Rajan Portfolio',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Nambi Rajan - Full Stack Developer',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nambi Rajan - Full Stack Developer',
    description:
      'Portfolio of Nambi Rajan, Full Stack Developer specializing in MERN stack, Next.js, and polished web experiences.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

