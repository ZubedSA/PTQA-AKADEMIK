import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    Home,
    Circle,
    BookOpen,
    PenLine,
    FileText,
    BookMarked,
    CalendarCheck,
    Calendar,
    Download,
    ClipboardList,
    LogOut,
    X,
    Settings,
    UserCircle,
    Activity,
    Wallet,
    ChevronDown,
    ChevronRight,
    ArrowUpCircle,
    ArrowDownCircle,
    Receipt,
    CreditCard,
    Tag,
    FileBarChart,
    PiggyBank,
    CheckCircle,
    TrendingUp,
    Database,
    School
} from 'lucide-react'
import './Sidebar.css'

// Menu items dengan role yang diizinkan
// roles: ['admin', 'guru', 'wali'] - jika undefined/kosong = semua role
const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'guru'] },

    // Data Pondok Menu dengan Nested Submenu
    {
        id: 'data-pondok',
        icon: Database,
        label: 'Data Pondok',
        roles: ['admin', 'guru'],
        children: [
            { path: '/santri', icon: Users, label: 'Data Santri', roles: ['admin'] },
            { path: '/guru', icon: GraduationCap, label: 'Data Guru', roles: ['admin'] },
            { path: '/kelas', icon: Home, label: 'Kelas', roles: ['admin'] },
            { path: '/mapel', icon: BookOpen, label: 'Mapel', roles: ['admin'] },
            { path: '/halaqoh', icon: Circle, label: 'Halaqoh', roles: ['admin', 'guru'] },
        ]
    },

    // Akademik Menu dengan Nested Submenu
    {
        id: 'akademik',
        icon: School,
        label: 'Akademik',
        roles: ['admin', 'guru'],
        children: [
            { path: '/input-nilai', icon: PenLine, label: 'Input Nilai', roles: ['admin', 'guru'] },
            { path: '/rekap-nilai', icon: FileText, label: 'Rekap Nilai', roles: ['admin', 'guru'] },
            { path: '/hafalan', icon: BookMarked, label: 'Hafalan', roles: ['admin', 'guru'] },
            { path: '/presensi', icon: CalendarCheck, label: 'Pembinaan Santri', roles: ['admin', 'guru'] },
            { path: '/semester', icon: Calendar, label: 'Semester', roles: ['admin'] },
            { path: '/laporan', icon: Download, label: 'Laporan', roles: ['admin', 'guru'] },
        ]
    },

    // Keuangan Menu dengan Nested Submenu
    {
        id: 'keuangan',
        icon: Wallet,
        label: 'Keuangan',
        roles: ['admin', 'bendahara', 'pengasuh'],
        children: [
            {
                id: 'alur-kas',
                icon: PiggyBank,
                label: 'Alur KAS',
                children: [
                    { path: '/keuangan/kas/pemasukan', icon: ArrowUpCircle, label: 'Pemasukan' },
                    { path: '/keuangan/kas/pengeluaran', icon: ArrowDownCircle, label: 'Pengeluaran' },
                    { path: '/keuangan/kas/laporan', icon: FileBarChart, label: 'Laporan Kas' },
                ]
            },
            {
                id: 'pembayaran',
                icon: CreditCard,
                label: 'Pembayaran',
                children: [
                    { path: '/keuangan/pembayaran/tagihan', icon: Receipt, label: 'Tagihan Santri' },
                    { path: '/keuangan/pembayaran/kategori', icon: Tag, label: 'Kategori' },
                    { path: '/keuangan/pembayaran/bayar', icon: CreditCard, label: 'Pembayaran Santri' },
                    { path: '/keuangan/pembayaran/laporan', icon: FileBarChart, label: 'Laporan Pembayaran' },
                ]
            },
            {
                id: 'penyaluran',
                icon: TrendingUp,
                label: 'Penyaluran Dana',
                children: [
                    { path: '/keuangan/dana/anggaran', icon: PiggyBank, label: 'Anggaran' },
                    { path: '/keuangan/dana/persetujuan', icon: CheckCircle, label: 'Persetujuan' },
                    { path: '/keuangan/dana/realisasi', icon: TrendingUp, label: 'Realisasi Dana' },
                    { path: '/keuangan/dana/laporan', icon: FileBarChart, label: 'Laporan Penyaluran' },
                ]
            }
        ]
    },
    { path: '/wali-santri', icon: UserCircle, label: 'Portal Wali', roles: ['admin', 'guru', 'wali'] },
    { path: '/audit-log', icon: ClipboardList, label: 'Audit Log', roles: ['admin'] },
    { path: '/system-status', icon: Activity, label: 'Status Sistem', roles: ['admin'] },
    { path: '/pengaturan', icon: Settings, label: 'Pengaturan', roles: ['admin'] },
]

