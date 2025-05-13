import { supabase } from '@/lib/supabaseClient';

describe('Supabase Client', () => {
  it('should initialize without errors', () => {
    expect(supabase).toBeDefined();
  });

  it('should have auth methods', () => {
    expect(supabase.auth).toBeDefined();
  });

  it('should have database methods', () => {
    expect(supabase.from).toBeDefined();
  });
}); 