'use client';
import { ButtonHome } from "@/components/button";
import { StreamingData } from "@/utils/streamingData";

interface Settings {
    top: number,
    show: "artists" | "songs",
    time: "month" | "year" | "allTime"
}

export default function Home() {

    const playCount = new StreamingData(localStorage)

    const settings: Settings = {top: 10, show: "artists", time: "year"}

    if(settings.time === "year")
        playCount.groupByYear()

    if(settings.time === "allTime")
        playCount.groupAll()

    if(settings.show === "artists")
        playCount.groupByArtist()

    playCount.sort().getTop(settings.top).enrichPlayData(settings.show)

    console.log(playCount.data)

    return <>
        <ButtonHome />
    </>;
}