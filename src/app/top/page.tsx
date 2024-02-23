'use client';
import { ButtonHome } from "@/components/button";
import { StreamingData } from "@/utils/streamingData";

interface Settings {
    top: number,
    show: "artists" | "songs",
    time: "month" | "year" | "allTime"
}

export default function Home() {
    if (typeof window !== "undefined")
        getTop();

    return <>
        <ButtonHome />
    </>;
}

function getTop() {
    const playCount = new StreamingData(localStorage);

    const settings: Settings = { top: 10, show: "songs", time: "month" };

    if (settings.time === "year")
        playCount.groupByYear();

    if (settings.time === "allTime")
        playCount.groupAll();

    if (settings.show === "artists")
        playCount.groupByArtist();

    const honorableMentions = playCount.copy();

    playCount.sort().getTop(settings.top);

    if (settings.time !== "allTime") {
        const topTracks = playCount.returnUnique();

        if (settings.time === "month")
            honorableMentions.groupByYear();
        if (settings.time === "year")
            honorableMentions.groupAll();

        honorableMentions.removeTracksInSet(topTracks).sort().getTop(settings.top).enrichPlayData(settings.show);
    }

    const streamData = Object.entries(playCount.enrichPlayData(settings.show).data);

    if (settings.time === "year" && streamData.length > 1) {
        streamData.push(['honorableMention', honorableMentions.data["total"]]);
    }

    if (settings.time === "month") {
        let lastYear = "";
        let twoEntries = false;
        let inserts = 0
        Object.keys(playCount.data).forEach((period, index) => {
            const year = period.slice(0, 4);
            if (lastYear === year) {
                twoEntries = true;
                return;
            }
            if (twoEntries) {
                streamData.splice(index + inserts++, 0, [`${lastYear}-honorableMention`, honorableMentions.getPeriod(lastYear)]);
            }
            lastYear = year;
            twoEntries = false;
        });
        if (twoEntries) {
            streamData.push([`${lastYear}-honorableMention`, honorableMentions.getPeriod(lastYear)]);
        }
    }

    console.log(streamData);
}