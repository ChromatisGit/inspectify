import { useInternalState } from "./provider"

import langEn from '@/data/lang/en.json';

const _lang: Record<string, any> = {
    "en": langEn
}

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
    "en": flattenObject(langEn)
}

interface ILang {
    code: string;
}

export function Lang({ code }: ILang) {
    const [internalState, _] = useInternalState();
    if (!internalState) return;
    return _langFlat[internalState?.lang][code];
}

export function lang(__lang: string) {
    return _lang[__lang];
}

export function langFlat(__lang: string = "en", code: string) {
    return _langFlat[__lang][code];
}