'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabaseClient'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

type TrackedCard = {
  id: string
  name: string | null
  game: string
  product_url: string | null
}

type TrackFilter = {
  id: string
  seller_country: number
  min_condition: string
  language_id: number | null
  is_foil: boolean
}

type Snapshot = {
  captured_at: string
  price_min: number | null
  price_median: number | null
  listings_count: number | null
}

const COUNTRIES = [
  { code: 23, name: 'Netherlands' },
  { code: 7,  name: 'Germany' },
  { code: 12, name: 'France' },
  { code: 10, name: 'Spain' },
  { code: 13, name: 'United Kingdom' }
]

const CONDITIONS = ['MT','NM','EX','GD','LP','PL','PO'] as const

export default function CardDetailClient() {
  const router = useRouter()
  const id = (router.query.id as string) || ''
  const [card, setCard] = useState<TrackedCard | null>(null)
  const [filters, setFilters] = useState<TrackFilter[]>([])
  const [selectedFilterId, setSelectedFilterId] = useState<string | null>(null)

  const [sellerCountry, setSellerCountry] = useState<number>(23)
  const [condition, setCondition] = useState<string>('NM')
  const [languageId, setLanguageId] = useState<string>('') // optioneel
  const [isFoil, setIsFoil] = useState<boolean>(false)

  const [range, setRange] = useState<'1m' | '3m' | '1y' | 'all'>('1m')

  const [data, setData] = useState<Snapshot[]>([])
  const [newMin, setNewMin] = useState<string>('')
  const [newMedian, setNewMedian] = useState<string>('') 
  const [newCount, setNewCount] = useState<string>('')

  useEffect(() => {
    if (!id) return
    ;(async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user?.email) { window.location.href = '/login'; return }

      const { data: rows } = await supabase
        .from('tracked_card')
        .select('id, name, game, product_url')
        .eq('id', id)
        .limit(1)
      setCard(rows?.[0] || null)

      const { data: frows } = await supabase
        .from('track_filter')
        .select('id, seller_country, min_condition, language_id, is_foil')
        .eq('tracked_card_id', id)
        .order('seller_country', { ascending: true })
      const list = (frows || []) as TrackFilter[]
      setFilters(list)
      if (list.length && !selectedFilterId) setSelectedFilterId(list[0].id)
    })()
  }, [id])

  useEffect(() => {
    if (!id || !selectedFilterId) { setData([]); return }
    ;(async () => {
      const f = filters.find(x => x.id === selectedFilterId)
      if (!f) return

      const now = new Date()
      let since: Date | null = null
      if (range === '1m') { since = new Date(now); since.setMonth(since.getMonth() - 1) }
      if (range === '3m') { since = new Date(now); since.setMonth(since.getMonth() - 3) }
      if (range === '1y') { since = new Date(now); since.setFullYear(since.getFullYear() - 1) }

      let query = supabase
        .from('market_snapshot')
        .select('captured_at, price_min, price_median, listings_count')
        .eq('tracked_card_id', id)
        .eq('seller_country', f.seller_country)
        .eq('min_condition', f.min_condition)
        .eq('is_foil', f.is_foil)

      if (f.language_id != null) query = query.eq('language_id', f.language_id)
      else query = query.is('language_id', null)

      if (since) query = query.gte('captured_at', since.toISOString())

      const { data: rows } = await query.order('captured_at', { ascending: true })
      setData((rows || []) as Snapshot[])
    })()
  }, [id, selectedFilterId, range, filters])

  const series = useMemo(() => {
    return data.map(d => ({
      t: format(new Date(d.captured_at), 'yyyy-MM-dd'),
      min: d.price_min ?? null,
      median: d.price_median ?? null,
      count: d.listings_count ?? null
    }))
  }, [data])

  async function addFilter(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return
    const payload = {
      tracked_card_id: id,
      seller_country: sellerCountry,
      min_condition: condition,
      language_id: languageId ? Number(languageId) : null,
      is_foil: isFoil
    } as any
    const { error } = await supabase.from('track_filter').insert(payload)
    if (error) { alert(error.message); return }

    const { data: frows } = await supabase
      .from('track_filter')
      .select('id, seller_country, min_condition, language_id, is_foil')
      .eq('tracked_card_id', id)
      .order('seller_country', { ascending: true })
    const list = (frows || []) as TrackFilter[]
    setFilters(list)
    setSelectedFilterId(list[list.length - 1].id)
  }

  async function addSnapshot(e: React.FormEvent) {
    e.preventDefault()
    if (!id || !selectedFilterId) return
    const f = filters.find(x => x.id === selectedFilterId)
    if (!f) return
    const payload = {
      tracked_card_id: id,
      captured_at: new Date().toISOString(),
      seller_country: f.seller_country,
      min_condition: f.min_condition,
      language_id: f.language_id,
      is_foil: f.is_foil,
      price_min: newMin ? Number(newMin) : null,
      price_median: newMedian ? Number(newMedian) : null,
      listings_count: newCount ? Number(newCount) : null
    } as any
    const { error } = await supabase.from('market_snapshot').insert(payload)
    if (error) { alert(error.message); return }
    setNewMin(''); setNewMedian(''); setNewCount('')

    // refresh
    const now = new Date()
    let since: Date | null = null
    if (range === '1m') { since = new Date(now); since.setMonth(since.getMonth() - 1) }
    if (range === '3m') { since = new Date(now); since.setMonth(since.getMonth() - 3) }
    if (range === '1y') { since = new Date(now); since.setFullYear(since.getFullYear() - 1) }

    let query = supabase
      .from('market_snapshot')
      .select('captured_at, price_min, price_median, listings_count')
      .eq('tracked_card_id', id)
      .eq('seller_country', f.seller_country)
      .eq('min_condition', f.min_condition)
      .eq('is_foil', f.is_foil)
    if (f.language_id != null) query = query.eq('language_id', f.language_id)
    else query = query.is('language_id', null)
    if (since) query = query.gte('captured_at', since.toISOString())
    const { data: rows } = await query.order('captured_at', { ascending: true })
    setData((rows || []) as Snapshot[])
  }

  return (
    <div style={{minHeight:'100vh',padding:24,maxWidth:1000,margin:'0 auto'}}>
      <a href="/dashboard" style={{fontSize:12}}>&larr; Terug naar dashboard</a>
      <h1 style={{fontSize:24,fontWeight:600,marginTop:8}}>
        Kaart: {card?.name || 'Zonder naam'}
      </h1>
      {card?.product_url && (
        <div style={{marginTop:8}}>
          <a href={card.product_url} target="_blank" rel="noreferrer" style={{fontSize:12}}>
            Open op Cardmarket
          </a>
        </div>
      )}

      {/* Filters overzicht + toevoegen */}
      <section style={{marginTop:24, display:'grid', gap:16}}>
        <div style={{border:'1px solid #e5e7eb', borderRadius:8, padding:12}}>
          <h2 style={{fontWeight:600, marginBottom:8}}>Filters (land/conditie)</h2>
          {filters.length === 0 ? <p>Nog geen filters. Voeg er één toe.</p> : (
            <ul style={{display:'grid',gap:8}}>
              {filters.map(f => (
                <li key={f.id} style={{
                  border:'1px solid #e5e7eb', borderRadius:8, padding:8, background: selectedFilterId===f.id?'#f3f4f6':'#fff'
                }}>
                  <label style={{display:'flex', alignItems:'center', gap:12, cursor:'pointer'}}>
                    <input
                      type="radio"
                      checked={selectedFilterId===f.id}
                      onChange={()=>setSelectedFilterId(f.id)}
                    />
                    <span>
                      <strong>Land:</strong> {COUNTRIES.find(c=>c.code===f.seller_country)?.name || f.seller_country} &nbsp;|&nbsp; 
                      <strong>Conditie:</strong> {f.min_condition}
                      {f.language_id!=null && <> &nbsp;|&nbsp; <strong>Taal:</strong> {f.language_id}</>}
                      {f.is_foil && <> &nbsp;|&nbsp; <strong>Foil</strong></>}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form onSubmit={addFilter} style={{border:'1px solid #e5e7eb', borderRadius:8, padding:12}}>
          <h3 style={{fontWeight:600, marginBottom:8}}>Nieuw filter toevoegen</h3>
          <div style={{display:'grid', gap:8, gridTemplateColumns:'1fr 1fr 1fr 1fr'}}>
            <select value={sellerCountry} onChange={e=>setSellerCountry(Number(e.target.value))} style={{padding:8, borderRadius:8, border:'1px solid #e5e7eb'}}>
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
            <select value={condition} onChange={e=>setCondition(e.target.value)} style={{padding:8, borderRadius:8, border:'1px solid #e5e7eb'}}>
              {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input placeholder="Language ID (optioneel)" value={languageId} onChange={e=>setLanguageId(e.target.value)} style={{padding:8, borderRadius:8, border:'1px solid #e5e7eb'}} />
            <label style={{display:'flex', alignItems:'center', gap:8}}>
              <input type="checkbox" checked={isFoil} onChange={e=>setIsFoil(e.target.checked)} />
              Foil
            </label>
          </div>
          <button style={{marginTop:8, padding:'8px 12px', borderRadius:8, background:'#000', color:'#fff'}}>Filter toevoegen</button>
        </form>
      </section>

      {/* Range knoppen */}
      <div style={{marginTop:24, display:'flex', gap:8}}>
        {(['1m','3m','1y','all'] as const).map(r => (
          <button key={r}
            onClick={()=>setRange(r)}
            style={{
              padding:'6px 10px', borderRadius:20,
              border:'1px solid #e5e7eb',
              background: range===r ? '#000' : '#fff',
              color: range===r ? '#fff' : '#000',
              cursor:'pointer'
            }}
          >
            {r.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Grafiek */}
      <div style={{height:360, marginTop:12, border:'1px solid #e5e7eb', borderRadius:8, padding:12}}>
        {series.length === 0 ? (
          <p>Geen data in dit bereik. Voeg een snapshot toe hieronder.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="min" name="Min" dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="median" name="Median" dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="count" name="Listings" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Handmatig snapshot toevoegen */}
      {selectedFilterId && (
        <form onSubmit={addSnapshot} style={{marginTop:16, display:'grid', gap:8, gridTemplateColumns:'1fr 1fr 1fr auto', alignItems:'end'}}>
          <div>
            <label style={{fontSize:12, color:'#6b7280'}}>Min prijs</label>
            <input value={newMin} onChange={e=>setNewMin(e.target.value)} placeholder="bijv. 1.50" style={{width:'100%', padding:8, borderRadius:8, border:'1px solid #e5e7eb'}} />
          </div>
          <div>
            <label style={{fontSize:12, color:'#6b7280'}}>Median prijs</label>
            <input value={newMedian} onChange={e=>setNewMedian(e.target.value)} placeholder="bijv. 2.00" style={{width:'100%', padding:8, borderRadius:8, border:'1px solid #e5e7eb'}} />
          </div>
          <div>
            <label style={{fontSize:12, color:'#6b7280'}}>Listings</label>
            <input value={newCount} onChange={e=>setNewCount(e.target.value)} placeholder="bijv. 7" style={{width:'100%', padding:8, borderRadius:8, border:'1px solid #e5e7eb'}} />
          </div>
          <button style={{padding:'8px 12px', borderRadius:8, background:'#000', color:'#fff'}}>Snapshot toevoegen</button>
        </form>
      )}
    </div>
  )
}
