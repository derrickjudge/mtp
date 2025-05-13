import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'inter',
    variable: '--font-inter',
  }),
  Instrument_Sans: () => ({
    className: 'instrument-sans',
    variable: '--font-instrument',
  }),
}));
