'use client';
import { ButtonHome } from "@/components/button";
import { SongTable} from "./table";


export default function Home() {
    return <>
        <ButtonHome />
        <div>
            <SongTable {...{ top: 15, show: "tracks", timeFrame: "month" }}/>
        </div>
    </>;
}