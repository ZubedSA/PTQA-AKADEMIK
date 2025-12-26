import { useState, useEffect } from 'react'
import {
    Shield,
    Users,
    Eye,
    Check,
    X,
    Info,
    Lock,
    ExternalLink
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import './RolesPage.css'

/**
 * Roles & Access Management Page - Admin Only
 * View and manage role permissions
 */

// Predefined roles configuration
const rolesBaseConfig = [
    {
        id: 'admin',
        name: 'Administrator',
        description: 'Kontrol penuh sistem, audit, dan manajemen user',
        color: '#ef4444',
        permissions: ['all'],
        isSystem: true
    },
    {
        id: 'guru',
        name: 'Guru/Akademik',
        description: 'Operator akademik - input nilai, hafalan, presensi',
        color: '#3b82f6',
        permissions: ['akademik.read', 'akademik.write', 'santri.read', 'hafalan.read', 'hafalan.write', 'nilai.read', 'nilai.write', 'presensi.read', 'presensi.write'],
        isSystem: true
    },
    {
        id: 'bendahara',
        name: 'Bendahara',
        description: 'Operator keuangan - kas, pembayaran, penyaluran dana',
        color: '#10b981',
        permissions: ['keuangan.read', 'keuangan.write', 'kas.read', 'kas.write', 'pembayaran.read', 'pembayaran.write', 'penyaluran.read', 'penyaluran.write'],
        isSystem: true
    },
    {
        id: 'pengasuh',
        name: 'Pengasuh',
        description: 'Akses keuangan terbatas',
        color: '#10b981',
        permissions: ['keuangan.read', 'kas.read', 'pembayaran.read'],
        isSystem: true
    },
    {
        id: 'wali',
        name: 'Wali Santri',
        description: 'Read-only akses data anak',
        color: '#8b5cf6',
        permissions: ['santri.read', 'nilai.read', 'hafalan.read', 'presensi.read', 'pembayaran.read'],
        isSystem: true
    }
]

// Permission modules
const permissionModules = [
    { id: 'santri', label: 'Data Santri', permissions: ['read', 'write', 'delete'] },
    { id: 'guru', label: 'Data Guru', permissions: ['read', 'write', 'delete'] },
    { id: 'akademik', label: 'Akademik', permissions: ['read', 'write'] },
    { id: 'nilai', label: 'Nilai', permissions: ['read', 'write'] },
    { id: 'hafalan', label: 'Hafalan', permissions: ['read', 'write'] },
    { id: 'presensi', label: 'Presensi', permissions: ['read', 'write'] },
    { id: 'keuangan', label: 'Keuangan', permissions: ['read', 'write'] },
    { id: 'kas', label: 'Kas', permissions: ['read', 'write'] },
    { id: 'pembayaran', label: 'Pembayaran', permissions: ['read', 'write'] },
    { id: 'penyaluran', label: 'Penyaluran Dana', permissions: ['read', 'write'] },
    { id: 'laporan', label: 'Laporan', permissions: ['read', 'export'] },
    { id: 'settings', label: 'Pengaturan', permissions: ['read', 'write'] }
]

const RolesPage = () => {
    const navigate = useNavigate()
    const [selectedRole, setSelectedRole] = useState(null)
    const [roles, setRoles] = useState(rolesBaseConfig.map(r => ({ ...r, userCount: 0 })))
    const [loading, setLoading] = useState(true)

    // Fetch user counts per role
    useEffect(() => {
        fetchUserCounts()
    }, [])

    const fetchUserCounts = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('role')

            if (error) throw error

            // Count users per role
            const counts = {}
            data?.forEach(user => {
                const role = user.role || 'wali'
                counts[role] = (counts[role] || 0) + 1
            })

            // Update roles with counts
            setRoles(rolesBaseConfig.map(r => ({
                ...r,
                userCount: counts[r.id] || 0
            })))
        } catch (error) {
            console.error('Error fetching user counts:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const hasPermission = (role, module, action) => {
        if (role.permissions.includes('all')) return true
        return role.permissions.includes(`${module}.${action}`)
    }

    const handleManageUsers = (roleId) => {
        navigate(`/users?role=${roleId}`)
    }

    return (
        <div className="roles-page">
            {/* Header */}
            <div className="page-header">
                <div className="header-info">
                    <h1><Shield size={28} /> Roles & Akses</h1>
                    <p>Kelola role dan hak akses pengguna</p>
                </div>
            </div>

            {/* Info Banner */}
            <div className="info-banner">
                <Info size={20} />
                <div>
                    <strong>Role Sistem</strong>
                    <p>Role berikut adalah role bawaan sistem. Klik card untuk melihat detail hak akses.</p>
                </div>
            </div>

            {/* Roles Grid */}
            <div className="roles-grid">
                {roles.map(role => (
                    <div
                        key={role.id}
                        className={`role-card ${selectedRole?.id === role.id ? 'selected' : ''}`}
                        onClick={() => setSelectedRole(role)}
                        style={{ '--role-color': role.color }}
                    >
                        <div className="role-card-header">
                            <div className="role-icon">
                                <Shield size={24} />
                            </div>
                            <div className="role-info">
                                <h3>{role.name}</h3>
                                <p>{role.description}</p>
                            </div>
                        </div>
                        <div className="role-card-footer">
                            <button
                                className="role-stat clickable"
                                onClick={(e) => { e.stopPropagation(); handleManageUsers(role.id); }}
                            >
                                <Users size={14} />
                                <span>{loading ? '...' : role.userCount} users</span>
                                <ExternalLink size={12} />
                            </button>
                            {role.isSystem && (
                                <span className="system-badge">
                                    <Lock size={12} /> Sistem
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Permission Matrix */}
            {selectedRole && (
                <div className="permission-section">
                    <div className="section-header">
                        <h2>
                            <Eye size={20} />
                            Hak Akses: {selectedRole.name}
                        </h2>
                    </div>

                    <div className="permission-matrix">
                        <table>
                            <thead>
                                <tr>
                                    <th>Modul</th>
                                    <th>Lihat</th>
                                    <th>Tambah/Edit</th>
                                    <th>Hapus/Export</th>
                                </tr>
                            </thead>
                            <tbody>
                                {permissionModules.map(module => (
                                    <tr key={module.id}>
                                        <td className="module-name">{module.label}</td>
                                        {module.permissions.map((perm) => (
                                            <td key={perm} className="permission-cell">
                                                {hasPermission(selectedRole, module.id, perm) ? (
                                                    <span className="perm-yes"><Check size={16} /></span>
                                                ) : (
                                                    <span className="perm-no"><X size={16} /></span>
                                                )}
                                            </td>
                                        ))}
                                        {module.permissions.length < 3 && (
                                            <td className="permission-cell">
                                                <span className="perm-na">-</span>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Role Comparison */}
            <div className="comparison-section">
                <div className="section-header">
                    <h2><Shield size={20} /> Perbandingan Role</h2>
                </div>
                <div className="comparison-table-wrapper">
                    <table className="comparison-table">
                        <thead>
                            <tr>
                                <th>Fitur</th>
                                {roles.map(r => (
                                    <th key={r.id} style={{ color: r.color }}>{r.name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Dashboard</td>
                                {roles.map(r => <td key={r.id}><Check size={14} className="check" /></td>)}
                            </tr>
                            <tr>
                                <td>Kelola User</td>
                                <td><Check size={14} className="check" /></td>
                                <td><X size={14} className="cross" /></td>
                                <td><X size={14} className="cross" /></td>
                                <td><X size={14} className="cross" /></td>
                                <td><X size={14} className="cross" /></td>
                            </tr>
                            <tr>
                                <td>Input Akademik</td>
                                <td><Check size={14} className="check" /></td>
                                <td><Check size={14} className="check" /></td>
                                <td><X size={14} className="cross" /></td>
                                <td><X size={14} className="cross" /></td>
                                <td><X size={14} className="cross" /></td>
                            </tr>
                            <tr>
                                <td>Input Keuangan</td>
                                <td><Check size={14} className="check" /></td>
                                <td><X size={14} className="cross" /></td>
                                <td><Check size={14} className="check" /></td>
                                <td><X size={14} className="cross" /></td>
                                <td><X size={14} className="cross" /></td>
                            </tr>
                            <tr>
                                <td>Lihat Laporan</td>
                                <td><Check size={14} className="check" /></td>
                                <td><Check size={14} className="check" /></td>
                                <td><Check size={14} className="check" /></td>
                                <td><Check size={14} className="check" /></td>
                                <td><Check size={14} className="check" /></td>
                            </tr>
                            <tr>
                                <td>Pengaturan</td>
                                <td><Check size={14} className="check" /></td>
                                <td><X size={14} className="cross" /></td>
                                <td><X size={14} className="cross" /></td>
                                <td><X size={14} className="cross" /></td>
                                <td><X size={14} className="cross" /></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default RolesPage
