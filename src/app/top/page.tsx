'use client';
import { ButtonHome } from "@/components/button";
import { SongTable} from "./table";


export default function Home() {
    return <>
        <ButtonHome />
        <div>
            <SongTable {...{ top: 10, show: "artists", timeFrame: "year" }}/>
        </div>
    </>;
}