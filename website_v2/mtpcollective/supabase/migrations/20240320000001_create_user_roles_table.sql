-- Create user_roles table if it doesn't exist
create table if not exists user_roles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, role)
);

-- Create index for faster lookups
create index if not exists user_roles_user_id_idx on user_roles(user_id);
create index if not exists user_roles_role_idx on user_roles(role);

-- Enable RLS
alter table user_roles enable row level security;

-- Create policy to allow users to read their own roles
create policy "Users can read their own roles"
  on user_roles for select
  using (auth.uid() = user_id);

-- Create policy to allow service role to manage roles
create policy "Service role can manage roles"
  on user_roles for all
  using (auth.jwt() ->> 'role' = 'service_role'); 