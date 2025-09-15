import dynamic from 'next/dynamic'
const AuthUI = dynamic(() => import('../parts/AuthUI'), { ssr: false })
export default function Login() { return <AuthUI /> }