const Sidebar = ({ mobileOpen, onClose }) => {
    const { signOut, role } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [openMenus, setOpenMenus] = useState({})

    // Filter menu berdasarkan role user
    const filteredMenuItems = menuItems.filter(item => {
        if (!item.roles || item.roles.length === 0) return true
        return item.roles.includes(role)
    })

    const handleLogout = async () => {
        try {
            await signOut()
        } catch (error) {
            console.log('Logout notice:', error.message)
        }
        navigate('/login')
    }

    const handleNavClick = () => {
        if (onClose) onClose()
    }

    // Get all top-level menu IDs
    const topLevelMenuIds = ['data-pondok', 'akademik', 'keuangan']

    // Get nested submenu IDs (children of keuangan)
    const nestedSubmenuIds = ['alur-kas', 'pembayaran', 'penyaluran']

    const toggleMenu = (menuId) => {
        setOpenMenus(prev => {
            const isCurrentlyOpen = prev[menuId]

            // If closing, just close it
            if (isCurrentlyOpen) {
                return {
                    ...prev,
                    [menuId]: false
                }
            }

            // Check if this is a top-level menu
            const isTopLevel = topLevelMenuIds.includes(menuId)

            // Check if this is a nested submenu (inside keuangan)
            const isNestedSubmenu = nestedSubmenuIds.includes(menuId)

            if (isTopLevel) {
                // Close all other top-level menus AND their nested children
                const newState = {}
                Object.keys(prev).forEach(key => {
                    // Close other top-level menus
                    if (topLevelMenuIds.includes(key)) {
                        newState[key] = false
                    }
                    // Close all nested submenus when switching top-level
                    if (nestedSubmenuIds.includes(key)) {
                        newState[key] = false
                    }
                })
                newState[menuId] = true
                return newState
            }

            if (isNestedSubmenu) {
                // Close only other nested submenus, keep parent open
                const newState = { ...prev }
                nestedSubmenuIds.forEach(key => {
                    if (key !== menuId) {
                        newState[key] = false
                    }
                })
                newState[menuId] = true
                return newState
            }

            // Default: just toggle
            return {
                ...prev,
                [menuId]: true
            }
        })
    }

    // Check if any child path is active
    const isChildActive = (children) => {
        if (!children) return false
        return children.some(child => {
            if (child.path) {
                return location.pathname === child.path || location.pathname.startsWith(child.path + '/')
            }
            if (child.children) {
                return isChildActive(child.children)
            }
            return false
        })
    }

    // Render submenu item
    const renderMenuItem = (item, level = 0) => {
        const hasChildren = item.children && item.children.length > 0
        const isOpen = openMenus[item.id] || isChildActive(item.children)
        const paddingLeft = 14 + (level * 12)

        if (hasChildren) {
            return (
                <li key={item.id} className="nav-item has-submenu">
                    <button
                        className={`nav-link submenu-toggle ${isOpen ? 'open' : ''} ${isChildActive(item.children) ? 'active' : ''}`}
                        onClick={() => toggleMenu(item.id)}
                        style={{ paddingLeft: `${paddingLeft}px` }}
                    >
                        <span className="nav-icon">
                            <item.icon size={level === 0 ? 20 : 16} />
                        </span>
                        <span className="nav-text">{item.label}</span>
                        <span className="submenu-arrow">
                            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </span>
                    </button>
                    <ul className={`submenu ${isOpen ? 'open' : ''}`}>
                        {item.children.map(child => renderMenuItem(child, level + 1))}
                    </ul>
                </li>
            )
        }

        return (
            <li key={item.path} className="nav-item">
                <NavLink
                    to={item.path}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={handleNavClick}
                    style={{ paddingLeft: `${paddingLeft}px` }}
                >
                    <span className="nav-icon">
                        <item.icon size={level === 0 ? 20 : 16} />
                    </span>
                    <span className="nav-text">{item.label}</span>
                </NavLink>
            </li>
        )
    }

    const sidebarStyle = {
        transform: mobileOpen ? 'translateX(0)' : undefined
    }

    return (
        <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`} style={sidebarStyle}>
            <div className="sidebar-header">
                <div className="logo">
                    <img src="/logo-white.png" alt="Logo" className="logo-image" />
                    <div className="logo-text">
                        <span className="logo-title">PTQA BATUAN</span>
                        <span className="logo-subtitle">Sistem Akademik</span>
                    </div>
                </div>
                <button className="sidebar-close-btn" onClick={onClose}>
                    <X size={24} />
                </button>
            </div>

            <nav className="sidebar-nav">
                <ul className="nav-list">
                    {filteredMenuItems.map((item) => renderMenuItem(item))}
                </ul>
            </nav>

            <div className="sidebar-footer">
                <button className="nav-link logout-link" onClick={handleLogout}>
                    <span className="nav-icon">
                        <LogOut size={20} />
                    </span>
                    <span className="nav-text">Keluar</span>
                </button>
            </div>
        </aside>
    )
}

export default Sidebar
