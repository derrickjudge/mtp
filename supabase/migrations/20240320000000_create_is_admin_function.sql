-- Create a function to check if a user has admin role
create or replace function is_admin(user_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1
    from user_roles
    where user_id = $1
    and role = 'admin'
  );
end;
$$; 