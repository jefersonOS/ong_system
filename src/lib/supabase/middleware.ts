import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Public routes that don't require auth
    const publicRoutes = ['/login', '/signup', '/validate-certificate', '/inscricoes'];
    const isPublicRoute = publicRoutes.some((route) =>
        request.nextUrl.pathname.startsWith(route)
    );

    if (!user && !isPublicRoute) {
        // Prevent redirect loops by checking if we are already on the login page
        if (request.nextUrl.pathname !== '/login') {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            // Add a parameter to help identify the redirect source if needed
            url.searchParams.set('redirected', 'true');
            return NextResponse.redirect(url);
        }
    }

    // Note: To prevent Server vs Client redirect loops on auth mismatch, we let the client handle redirecting away from /login if already authenticated.
    return supabaseResponse;
}
