'use client'
import { supabase } from '../../lib/supabaseClient'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

export default function AuthUI() {
  return (
    <div style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24}}>
      <div style={{maxWidth:420,width:'100%',border:'1px solid #e5e7eb',borderRadius:16,padding:24}}>
        <h1 style={{fontSize:24,fontWeight:600,marginBottom:16}}>Inloggen</h1>
        <Auth
          supabaseClient={supabase}
          view="magic_link"
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          showLinks={false}
          // ▼ voeg deze regel toe:
          redirectTo="https://tcgnationcm.vercel.app/dashboard"
        />
        <p style={{fontSize:12,color:'#6b7280',marginTop:12}}>
          Vul je e-mail in, klik de link in je mail en je komt terug op het dashboard.
        </p>
      </div>
    </div>
  )
}
