'use client'
import { useState, FormEvent, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const idFromUrl = (url: string) => {
  const m = url.match(/[?&]idProduct=(\d+)/)
  return m ? parseInt(m[1], 10) : null
}

export default function TrackPage() {
  const [url, setUrl] = useState('')
  const [game, setGame] = useState('Pokémon')
  const [name, setName] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user?.email) window.location.href = '/login'
    })
  }, [])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert('Niet ingelogd')

    const id_product = idFromUrl(url)
    if (!id_product) return alert('Kon geen idProduct vinden in de URL (zoek ?idProduct=...)')

    const { error } = await supabase.from('tracked_card').insert({
      user_id: user.id, id_product, game, name
    } as any)
    if (error) return alert(error.message)
    alert('Kaart gevolgd!')
    setUrl(''); setName('')
  }

  return (
    <div style={{maxWidth:520, margin:'0 auto', padding:24}}>
      <h1 style={{fontSize:24, fontWeight:600, marginBottom:16}}>Kaart toevoegen</h1>
      <form onSubmit={onSubmit} style={{display:'grid', gap:12}}>
        <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="Cardmarket URL met ?idProduct=..." style={{border:'1px solid #e5e7eb', padding:8, borderRadius:8}} />
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="(Optioneel) kaartnaam" style={{border:'1px solid #e5e7eb', padding:8, borderRadius:8}} />
        <select value={game} onChange={e=>setGame(e.target.value)} style={{border:'1px solid #e5e7eb', padding:8, borderRadius:8}}>
          <option>Pokémon</option>
          <option>Magic</option>
          <option>Yu-Gi-Oh!</option>
        </select>
        <button style={{padding:'8px 12px', borderRadius:8, background:'#000', color:'#fff'}}>Toevoegen</button>
      </form>
    </div>
  )
}
