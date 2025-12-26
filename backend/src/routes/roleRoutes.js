/**
 * Role Management Routes
 * API endpoints for switching roles and getting user role info
 */

import express from 'express'
import { supabase } from '../config/supabase.js'
import { requireAuth } from '../middleware/roleGuard.js'

const router = express.Router()

/**
 * GET /api/roles/me
 * Get current user's roles and active role
 */
router.get('/me', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('roles, active_role, role, nama')
            .eq('user_id', req.user.id)
            .single()

        if (error) {
            return res.status(400).json({ error: error.message })
        }

        res.json({
            roles: data.roles || [data.role],
            activeRole: data.active_role || data.role,
            nama: data.nama
        })
    } catch (error) {
        console.error('Get roles error:', error)
        res.status(500).json({ error: 'Failed to get roles' })
    }
})

/**
 * POST /api/roles/switch
 * Switch user's active role
 * Body: { newRole: string }
 */
router.post('/switch', requireAuth, async (req, res) => {
    try {
        const { newRole } = req.body
        const userId = req.user.id

        if (!newRole) {
            return res.status(400).json({
                error: 'newRole is required'
            })
        }

        // Get user's available roles
        const { data: profile, error: fetchError } = await supabase
            .from('user_profiles')
            .select('roles, role')
            .eq('user_id', userId)
            .single()

        if (fetchError || !profile) {
            return res.status(404).json({
                error: 'User profile not found'
            })
        }

        const userRoles = profile.roles || [profile.role]

        // Validate user has this role
        if (!userRoles.includes(newRole)) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'User tidak memiliki role ini',
                availableRoles: userRoles
            })
        }

        // Update active role
        const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ active_role: newRole })
            .eq('user_id', userId)

        if (updateError) {
            return res.status(400).json({
                error: updateError.message
            })
        }

        res.json({
            success: true,
            activeRole: newRole,
            message: `Role berhasil diubah ke ${newRole}`
        })
    } catch (error) {
        console.error('Switch role error:', error)
        res.status(500).json({ error: 'Failed to switch role' })
    }
})

/**
 * GET /api/roles/dashboard-redirect
 * Get the appropriate dashboard URL based on active role
 */
router.get('/dashboard-redirect', requireAuth, async (req, res) => {
    const roleToPath = {
        admin: '/dashboard/admin',
        guru: '/dashboard/akademik',
        bendahara: '/dashboard/keuangan',
        pengasuh: '/dashboard/keuangan',
        wali: '/dashboard/walisantri'
    }

    const activeRole = req.user.activeRole || 'admin'
    const redirectPath = roleToPath[activeRole] || '/dashboard/admin'

    res.json({
        activeRole,
        redirectPath
    })
})

export default router
