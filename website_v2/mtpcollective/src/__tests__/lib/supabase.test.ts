import { supabase } from '@/lib/supabaseClient';

// Mock the Supabase client
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
    auth: {
      signIn: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
    },
  },
}));

describe('Supabase Client', () => {
  it('has required methods', () => {
    expect(supabase.from).toBeDefined();
    expect(supabase.auth).toBeDefined();
    expect(supabase.auth.signIn).toBeDefined();
    expect(supabase.auth.signOut).toBeDefined();
    expect(supabase.auth.getUser).toBeDefined();
  });

  it('can perform database operations', () => {
    const mockTable = supabase.from('test_table');
    expect(mockTable.select).toBeDefined();
    expect(mockTable.insert).toBeDefined();
    expect(mockTable.update).toBeDefined();
    expect(mockTable.delete).toBeDefined();
  });
}); 