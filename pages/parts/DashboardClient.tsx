'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Link from 'next/link'

type Tracked = {
  id: string
  name: string | null
  game: string
  product_url: string | null
  created_at: string
}

export default function DashboardClient() {
  const [email, setEmail] = useState<string | null>(null)
  const [items, setItems] = useState<Tracked[]>([])

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (!user?.email) { window.location.href = '/login'; return }
      setEmail(user.email)

      const { data: rows, error } = await supabase
        .from('tracked_card')
        .select('id, name, game, product_url, created_at')
        .order('created_at', { ascending: false })
        .limit(100)
      if (!error) setItems((rows || []) as Tracked[])
    })()
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

      <div style={{marginTop:32}}>
        <h2 style={{fontSize:18, fontWeight:600, marginBottom:8}}>Jouw kaarten</h2>
        {items.length === 0 ? (
          <p>Nog niets gevolgd. Ga naar <a href="/track">/track</a> om je eerste link toe te voegen.</p>
        ) : (
          <ul style={{display:'grid', gap:8}}>
            {items.map((it) => (
              <li key={it.id} style={{border:'1px solid #e5e7eb', borderRadius:8, padding:12}}>
                <div style={{fontWeight:600}}>{it.name || 'Zonder naam'}</div>
                <div style={{fontSize:12, color:'#6b7280'}}>Game: {it.game}</div>
                {it.product_url && (
                  <a href={it.product_url} target="_blank" rel="noreferrer" style={{fontSize:12, display:'inline-block', marginTop:4}}>
                    {it.product_url}
                  </a>
                )}
                <div style={{marginTop:8}}>
                  <Link href={`/card/${it.id}`}>Open kaart → filters & grafiek</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
