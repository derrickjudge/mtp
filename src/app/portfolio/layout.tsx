import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portfolio',
  description: 'Browse our photography portfolio showcasing sports, music, and street photography. Filter by category to explore our curated collections.',
  openGraph: {
    title: 'Portfolio | MTP Collective',
    description: 'Browse our photography portfolio showcasing sports, music, and street photography.',
  },
};

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

