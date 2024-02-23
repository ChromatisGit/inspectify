'use client';
import { ButtonHome } from "@/components/button";
import { StreamingData, getJSONFromLocalStorage } from "@/utils/streamingData";

interface Settings {
    top: number,
    show: "artists" | "songs",
    time: "month" | "year" | "allTime"
}

export default function Home() {

    const playCount = new StreamingData({
        data: getJSONFromLocalStorage('play_count_data', localStorage),
        tracks: getJSONFromLocalStorage('track_data', localStorage)
    })

    const settings: Settings = {top: 10, show: "artists", time: "year"}

    if(settings.time === "year")
        playCount.groupByYear()

    if(settings.time === "allTime")
        playCount.groupAll()

    if(settings.show === "artists")
        playCount.groupByArtist()

    playCount.getTop(settings.top).enrichPlayData(settings.show)

    console.log(playCount.data)

    return <>
        <ButtonHome />
    </>;
}