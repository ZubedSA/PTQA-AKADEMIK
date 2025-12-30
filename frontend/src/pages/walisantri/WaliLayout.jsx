import { Outlet } from 'react-router-dom'
import { useLayoutEffect } from 'react'
import WaliNavbar from './components/WaliNavbar'
import './WaliPortal.css'

/**
 * WaliLayout - Layout khusus untuk Portal Wali Santri
 * Tidak menggunakan sidebar admin, hanya navbar sederhana
 * Dark mode dinonaktifkan secara permanen
 */
const WaliLayout = () => {
    // Force light mode di seluruh halaman wali santri
    useLayoutEffect(() => {
        document.documentElement.setAttribute('data-theme', 'light')
        // Simpan preference agar konsisten
        localStorage.setItem('ptqa-theme', 'light')
    }, [])

    return (
        <div className="wali-layout">
            <main className="wali-main">
                <Outlet />
            </main>
            <WaliNavbar />
        </div>
    )
}

export default WaliLayout
