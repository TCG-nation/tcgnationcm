import dynamic from 'next/dynamic'

// Laad de client-variant zonder SSR
const CardDetailClient = dynamic(() => import('../parts/CardDetailClient'), { ssr: false })

export default function CardDetail() {
  return <CardDetailClient />
}
