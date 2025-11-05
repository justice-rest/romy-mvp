'use client'

import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

export const useCurrentUserName = () => {
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null

    const fetchProfileName = async () => {
      try {
        const supabase = createClient()
        
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Session error:', error)
        }

        const fullName = data.session?.user.user_metadata.full_name
        setName(fullName ?? 'Neighbor')

        // Subscribe to auth changes to update name when user signs in/out
        const {
          data: { subscription: authSubscription }
        } = supabase.auth.onAuthStateChange((event, session) => {
          const fullName = data.session?.user.user_metadata.full_name
          setName(fullName ?? 'Neighbor')
        })
        subscription = authSubscription
      } catch (error) {
        console.error('Auth error:', error)
        setName('Neighbor')
      }
    }

    fetchProfileName()

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  return name || 'Neighbor'
}
