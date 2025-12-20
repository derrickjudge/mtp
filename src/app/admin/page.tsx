import { redirect } from 'next/navigation';

/**
 * Admin root page - redirects to dashboard
 * 
 * This ensures /admin doesn't 404 and takes users to the main admin dashboard.
 */
export default function AdminPage() {
  redirect('/admin/dashboard');
}

