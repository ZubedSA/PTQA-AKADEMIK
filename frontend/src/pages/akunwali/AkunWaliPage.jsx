import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { createClient } from '@supabase/supabase-js'

const AkunWaliPage = () => {
    const [waliList, setWaliList] = useState([])
    const [santriList, setSantriList] = useState([])
    const [loading, setLoading] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [formMode, setFormMode] = useState('create')
    const [editingWali, setEditingWali] = useState(null)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        nama: '',
        no_telp: '',
        santri_ids: []
    })
    const [formError, setFormError] = useState('')
    const [formSuccess, setFormSuccess] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchWaliList()
        fetchSantriList()
    }, [])

    const fetchWaliList = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('role', 'wali')
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Fetch wali error:', error)
                return
            }

            const waliWithSantri = await Promise.all(
                (data || []).map(async (wali) => {
                    const { data: santriData } = await supabase
                        .from('santri')
                        .select('id, nis, nama')
                        .eq('wali_id', wali.user_id)
                    return { ...wali, santri: santriData || [] }
                })
            )
            setWaliList(waliWithSantri)
        } catch (err) {
            console.error('Error:', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchSantriList = async () => {
        try {
            const { data, error } = await supabase
                .from('santri')
                .select('id, nis, nama, wali_id, kelas:kelas_id(nama)')
                .eq('status', 'Aktif')
                .order('nama')
            if (error) {
                console.error('Fetch santri error:', error)
                return
            }
            setSantriList(data || [])
        } catch (err) {
            console.error('Error:', err)
        }
    }

    const resetForm = () => {
        setFormData({ email: '', password: '', nama: '', no_telp: '', santri_ids: [] })
        setFormError('')
        setFormSuccess('')
        setEditingWali(null)
    }

    const handleOpenCreateForm = () => {
        console.log('Opening create form')
        resetForm()
        setFormMode('create')
        setShowForm(true)
    }

    const handleOpenEditForm = (wali) => {
        console.log('Opening edit form for:', wali)
        setFormData({
            email: wali.email || '',
            password: '',
            nama: wali.nama || '',
            no_telp: wali.no_telp || '',
            santri_ids: wali.santri?.map(s => s.id) || []
        })
        setEditingWali(wali)
        setFormMode('edit')
        setShowForm(true)
    }

    const handleOpenLinkForm = (wali) => {
        console.log('Opening link form for:', wali)
        setFormData(prev => ({
            ...prev,
            santri_ids: wali.santri?.map(s => s.id) || []
        }))
        setEditingWali(wali)
        setFormMode('link')
        setShowForm(true)
    }

    const handleCloseForm = () => {
        console.log('Closing form')
        setShowForm(false)
        resetForm()
    }

    const handleCreateWali = async () => {
        console.log('Creating wali with data:', formData)
        setFormError('')
        setFormSuccess('')
        setSubmitting(true)

        try {
            // Validasi: Email atau No. Telepon wajib diisi (minimal salah satu)
            if (!formData.email && !formData.no_telp) {
                throw new Error('Email atau No. Telepon wajib diisi (minimal salah satu)')
            }

            if (!formData.nama) {
                throw new Error('Nama wali wajib diisi')
            }

            // Jika tidak ada email, generate email placeholder dari no_telp untuk auth
            let authEmail = formData.email
            if (!authEmail && formData.no_telp) {
                // Normalize phone number
                let phone = formData.no_telp.replace(/[^\d]/g, '')
                if (phone.startsWith('0')) {
                    phone = '62' + phone.substring(1)
                }
                authEmail = `${phone}@phone.local`
            }

            // Cek apakah email/phone sudah terdaftar
            const checkField = formData.email ? 'email' : 'no_telp'
            const checkValue = formData.email || formData.no_telp

            const { data: existingProfile } = await supabase
                .from('user_profiles')
                .select('id')
                .eq(checkField, checkValue)
                .maybeSingle()

            if (existingProfile) {
                throw new Error(`${formData.email ? 'Email' : 'No. Telepon'} sudah terdaftar`)
            }

            // 1. Create User in Auth using temporary client (to avoid logging out admin)
            // Default password logic: '123456' or input from form if we add it back
            const defaultPassword = formData.password || '123456'

            // Create a temporary client with the same URL and Key
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
            const tempSupabase = createClient(supabaseUrl, supabaseKey)

            const { data: authData, error: authError } = await tempSupabase.auth.signUp({
                email: authEmail,
                password: defaultPassword,
                options: {
                    data: {
                        nama: formData.nama,
                        role: 'wali'
                    }
                }
            })

            if (authError) {
                console.error('Auth error:', authError)
                throw new Error('Gagal membuat akun login: ' + authError.message)
            }

            const userId = authData.user?.id
            if (!userId) {
                throw new Error('Gagal mendapatkan User ID dari Auth')
            }

            const { error: profileError } = await supabase
                .from('user_profiles')
                .insert({
                    user_id: userId,
                    email: formData.email || null,
                    nama: formData.nama,
                    no_telp: formData.no_telp || null,
                    role: 'wali'
                })

            if (profileError) {
                console.error('Profile error:', profileError)
                throw new Error('Gagal membuat profil: ' + profileError.message)
            }

            if (formData.santri_ids.length > 0) {
                await supabase
                    .from('santri')
                    .update({ wali_id: userId })
                    .in('id', formData.santri_ids)
            }

            setFormSuccess('Profil wali berhasil dibuat!')
            fetchWaliList()
            fetchSantriList()
            setTimeout(() => handleCloseForm(), 2000)

        } catch (err) {
            console.error('Create error:', err)
            setFormError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleUpdateWali = async () => {
        console.log('Updating wali:', editingWali)
        setFormError('')
        setFormSuccess('')
        setSubmitting(true)

        try {
            if (!editingWali) return

            const { error: profileError } = await supabase
                .from('user_profiles')
                .update({ nama: formData.nama, no_telp: formData.no_telp || null })
                .eq('user_id', editingWali.user_id)

            if (profileError) throw profileError

            await supabase.from('santri').update({ wali_id: null }).eq('wali_id', editingWali.user_id)

            if (formData.santri_ids.length > 0) {
                await supabase.from('santri').update({ wali_id: editingWali.user_id }).in('id', formData.santri_ids)
            }

            setFormSuccess('Data wali berhasil diperbarui!')
            fetchWaliList()
            fetchSantriList()
            setTimeout(() => handleCloseForm(), 2000)

        } catch (err) {
            console.error('Update error:', err)
            setFormError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleLinkSantri = async () => {
        console.log('Linking santri to wali:', editingWali)
        setFormError('')
        setFormSuccess('')
        setSubmitting(true)

        try {
            if (!editingWali) return

            await supabase.from('santri').update({ wali_id: null }).eq('wali_id', editingWali.user_id)

            if (formData.santri_ids.length > 0) {
                await supabase.from('santri').update({ wali_id: editingWali.user_id }).in('id', formData.santri_ids)
            }

            setFormSuccess('Santri berhasil dihubungkan!')
            fetchWaliList()
            fetchSantriList()
            setTimeout(() => handleCloseForm(), 1500)

        } catch (err) {
            console.error('Link error:', err)
            setFormError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteWali = async (wali) => {
        if (!window.confirm(`Hapus akun wali "${wali.nama}"?`)) return

        try {
            await supabase.from('santri').update({ wali_id: null }).eq('wali_id', wali.user_id)
            const { error } = await supabase.from('user_profiles').delete().eq('user_id', wali.user_id)
            if (error) throw error
            alert('Profil wali berhasil dihapus!')
            fetchWaliList()
            fetchSantriList()
        } catch (err) {
            alert('Error: ' + err.message)
        }
    }

    const toggleSantri = (santriId) => {
        setFormData(prev => ({
            ...prev,
            santri_ids: prev.santri_ids.includes(santriId)
                ? prev.santri_ids.filter(id => id !== santriId)
                : [...prev.santri_ids, santriId]
        }))
    }

    const handleSubmit = () => {
        console.log('Submit clicked, mode:', formMode)
        if (formMode === 'create') handleCreateWali()
        else if (formMode === 'edit') handleUpdateWali()
        else if (formMode === 'link') handleLinkSantri()
    }

    const availableSantri = santriList.filter(s =>
        !s.wali_id || (editingWali && s.wali_id === editingWali.user_id) || formData.santri_ids.includes(s.id)
    )

    // Inline styles
    const styles = {
        page: { padding: '24px' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
        title: { fontSize: '24px', fontWeight: '600', margin: 0 },
        btnPrimary: { padding: '10px 20px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
        btnSecondary: { padding: '10px 20px', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
        btnSm: { padding: '6px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: 'white' },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' },
        card: { backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' },
        avatar: { width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#059669', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '600' },
        overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
        modal: { backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'hidden' },
        modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e5e7eb' },
        modalBody: { padding: '20px', maxHeight: '60vh', overflowY: 'auto' },
        modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 20px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' },
        formGroup: { marginBottom: '16px' },
        label: { display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' },
        input: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' },
        alert: { padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
        alertError: { backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' },
        alertSuccess: { backgroundColor: '#d1fae5', color: '#059669', border: '1px solid #a7f3d0' },
        santriSelector: { maxHeight: '150px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' },
        santriOption: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' },
        emptyState: { textAlign: 'center', padding: '60px 20px', color: '#6b7280' }
    }

    return (
        <div style={styles.page}>
            {/* Header */}
            <div style={styles.header}>
                <h1 style={styles.title}>Manajemen Akun Wali Santri</h1>
                <button style={styles.btnPrimary} onClick={handleOpenCreateForm} type="button">
                    + Tambah Akun Wali
                </button>
            </div>

            {/* Wali List */}
            {loading ? (
                <div style={styles.emptyState}>Memuat data...</div>
            ) : waliList.length === 0 ? (
                <div style={styles.emptyState}>
                    <p>Belum ada akun wali santri</p>
                    <button style={styles.btnPrimary} onClick={handleOpenCreateForm} type="button">
                        + Buat Akun Wali Pertama
                    </button>
                </div>
            ) : (
                <div style={styles.grid}>
                    {waliList.map(wali => (
                        <div key={wali.id} style={styles.card}>
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                <div style={styles.avatar}>
                                    {wali.nama?.charAt(0).toUpperCase() || 'W'}
                                </div>
                                <div>
                                    <h3 style={{ margin: '0 0 4px', fontSize: '16px' }}>{wali.nama || 'Tanpa Nama'}</h3>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#059669' }}>{wali.email}</p>
                                </div>
                            </div>

                            <div style={{ backgroundColor: '#f9fafb', padding: '10px', borderRadius: '8px', marginBottom: '12px' }}>
                                <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#6b7280' }}>Santri Terhubung:</p>
                                {wali.santri?.length > 0 ? (
                                    <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                                        {wali.santri.map(s => (
                                            <li key={s.id} style={{ fontSize: '14px' }}>{s.nama} ({s.nis})</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p style={{ margin: 0, fontSize: '14px', fontStyle: 'italic', color: '#9ca3af' }}>Belum ada</p>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button style={{ ...styles.btnSm, backgroundColor: '#3b82f6' }} onClick={() => handleOpenLinkForm(wali)} type="button">Link</button>
                                <button style={{ ...styles.btnSm, backgroundColor: '#f59e0b' }} onClick={() => handleOpenEditForm(wali)} type="button">Edit</button>
                                <button style={{ ...styles.btnSm, backgroundColor: '#ef4444' }} onClick={() => handleDeleteWali(wali)} type="button">Hapus</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Form */}
            {showForm && (
                <div style={styles.overlay} onClick={handleCloseForm}>
                    <div style={styles.modal} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h2 style={{ margin: 0, fontSize: '18px' }}>
                                {formMode === 'create' && 'Tambah Akun Wali'}
                                {formMode === 'edit' && 'Edit Akun Wali'}
                                {formMode === 'link' && 'Hubungkan Santri'}
                            </h2>
                            <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }} onClick={handleCloseForm} type="button">×</button>
                        </div>

                        <div style={styles.modalBody}>
                            {formError && <div style={{ ...styles.alert, ...styles.alertError }}>{formError}</div>}
                            {formSuccess && <div style={{ ...styles.alert, ...styles.alertSuccess }}>{formSuccess}</div>}

                            {formMode !== 'link' && (
                                <>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Email (opsional jika ada No. Telepon)</label>
                                        <input
                                            style={styles.input}
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="email@contoh.com"
                                            disabled={formMode === 'edit'}
                                        />
                                        <small style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                                            Wali bisa login dengan email ini
                                        </small>
                                    </div>

                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Password (Default: 123456)</label>
                                        <input
                                            style={styles.input}
                                            type="text"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="Isi untuk set password khusus"
                                        />
                                    </div>

                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>No. Telepon (opsional jika ada Email)</label>
                                        <input
                                            style={styles.input}
                                            type="text"
                                            value={formData.no_telp}
                                            onChange={(e) => setFormData({ ...formData, no_telp: e.target.value })}
                                            placeholder="08xxxxxxxxxx"
                                            disabled={formMode === 'edit'}
                                        />
                                        <small style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                                            Wali bisa login dengan no. telepon ini
                                        </small>
                                    </div>

                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Nama Wali *</label>
                                        <input
                                            style={styles.input}
                                            type="text"
                                            value={formData.nama}
                                            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                            placeholder="Nama lengkap wali"
                                        />
                                    </div>
                                </>
                            )}


                            <div style={styles.formGroup}>
                                <label style={styles.label}>Pilih Santri</label>
                                <div style={styles.santriSelector}>
                                    {availableSantri.length === 0 ? (
                                        <p style={{ padding: '12px', textAlign: 'center', color: '#9ca3af' }}>Tidak ada santri tersedia</p>
                                    ) : (
                                        availableSantri.map(santri => (
                                            <label key={santri.id} style={{ ...styles.santriOption, backgroundColor: formData.santri_ids.includes(santri.id) ? '#ecfdf5' : 'transparent' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.santri_ids.includes(santri.id)}
                                                    onChange={() => toggleSantri(santri.id)}
                                                    style={{ width: '16px', height: '16px' }}
                                                />
                                                <span style={{ flex: 1, fontWeight: '500' }}>{santri.nama}</span>
                                                <span style={{ fontSize: '12px', color: '#6b7280' }}>{santri.nis}</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={styles.modalFooter}>
                            <button style={styles.btnSecondary} onClick={handleCloseForm} disabled={submitting} type="button">
                                Batal
                            </button>
                            <button style={{ ...styles.btnPrimary, opacity: submitting ? 0.6 : 1 }} onClick={handleSubmit} disabled={submitting} type="button">
                                {submitting ? 'Menyimpan...' : (formMode === 'create' ? 'Buat Akun' : 'Simpan')}
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    )
}

export default AkunWaliPage
