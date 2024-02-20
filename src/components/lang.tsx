'use client';
import { useInternalState } from "./provider"

import langEn from '@/data/lang/en.json';
import langDe from '@/data/lang/de.json';

const _lang: Record<string, any> = {
    en: langEn,
    de: langDe
}

/// source: https://stackoverflow.com/questions/44134212/best-way-to-flatten-js-object-keys-and-values-to-a-single-depth-array#53739792
function flattenObject(ob: any) {
    var toReturn : Record<string, string> = {};

    for (var i in ob) {
        if (!ob.hasOwnProperty(i)) continue;

        if ((typeof ob[i]) == 'object' && ob[i] !== null) {
            var flatObject = flattenObject(ob[i]);
            for (var x in flatObject) {
                if (!flatObject.hasOwnProperty(x)) continue;

                toReturn[i + '.' + x] = flatObject[x];
            }
        } else {
            toReturn[i] = ob[i];
        }
    }
    return toReturn;
}

const _langFlat : Record<string, Record<string, string>> = {
    en: flattenObject(langEn),
    de: flattenObject(langDe)
}

interface ILang {
    code: string;
}

export function Lang({ code }: ILang) {
    const [internalState, _] = useInternalState();
    const __lang = internalState?.lang ?? localStorage.getItem("lang") ?? "en";
    return _langFlat[__lang][code];
}

export function lang(__lang?: string) {
    if (!__lang) __lang = localStorage.getItem("lang") ?? "en";
    return _lang[__lang];
}

export function langFlat(__lang: string | undefined = undefined, code: string) {
    if (!__lang) __lang = localStorage.getItem("lang") ?? "en";
    return _langFlat[__lang][code];
}