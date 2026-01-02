import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export const useSantri = (filters = {}) => {
    return useQuery({
        queryKey: ['santri', filters],
        queryFn: async () => {
            let query = supabase
                .from('santri')
                .select(`
          *,
          kelas:kelas!kelas_id(nama),
          halaqoh:halaqoh!halaqoh_id(nama)
        `)
                .order('nama')

            if (filters.status) query = query.eq('status', filters.status)
            if (filters.kelas_id) query = query.eq('kelas_id', filters.kelas_id)
            if (filters.halaqoh_id) query = query.eq('halaqoh_id', filters.halaqoh_id)

            const [santriRes, angkatanRes] = await Promise.all([
                query,
                supabase.from('angkatan').select('id, nama')
            ])

            if (santriRes.error) throw santriRes.error

            const angkatanMap = (angkatanRes.data || []).reduce((acc, curr) => {
                acc[curr.id] = curr.nama
                return acc
            }, {})

            return (santriRes.data || []).map(s => ({
                ...s,
                angkatan: s.angkatan_id ? { nama: angkatanMap[s.angkatan_id] || '-' } : null
            }))
        },
        staleTime: 60 * 1000 // 1 minute
    })
}

export const useHalaqoh = () => {
    return useQuery({
        queryKey: ['halaqoh'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('halaqoh')
                .select('*, pengajar:guru!musyrif_id(nama)')
                .order('nama')
            if (error) throw error
            return data
        },
        staleTime: 5 * 60 * 1000 // 5 minutes (Reference data)
    })
}

export const useKelas = () => {
    return useQuery({
        queryKey: ['kelas'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('kelas')
                .select('*')
                .order('nama')
            if (error) throw error
            return data
        },
        staleTime: 5 * 60 * 1000
    })
}

export const useMapel = () => {
    return useQuery({
        queryKey: ['mapel'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('mapel')
                .select('*')
                .order('nama')
            if (error) throw error
            return data
        },
        staleTime: 5 * 60 * 1000
    })
}
