/**
 * Role-based access control middleware
 * Validates user has required role for accessing specific routes
 * 
 * Usage:
 *   router.get('/admin-only', requireRole('admin'), handler)
 *   router.get('/multi-role', requireRole('admin', 'bendahara'), handler)
 */

import { supabase } from '../config/supabase.js'

/**
 * Middleware to require specific roles for route access
 * @param {...string} allowedRoles - Roles that can access this route
 */
export const requireRole = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            // Get authorization header
            const authHeader = req.headers.authorization
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Token tidak ditemukan'
                })
            }

            const token = authHeader.split(' ')[1]

            // Verify token with Supabase
            const { data: { user }, error: authError } = await supabase.auth.getUser(token)

            if (authError || !user) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Token tidak valid atau expired'
                })
            }

            // Get user profile with roles
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('roles, active_role, role')
                .eq('user_id', user.id)
                .single()

            if (profileError || !profile) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Profile user tidak ditemukan'
                })
            }

            // Get user's roles (support both old and new format)
            const userRoles = profile.roles || [profile.role]
            const activeRole = profile.active_role || profile.role

            // Attach to request for downstream handlers
            req.user = {
                id: user.id,
                email: user.email,
                roles: userRoles,
                activeRole: activeRole
            }

            // Check if active role is in allowed roles
            if (!allowedRoles.includes(activeRole)) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: `Role '${activeRole}' tidak memiliki akses ke resource ini`,
                    requiredRoles: allowedRoles
                })
            }

            // Verify active role is one of user's assigned roles
            if (!userRoles.includes(activeRole)) {
                return res.status(403).json({
                    error: 'Invalid role',
                    message: 'Active role tidak valid untuk user ini'
                })
            }

            next()
        } catch (error) {
            console.error('Role middleware error:', error)
            return res.status(500).json({
                error: 'Server error',
                message: 'Gagal memvalidasi akses'
            })
        }
    }
}

/**
 * Middleware to require authentication only (any role)
 */
export const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Token tidak ditemukan'
            })
        }

        const token = authHeader.split(' ')[1]
        const { data: { user }, error } = await supabase.auth.getUser(token)

        if (error || !user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Token tidak valid'
            })
        }

        // Get profile
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('roles, active_role, role, nama')
            .eq('user_id', user.id)
            .single()

        req.user = {
            id: user.id,
            email: user.email,
            nama: profile?.nama,
            roles: profile?.roles || [profile?.role],
            activeRole: profile?.active_role || profile?.role
        }

        next()
    } catch (error) {
        console.error('Auth middleware error:', error)
        return res.status(500).json({
            error: 'Server error',
            message: 'Gagal memvalidasi autentikasi'
        })
    }
}

/**
 * Role constants for easy reference
 */
export const ROLES = {
    ADMIN: 'admin',
    GURU: 'guru',
    BENDAHARA: 'bendahara',
    WALI: 'wali',
    PENGASUH: 'pengasuh' // Legacy, maps to bendahara
}

/**
 * Dashboard access mapping
 */
export const DASHBOARD_ACCESS = {
    admin: ['admin'],
    akademik: ['admin', 'guru'],
    keuangan: ['admin', 'bendahara', 'pengasuh'],
    walisantri: ['admin', 'wali']
}

export default { requireRole, requireAuth, ROLES, DASHBOARD_ACCESS }
