import dynamic from 'next/dynamic'
const CardDetailClient = dynamic(() => import('../parts/CardDetailClient'), { ssr: false })
export default function CardDetail() { return <CardDetailClient /> }
