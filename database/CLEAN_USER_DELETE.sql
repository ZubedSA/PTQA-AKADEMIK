-- =====================================================
-- MIGRATION: Clean User Deletion System
-- Allows Admin to fully delete a user from auth.users
-- preventing "User already registered" errors
-- =====================================================

-- 1. Create a function to delete user from auth.users
-- This must be SECURITY DEFINER to access auth schema
CREATE OR REPLACE FUNCTION delete_user_completely(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_operator_role TEXT;
    v_user_exists BOOLEAN;
BEGIN
    -- 1. Check if the operator is an admin
    -- (We check the role of the user executing this function)
    SELECT (auth.jwt() ->> 'role') INTO v_operator_role;
    
    -- ALSO check our custom role in user_profiles to be safe
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND (
            role = 'admin' 
            OR 'admin' = ANY(roles)
        )
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Unauthorized: Only admins can delete users'
        );
    END IF;

    -- 2. Check if user exists in auth.users
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
        -- Delete from auth.users 
        -- (Cascade should handle public.user_profiles, but we can be explicit if needed)
        DELETE FROM auth.users WHERE id = p_user_id;
        
        RETURN json_build_object(
            'success', true, 
            'message', 'User deleted from Auth and Public'
        );
    ELSE
        -- If user not in Auth but in Profile (Zombie Profile), delete profile manually
        IF EXISTS (SELECT 1 FROM user_profiles WHERE user_id = p_user_id) THEN
            DELETE FROM user_profiles WHERE user_id = p_user_id;
            RETURN json_build_object(
                'success', true, 
                'message', 'Zombie profile cleaned up'
            );
        END IF;

        RETURN json_build_object(
            'success', false, 
            'error', 'User not found'
        );
    END IF;

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false, 
        'error', SQLERRM
    );
END;
$$;

-- 2. Grant execute permission to authenticated users
-- (The function itself checks for admin role internally)
GRANT EXECUTE ON FUNCTION delete_user_completely(UUID) TO authenticated;

-- 3. Notify
DO $$
BEGIN
    RAISE NOTICE 'Function delete_user_completely created successfully';
END $$;
