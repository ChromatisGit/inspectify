'use client';
import { MouseEventHandler, ReactHTML, createElement, ChangeEvent } from 'react';
import '../styles/button.css';
import Image, { StaticImageData } from 'next/image';
import iconSpotify from '../images/Spotify_Icon_RGB_White.png';
import iconZip from '../svgs/iconmonstr-zip-7.svg';
import iconHome from '../svgs/iconmonstr-home-9.svg';
import dataSpotify from '@/data/spotify.json';
import lang from '@/data/lang/en.json';
import { readZip } from '@/utils/readZip';

interface IButton {
    children?: any;
    href?: string;
    type?: keyof ReactHTML;
    className?: string;
    disabled?: boolean;
    onClick?: MouseEventHandler<HTMLAnchorElement>;
}

export function Button({ type = "a", children, href, className, onClick, disabled = false }: IButton) {
    return createElement(type,
        {
            className: `button ${className}`,
            href,
            onClick,
            disabled
        },
        children);
}

export function ButtonLoginSpotify() {
    const generateRandomString = (length: number) => {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const values = crypto.getRandomValues(new Uint8Array(length));
        return values.reduce((acc, x) => acc + possible[x % possible.length], "");
    }

    const codeVerifier = generateRandomString(64);

    const sha256 = async (plain: string) => {
        const encoder = new TextEncoder()
        const data = encoder.encode(plain)
        return window.crypto.subtle.digest('SHA-256', data)
    }

    const base64encode = (input: ArrayBuffer) => {
        return btoa(String.fromCharCode(...new Uint8Array(input)))
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
    }

    const authUrl = new URL("https://accounts.spotify.com/authorize")

    let onClick: MouseEventHandler<HTMLAnchorElement> = function (e) {
        sha256(codeVerifier).then((hashed) => {
            const codeChallenge = base64encode(hashed);

            // generated in the previous step
            window.localStorage.setItem('code_verifier', codeVerifier);

            const params = {
                response_type: 'code',
                client_id: dataSpotify.client_id,
                scope: dataSpotify.scope,
                code_challenge_method: 'S256',
                code_challenge: codeChallenge,
                redirect_uri: dataSpotify.redirect_uri,
            }

            authUrl.search = new URLSearchParams(params).toString();
            window.location.href = authUrl.toString();
        });
    }

    return (
        <Button className="button-login-spotify" {...{ onClick }}>
            <Image src={iconSpotify} alt="Spotify" width={32} />
            {lang.start.login.spotify}
        </Button>
    )
}

export function ButtonSubmitHistory() {

    const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
            readZip(file);
        }
    };

    const onClick: MouseEventHandler<HTMLAnchorElement> = (e) => {
        e.preventDefault();
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', '.zip');
        // TODO This is too TypeScript for me to understand, but it works
        input.onchange = handleFileChange;
        input.click();
    };

    return <>
        <Button className="button-submit-history" {...{ onClick }}>
            <Image src={iconZip} alt="Zip" width={32} />
            {lang.start.history}
        </Button>
    </>;
}

export function ButtonHome() {
    return <Button className="button-home" href="/home">
        <Image src={iconHome} alt="Home" width={24} />
        {lang.any.home}
    </Button>;
}

interface IButtonTool {
    icon?: StaticImageData;
    name: string;
    href: string;
    size: "small" | "big";
    needs?: ["spotify" | "history"];
}

export function ButtonTool({ icon, name, href, needs, size } : IButtonTool) {
    const disabled = needs && needs.includes("spotify") && !window.localStorage.getItem('access_token');
    return <Button className="button-tool" {...{ href, disabled }}>
        <div className="button-tool-left">
        {icon && <Image src={icon} alt={name} width={size === "big" ? 48 : 32}/>}
        {name}
        </div>
        <div className="button-tool-right">
            {needs && needs.includes("spotify") && <Image src={iconSpotify} alt="Spotify" width={size === "big" ? 32 : 24}/> }
            {needs && needs.includes("history") && <Image src={iconZip} alt="Zip" width={size === "big" ? 32 : 24}/> }
        </div>
    </Button>;
}