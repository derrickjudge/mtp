-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Roles are viewable by authenticated users" ON roles;
DROP POLICY IF EXISTS "Only admins can modify roles" ON roles;
DROP POLICY IF EXISTS "User roles are viewable by authenticated users" ON user_roles;
DROP POLICY IF EXISTS "Only admins can modify user roles" ON user_roles;
DROP POLICY IF EXISTS "Service role has full access to user_roles" ON user_roles;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS roles;

-- Create roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL REFERENCES roles(name) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Grant permissions to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON roles TO authenticated;
GRANT ALL ON user_roles TO authenticated;
GRANT USAGE ON SCHEMA auth TO authenticated;

-- Grant permissions to service_role
GRANT ALL ON roles TO service_role;
GRANT ALL ON user_roles TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA auth TO service_role;

-- Enable Row Level Security
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for roles table
CREATE POLICY "Roles are viewable by authenticated users"
ON roles FOR SELECT
TO authenticated
USING (true);

-- Create policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create policy to allow service role full access to user_roles
CREATE POLICY "Service role has full access to user_roles"
ON user_roles
TO service_role
USING (true)
WITH CHECK (true);

-- Create admin role if it doesn't exist
INSERT INTO roles (name, description)
VALUES ('admin', 'Administrator with full access')
ON CONFLICT (name) DO NOTHING;

-- Create function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = $1
        AND user_roles.role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin TO service_role; 