'use client';
import { ButtonHome } from "@/components/button";
import { StreamingData, getJSONFromLocalStorage } from "@/utils/streamingData";

export default function Home() {

    const playCount = new StreamingData({
        data: getJSONFromLocalStorage('play_count_data', localStorage),
        tracks: getJSONFromLocalStorage('track_data', localStorage)
    })

    const res = playCount.after(2023, 5).groupByYear().sort().getTop(10).convertToSongObj().data

    console.log(res)

    return <>
        <ButtonHome />
    </>;
}