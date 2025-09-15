import dynamic from 'next/dynamic'
const DashboardClient = dynamic(() => import('./parts/DashboardClient'), { ssr: false })
export default function Dashboard() { return <DashboardClient /> }
