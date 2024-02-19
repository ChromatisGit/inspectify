'use client';
import { useIsClient } from '@/components/provider';
import dataSpotify from '@/data/spotify.json';
import lang from '@/data/lang/en.json';

export default function Home() {
    const isClient = useIsClient();
    if (!isClient) return <main className="flex min-h-screen flex-col items-center justify-between p-24">
        {lang.login.wait}
    </main>;
    console.log("IS CLIENT");

    const urlParams = new URLSearchParams(window.location.search);
    let code = urlParams.get('code');

    const getToken = async (code: string) => {
        // stored in the previous step
        let codeVerifier = localStorage.getItem('code_verifier');
        
        if (codeVerifier === null) return;

        console.log("LAST STEP");

        const params: Record<string, string> = {
            client_id: dataSpotify.client_id,
            grant_type: 'authorization_code',
            code,
            redirect_uri: dataSpotify.redirect_uri,
            code_verifier: codeVerifier,
        };

        const payload = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(params),
        }

        const body = await fetch("https://accounts.spotify.com/api/token", payload);
        const response = await body.json();

        localStorage.setItem('access_token', response.access_token);
        window.location.href = '/home';
    }

    if (code) {
        getToken(code);
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            {lang.login.code}
        </main>
    );
}
