'use client';
import { ButtonHome } from "@/components/button";
import { SongTable} from "./table";
import '../../styles/top.css';


export default function Home() {
    return <>
        <ButtonHome />
        <div className="table-container">
            <SongTable {...{ top: 15, show: "tracks", timeFrame: "month" }}/>
        </div>
    </>;
}