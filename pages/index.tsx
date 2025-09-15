import Link from 'next/link'

export default function Home() {
  return (
    <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24}}>
      <div style={{textAlign:'center'}}>
        <h1 style={{fontSize:28, fontWeight:700, marginBottom:12}}>Cardmarket Tracker</h1>
        <Link href="/login">Log in</Link>
      </div>
    </main>
  )
}
