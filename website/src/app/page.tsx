import HomePage from '../components/HomePage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MTP Collective | Home',
  description: 'MTP Collective Photography - Capturing moments through a unique lens, specializing in concert, automotive, and nature photography.',
};

export default function Home() {
  return <HomePage />;
}
