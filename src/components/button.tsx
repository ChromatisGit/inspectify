'use client';
import { MouseEventHandler, ReactHTML, createElement, ChangeEvent, createRef, RefObject, Component } from 'react';
import '../styles/button.css';
import Image, { StaticImageData } from 'next/image';
import iconSpotify from '../images/Spotify_Icon_RGB_White.png';
import iconZip from '../svgs/iconmonstr-zip-7.svg';
import iconHome from '../svgs/iconmonstr-home-9.svg';
import dataSpotify from '@/data/spotify.json';
import { convertZipToTrackData } from '@/utils/convertZipToTrackData';
import { Lang, langFlat } from './lang';
import { useInternalState } from './provider';

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
            <Lang code="start.login.spotify" />
        </Button>
    )
}

interface callback {
    callbackError: (code: string)=> void,
    callbackSuccess: (code: string)=> void,
}

export function ButtonSubmitHistory({ callbackError, callbackSuccess }: callback) {
    const ref: RefObject<HTMLInputElement> = createRef();

    const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
            convertZipToTrackData(file)
                .then(result => {
                    console.log("success")
                    const { playCountData, trackData } = result;
                    localStorage.setItem('play_count_data', JSON.stringify(playCountData));
                    localStorage.setItem('track_data', JSON.stringify(trackData));
                    callbackSuccess('upload.success')
                    window.location.href = '/home';
                })
                .catch((error: Error) => {
                    switch (error.message) {
                        case 'upload.unknownZipError':
                        case 'upload.accountDataError':
                        case 'upload.corruptJSONError':
                            callbackError(error.message);
                            break;
                        default:
                            callbackError('upload.unknownError');
                    }
                });
        }
    };

    const onClick: MouseEventHandler<HTMLAnchorElement> = (e) => {
        e.preventDefault();
        ref.current?.click();
    };

    return <>
        <input hidden={true} type="file" accept='.zip' onChange={handleFileChange} ref={ref} />
        <Button className="button-submit-history" onClick={onClick}>
            <Image src={iconZip} alt="Zip" width={32} />
            <Lang code="start.history" />
        </Button>
    </>;
}

export function ButtonHome() {
    return <Button className="button-home" href="/home">
        <Image src={iconHome} alt="Home" width={24} />
        <Lang code="any.home" />
    </Button>;
}

interface IButtonTool {
    icon?: StaticImageData;
    name: string;
    href: string;
    size: "small" | "big";
    needs?: ["spotify" | "history"];
}

export function ButtonTool({ icon, name, href, needs, size }: IButtonTool) {
    const [internalState, _] = useInternalState();
    const disabled = needs && needs.includes("spotify") && !window.localStorage.getItem('access_token');
    return <Button className="button-tool" {...{ href, disabled }}>
        <div className="button-tool-left">
            {icon && <Image src={icon} alt={langFlat(internalState?.lang, name)} width={size === "big" ? 48 : 32} />}
            <Lang code={name} />
        </div>
        <div className="button-tool-right">
            {needs && needs.includes("spotify") && <Image src={iconSpotify} alt="Spotify" width={size === "big" ? 32 : 24} />}
            {needs && needs.includes("history") && <Image src={iconZip} alt="Zip" width={size === "big" ? 32 : 24} />}
        </div>
    </Button>;
}