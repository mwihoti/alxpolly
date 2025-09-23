import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';

    if (code) {
        // Exchange code for session
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            // Redirect to login with an error query parameter
            return NextResponse.redirect(
                new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, request.url)
            );
        }

        // Successfully authenticated; redirect  to the next url or dashboard
        return NextResponse.redirect(new URL(next, request.url));
    }

    // if no code provided redirect to login with a generic error
    return NextResponse.redirect(
        new URL('/auth/login?error=Invalid authentication request', request.url)
    );



    
}