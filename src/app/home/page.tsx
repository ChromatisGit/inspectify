import { ButtonHome, ButtonTool } from "@/components/button";
import lang from "@/data/lang/en.json";

export default function Home() {
    return <>
        <ButtonHome />
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <ButtonTool name={lang.tools.top.title} href="/top" size="big" needs={["history"]} />
        </main>
    </>;
}