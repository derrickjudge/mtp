import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the project root
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Anon Key exists:', !!anonKey);
console.log('Service Key exists:', !!serviceRoleKey);

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  console.error('Missing required environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

// Validate Supabase URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.error('Invalid Supabase URL format. URL should be in the format: https://<project>.supabase.co');
  process.exit(1);
}

// Create two Supabase clients
const authClient = createClient(supabaseUrl, anonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create readline interface for password input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to get hidden password input
function getHiddenPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    stdin.setRawMode(true);
    stdin.resume();
    stdout.write(prompt);

    let password = '';
    stdin.on('data', (key) => {
      const char = key.toString();
      
      // Handle Ctrl+C
      if (char === '\u0003') {
        process.exit();
      }
      
      // Handle Enter key
      if (char === '\r' || char === '\n') {
        stdin.setRawMode(false);
        stdin.pause();
        stdout.write('\n');
        resolve(password);
      }
      
      // Handle backspace
      if (char === '\u0008' || char === '\u007F') {
        if (password.length > 0) {
          password = password.slice(0, -1);
          stdout.write('\b \b');
        }
      } else if (char.length === 1) { // Only process single characters
        // Add character to password and show asterisk
        password += char;
        stdout.write('*');
      }
    });
  });
}

async function setupAdminRole(email: string) {
  try {
    // Get password from user (hidden)
    const password = await getHiddenPassword('Please enter your password: ');

    // Use anon client to sign in
    const { data: { user }, error: signInError } = await authClient.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      console.error('Error signing in:', signInError.message);
      process.exit(1);
    }

    if (!user) {
      console.error('User not found');
      process.exit(1);
    }

    console.log('User authenticated, assigning admin role...');

    // Use admin client to check/assign admin role
    const { data: existingRole, error: checkError } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing role:', checkError.message);
      process.exit(1);
    }

    if (existingRole) {
      console.log('\n✅ User already has admin role. You can now access the admin interface.');
      return;
    }

    // Insert admin role for user using the service role client
    const { error: roleError } = await adminClient
      .from('user_roles')
      .insert([
        { user_id: user.id, role: 'admin' }
      ])
      .select();

    if (roleError) {
      console.error('Error setting admin role:', roleError.message);
      process.exit(1);
    }

    console.log('\n✅ Successfully set admin role. You can now access the admin interface.');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Get email from command line arguments
const email = process.argv[2];
if (!email) {
  console.error('Please provide an email address');
  process.exit(1);
}

setupAdminRole(email); 