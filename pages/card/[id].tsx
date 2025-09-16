import { useRouter } from 'next/router'

export default function CardDetailTest() {
  const router = useRouter()
  const { id } = router.query
  return (
    <div style={{padding:24}}>
      <a href="/dashboard" style={{fontSize:12}}>&larr; Terug</a>
      <h1 style={{marginTop:8}}>Card detail test</h1>
      <p>Dit is de testpagina voor kaart met id: <b>{String(id || '')}</b></p>
    </div>
  )
}
