import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the project root
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAdminStatus(email: string) {
  try {
    // First, get the user ID from auth.users
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching users:', userError.message);
      process.exit(1);
    }

    const user = users.find(u => u.email === email);
    if (!user) {
      console.error('User not found');
      process.exit(1);
    }

    console.log('Found user:', { id: user.id, email: user.email });

    // Check if user has admin role
    const { data: roles, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .eq('role', 'admin');

    if (roleError) {
      console.error('Error checking roles:', roleError.message);
      process.exit(1);
    }

    console.log('\nAdmin role status:');
    if (roles && roles.length > 0) {
      console.log('✅ User has admin role');
      console.log('Role details:', roles[0]);
    } else {
      console.log('❌ User does not have admin role');
    }

    // Check if admin role exists in roles table
    const { data: adminRole, error: adminRoleError } = await supabase
      .from('roles')
      .select('*')
      .eq('name', 'admin')
      .single();

    if (adminRoleError) {
      console.error('Error checking admin role:', adminRoleError.message);
      process.exit(1);
    }

    console.log('\nAdmin role in roles table:');
    if (adminRole) {
      console.log('✅ Admin role exists');
      console.log('Role details:', adminRole);
    } else {
      console.log('❌ Admin role does not exist');
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];
if (!email) {
  console.error('Please provide an email address');
  process.exit(1);
}

checkAdminStatus(email); 