'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Link from 'next/link'

export default function Dashboard() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const e = data.user?.email ?? null
      setEmail(e)
      if (!e) window.location.href = '/login'
    })
  }, [])

  if (!email) return null

  return (
    <div style={{minHeight:'100vh',padding:24,maxWidth:960,margin:'0 auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h1 style={{fontSize:24,fontWeight:600}}>Dashboard</h1>
        <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}>
          Uitloggen
        </button>
      </div>
      <p style={{marginTop:16}}>Ingelogd als <strong>{email}</strong>.</p>
      <div style={{marginTop:24}}>
        <Link href="/track">→ Kaart toevoegen</Link>
      </div>
    </div>
  )
}
