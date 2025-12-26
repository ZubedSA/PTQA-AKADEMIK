-- =====================================================
-- MIGRATION: Fix Zombie Users by Email
-- Allows Admin to delete 'stuck' users by email
-- to resolve "User already registered" errors.
-- =====================================================

CREATE OR REPLACE FUNCTION force_delete_user_by_email(p_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_admin_check BOOLEAN;
BEGIN
    -- 1. Security Check: Only Admins can run this
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND (role = 'admin' OR 'admin' = ANY(roles))
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Unauthorized'
        );
    END IF;

    -- 2. Find User ID by Email from auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = p_email;

    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'User not found in Auth system'
        );
    END IF;

    -- 3. Delete from auth.users (Cascades to profiles usually, but we force clean)
    DELETE FROM auth.users WHERE id = v_user_id;

    -- 4. Double check profile is gone
    DELETE FROM user_profiles WHERE user_id = v_user_id;

    RETURN json_build_object(
        'success', true, 
        'message', 'User deleted successfully',
        'deleted_id', v_user_id
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false, 
        'error', SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION force_delete_user_by_email(TEXT) TO authenticated;

DO $$
BEGIN
    RAISE NOTICE 'Function force_delete_user_by_email created.';
END $$;
