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

    const settings: Settings = {top: 10, show: "songs", time: "month"}

    if(settings.time === "year")
        playCount.groupByYear()

    if(settings.time === "allTime")
        playCount.groupAll()

    if(settings.show === "artists")
        playCount.groupByArtist()

    const honorableMentions = playCount.copy()
    
    playCount.sort().getTop(settings.top)

    if (settings.time !== "allTime") {
        const topTracks = playCount.returnUnique()
        
        if(settings.time === "month")
            honorableMentions.groupByYear()
        if(settings.time === "year")
            honorableMentions.groupAll()

        honorableMentions.removeTracksInSet(topTracks).sort().getTop(settings.top).enrichPlayData(settings.show)
        console.log(honorableMentions.data)
    }

    playCount.enrichPlayData(settings.show)

    console.log(playCount.data)

    return <>
        <ButtonHome />
    </>;
}