import dynamic from 'next/dynamic'
const TrackClient = dynamic(() => import('./parts/TrackClient'), { ssr: false })
export default function Track() { return <TrackClient /> }
