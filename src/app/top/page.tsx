'use client';
import { ButtonHome } from "@/components/button";
import { SongTable} from "./table";


export default function Home() {
    return <>
        <ButtonHome />
        <div style={{ width: '80%', minWidth: '800px', margin: '0 auto' }}>
            <SongTable {...{ top: 30, show: "tracks", timeFrame: "year" }}/>
        </div>
    </>;
}