import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '../.env.local');
console.log('Loading environment variables from:', envPath);
dotenv.config({ path: envPath });

// Debug: Print all environment variables (excluding sensitive ones)
console.log('Environment variables loaded:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  if (!supabaseUrl) console.error('- NEXT_PUBLIC_SUPABASE_URL is missing');
  if (!supabaseServiceKey) console.error('- SUPABASE_SERVICE_ROLE_KEY is missing');
  process.exit(1);
}

// Validate Supabase URL format
if (!supabaseUrl.startsWith('https://')) {
  console.error('Invalid Supabase URL format. It should start with https://');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupAdmin() {
  // Get email and password from command line arguments
  const args = process.argv.slice(2);
  console.log('Command line arguments:', args);

  // Parse arguments
  const emailArg = args.find(arg => arg.startsWith('--email='));
  const passwordArg = args.find(arg => arg.startsWith('--password='));

  if (!emailArg || !passwordArg) {
    console.error('Please provide both email and password:');
    console.error('npm run setup-admin -- --email=your@email.com --password=yourpassword');
    process.exit(1);
  }

  const adminEmail = emailArg.split('=')[1];
  const adminPassword = passwordArg.split('=')[1];

  if (!adminEmail || !adminPassword) {
    console.error('Email and password are required');
    process.exit(1);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(adminEmail)) {
    console.error('Invalid email format');
    process.exit(1);
  }

  // Validate password length
  if (adminPassword.length < 6) {
    console.error('Password must be at least 6 characters long');
    process.exit(1);
  }

  console.log('Setting up admin with:');
  console.log('Email:', adminEmail);
  console.log('Password length:', adminPassword.length);

  try {
    // Test Supabase connection
    console.log('Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase.from('user_roles').select('count').limit(1);
    if (testError) {
      console.error('Failed to connect to Supabase:', testError);
      process.exit(1);
    }
    console.log('Supabase connection successful');

    // Check if user already exists
    console.log('Checking for existing user...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      throw listError;
    }

    const existingUser = users?.find(user => user.email === adminEmail);
    let userId: string;

    if (existingUser) {
      console.log('Admin user already exists, updating password...');
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: adminPassword }
      );
      if (updateError) {
        console.error('Error updating user:', updateError);
        throw updateError;
      }
      userId = existingUser.id;
    } else {
      console.log('Creating new admin user...');
      const { data: user, error: userError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
      });

      if (userError) {
        console.error('Error creating user:', userError);
        throw userError;
      }
      userId = user.user.id;
    }

    // Assign admin role to user
    console.log('Assigning admin role to user...');
    const { error: userRoleError } = await supabase
      .from('user_roles')
      .upsert([
        {
          user_id: userId,
          role: 'admin',
        },
      ]);

    if (userRoleError) {
      console.error('Error assigning admin role:', userRoleError);
      throw userRoleError;
    }

    console.log('Admin setup completed successfully!');
    console.log('You can now log in with:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
  } catch (error) {
    console.error('Error setting up admin:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
}

setupAdmin(); 