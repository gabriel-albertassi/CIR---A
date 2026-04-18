import { NextResponse } from 'next/server'
// The client you created in Step 1
import { createClient } from '@/lib/supabase/sb-server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }
    
    if (!error) {
      if (next) {
        return NextResponse.redirect(`${origin}${next}`)
      }
      
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}/`)
      } else {
        return NextResponse.redirect(`${origin}/login?message=confirmed`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=O+codigo+de+autenticacao+nao+foi+encontrado+ou+ja+foi+utilizado.`)
}
