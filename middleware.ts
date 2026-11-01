import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * First lock: refreshes the Supabase session and sends anonymous visitors to /login.
 * The super-admin whitelist is enforced server-side (requireAdmin / getAdminDb),
 * which runs on every page and every data access.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let isAuthenticated = false
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    isAuthenticated = !!user
  } catch {
    // Supabase unreachable: treat as anonymous.
  }

  const isLoginPage = request.nextUrl.pathname.startsWith('/login')

  if (!isAuthenticated && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/).*)'],
}
