'use client'
import { useState, FormEvent, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

function normalizeCardmarketUrl(raw: string) {
  try {
    const u = new URL(raw.trim())
    if (!u.hostname.toLowerCase().includes('cardmarket.com')) return null
    // strip optionele idProduct param; we tracken op de “normale” URL
    u.searchParams.delete('idProduct')
    const clean = u.origin + u.pathname + (u.search ? u.search : '')
    return clean.replace(/\?$/, '')
  } catch {
    return null
  }
}

export default function TrackClient() {
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

    const product_url = normalizeCardmarketUrl(url)
    if (!product_url) return alert('Voer een geldige Cardmarket-URL in (https://www.cardmarket.com/...)')

    const insert = {
      user_id: user.id,
      id_product: null,
      game,
      name: name || null,
      product_url
    } as any

    const { error } = await supabase.from('tracked_card').insert(insert)
    if (error) {
      if (error.message.includes('ux_tracked_card_product_url')) {
        return alert('Deze link volg je al 😉')
      }
      return alert(error.message)
    }
    alert('Kaart gevolgd op URL!')
    setUrl(''); setName('')
  }

  return (
    <div style={{maxWidth:520, margin:'0 auto', padding:24}}>
      <h1 style={{fontSize:24, fontWeight:600, marginBottom:16}}>Kaart toevoegen</h1>
      <form onSubmit={onSubmit} style={{display:'grid', gap:12}}>
        <input
          value={url}
          onChange={e=>setUrl(e.target.value)}
          placeholder="Plak hier de Cardmarket-link van de kaart (normale URL is prima)"
          style={{border:'1px solid #e5e7eb', padding:8, borderRadius:8}}
        />
        <input
          value={name}
          onChange={e=>setName(e.target.value)}
          placeholder="(Optioneel) kaartnaam voor overzicht"
          style={{border:'1px solid #e5e7eb', padding:8, borderRadius:8}}
        />
        <select
          value={game}
          onChange={e=>setGame(e.target.value)}
          style={{border:'1px solid #e5e7eb', padding:8, borderRadius:8}}
        >
          <option>Pokémon</option>
          <option>Magic</option>
          <option>Yu-Gi-Oh!</option>
        </select>
        <button style={{padding:'8px 12px', borderRadius:8, background:'#000', color:'#fff'}}>
          Toevoegen
        </button>
      </form>
      <p style={{marginTop:12, fontSize:12, color:'#6b7280'}}>
        Tip: elke unieke Cardmarket-URL kun je één keer volgen (dubbele links worden netjes tegengehouden).
      </p>
    </div>
  )
}
