import { supabase } from '../lib/supabaseClient';

describe('Supabase Client', () => {
  it('should initialize without errors', () => {
    expect(supabase).toBeDefined();
  });
}); 