import { ButtonHome, ButtonTool } from "@/components/button";

export default function Home() {
    return <>
        <ButtonHome />
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <ButtonTool name="tools.top.title" href="/top" size="big" needs={["history"]} />
        </main>
    </>;
}