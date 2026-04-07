'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let active = true
    let requestSeq = 0

    const fetchProfile = async (userId: string) => {
      const seq = ++requestSeq
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!active || seq !== requestSeq) return
      setProfile(data ? (data as Profile) : null)
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active) return

      setUser(user)
      if (user) {
        void fetchProfile(user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) return

        setUser(session?.user ?? null)
        if (session?.user) {
          void fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  return { user, profile, loading, isAdmin: profile?.role === 'admin' }
}
