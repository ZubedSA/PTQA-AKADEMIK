import { useState, useEffect, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, UserPlus, RefreshCw } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import './Login.css'

const Login = () => {
    const navigate = useNavigate()
    const { signIn, signUp } = useAuth()

    // Force light mode on login page - useLayoutEffect runs synchronously
    useLayoutEffect(() => {
        const savedTheme = localStorage.getItem('ptqa-theme')
        document.documentElement.setAttribute('data-theme', 'light')

        // Restore theme when leaving login page
        return () => {
            if (savedTheme) {
                document.documentElement.setAttribute('data-theme', savedTheme)
            }
        }
    }, [])

    const [emailOrPhone, setEmailOrPhone] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Fungsi untuk menerjemahkan error Supabase ke bahasa Indonesia
    const translateError = (error) => {
        const errorMsg = error?.message || error || 'Terjadi kesalahan'

        // Map error messages ke bahasa Indonesia
        if (errorMsg.includes('Invalid login credentials')) {
            return 'Email/No. Telepon atau password salah. Pastikan data yang Anda masukkan benar.'
        }
        if (errorMsg.includes('Email not confirmed')) {
            return 'Email belum dikonfirmasi. Silakan cek email Anda untuk verifikasi.'
        }
        if (errorMsg.includes('User not found') || errorMsg.includes('Akun tidak ditemukan')) {
            return 'Akun dengan email/no. telepon ini tidak ditemukan.'
        }
        if (errorMsg.includes('Too many requests')) {
            return 'Terlalu banyak percobaan. Silakan tunggu beberapa saat.'
        }
        if (errorMsg.includes('Network')) {
            return 'Gagal terhubung ke server. Periksa koneksi internet Anda.'
        }

        return errorMsg
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            if (!emailOrPhone) throw new Error('Username harus diisi')
            if (!password) throw new Error('Password harus diisi')

            const { role } = await signIn(emailOrPhone, password)

            // Redirect berdasarkan role
            if (role === 'wali') {
                navigate('/wali-santri')
            } else {
                navigate('/')
            }
        } catch (err) {
            console.error('Login error:', err)
            setError(translateError(err))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                {/* Header with Logo */}
                <div className="login-header">
                    <img src="/logo.png" alt="Logo PTQ Al-Usymuni" className="login-logo" />
                    <p className="system-title">Sistem Informasi Akademik</p>
                </div>

                {/* Alerts */}
                {error && <div className="alert error">{error}</div>}


                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Username</label>
                        <input
                            type="text"
                            placeholder="Masukkan username"
                            value={emailOrPhone}
                            onChange={(e) => setEmailOrPhone(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <div className="password-field">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Masukkan password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button type="button" className="toggle-pw" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? <RefreshCw size={18} className="spin" /> : <LogIn size={18} />}
                        <span>{loading ? 'Memproses...' : 'Masuk'}</span>
                    </button>
                </form>

                {/* Footer - Copyright only now since registration is disabled */}
            </div>

            {/* Copyright */}
            <p className="copyright">© 2025 PTQA Batuan. All rights reserved.</p>
        </div>
    )
}

export default Login

