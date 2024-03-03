'use client';
import { ButtonHome } from "@/components/button";
import { SongTable} from "./table";


export default function Home() {
    return <>
        <ButtonHome />
        <div>
            <SongTable {...{ top: 40, show: "artists", timeFrame: "allTime" }}/>
        </div>
    </>;
}