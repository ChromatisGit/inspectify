'use client';

import { ReactEventHandler } from "react";
import { Lang, lang } from "./lang";
import { useInternalState } from "./provider"
import "@/styles/footer.css"
import { DividerVertical } from "./divider";

export function Footer({ }) {
    const [internalState, setInternalState] = useInternalState();

    const _lang = lang(internalState?.lang).any.lang;
    const options = Object.keys(_lang).map(v => <option key={v} value={v}>{_lang[v]}</option>);

    const onChange : ReactEventHandler<HTMLSelectElement> = (e) => {
        setInternalState({lang: e.currentTarget.value });
        localStorage.setItem("lang", e.currentTarget.value);
    }

    return <div className="footer">
        <div className="footer-left">
            <Lang code="footer.lang" />:
            <select defaultValue={internalState?.lang} {...{onChange}}>
                {options}
            </select>
        </div>
        <div className="footer-right">
            <a href="/imprint"><Lang code="footer.imprint"/></a>
            <DividerVertical />
            <a href="/privacy"><Lang code="footer.privacy"/></a>
        </div>
    </div>
}