import Image from "next/image";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { StreamingDataArray, StreamingData } from "@/utils/streamingData";
import { JSX, useEffect, useState } from "react";

interface Settings {
    top: number,
    show: "artists" | "songs",
    timeFrame: TimeFrame
}

type TimeFrame = "month" | "year" | "allTime";

function SongEntry({ imageUrl, track, artist }: { imageUrl?: string, track?: string, artist: string, }) {
    if (imageUrl === undefined)
        imageUrl = "https://i.scdn.co/image/ab67616d0000485111e50151974d60a789b9626d";

    return (
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
            <div style={{ marginRight: '10px' }}>
                <Image src={imageUrl} alt="Image" width={64} height={64} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'flex-start' }}>
                {track && <span>{track}</span>}
                <span>{artist}</span>
            </div>
        </div>
    )
}

function ColumnTitle({ title, timeFrame }: { title: string, timeFrame: TimeFrame }) {
    return (
        <h1>{title}</h1>
    )
}

export function SongTable({ top, show, timeFrame }: Settings) {

    //TODO showSlides should be responsive
    const showSlides = 3;

    const [streamData, setStreamData] = useState<StreamingDataArray | []>([]);
    const [requestedImages, setRequestedImages] = useState<string[]>([]);

    useEffect(() => {
        const {data, images} = getModifiedStreamingData({ top, show, timeFrame, showSlides });
        setStreamData(data);
        setRequestedImages(images)
    }, [top, show, timeFrame]);

    const streamDataElements: JSX.Element[] = []

    if (streamData){
        streamData.forEach(([title, songs]) => {
            streamDataElements.push(<ColumnTitle {...{ title, timeFrame }} />)
            for (let i = 0; i < top; i++) {
                const entry = i < songs.length ? <SongEntry track={songs[i].track} artist={songs[i].artist!} /> : <div />;
                streamDataElements.push(entry);
            }
        })
    }

    const carouselSettings = {
        dots: false,
        infinite: false,
        centerPadding: "60px",
        slidesToShow: showSlides,
        speed: 500,
        rows: (top + 1),
        swipeToSlide: false,
        slidesPerRow: 1
    };

    return (
        <div className="slider-container">
            <Slider {...carouselSettings}>
                {streamDataElements.map((item, index) => (
                    <div key={index}>{item}</div>
                ))}
            </Slider>
        </div>
    );
}

function getModifiedStreamingData({ top, show, timeFrame, showSlides }: Settings & { showSlides: number }) {
    const playCount = new StreamingData(localStorage);

    if (timeFrame === "year")
        playCount.groupByYear();

    if (timeFrame === "allTime")
        playCount.groupAll();

    if (show === "artists")
        playCount.groupByArtist();

    const honorableMentions = playCount.copy();

    playCount.sort().getTop(top);

    if (timeFrame !== "allTime") {
        const topTracks = playCount.returnUnique();

        if (timeFrame === "month")
            honorableMentions.groupByYear();
        if (timeFrame === "year")
            honorableMentions.groupAll();

        honorableMentions.removeTracksInSet(topTracks).sort().getTop(top).enrichPlayData(show);
    }

    const streamData: StreamingDataArray = Object.entries(playCount.enrichPlayData(show).data);

    if (timeFrame === "year" && streamData.length > 1) {
        streamData.push(['honorableMentions', honorableMentions.data["total"]]);
    }

    if (timeFrame === "month") {
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
                streamData.splice(index + inserts++, 0, [`${lastYear}-honorableMentions`, honorableMentions.getPeriod(lastYear)]);
            }
            lastYear = year;
            twoEntries = false;
        });
        if (twoEntries) {
            streamData.push([`${lastYear}-honorableMentions`, honorableMentions.getPeriod(lastYear)]);
        }
    }

    return {data: streamData, images: getUrlOfMissingImages({ streamData, top, showSlides })};
}

function getUrlOfMissingImages({ streamData, showSlides, top }: { streamData: StreamingDataArray, showSlides: number, top: number }) {
    const requestImage: Set<string> = new Set();

    const renderedRows = Math.min(streamData.length, showSlides + 1)

    //Grab images in view
    for (let i = 0; i < top; i++) {
        for (let ii = 0; ii < renderedRows; ii++) {
            const entry = streamData[ii][1][i] ?? undefined;
            if (entry && !entry.imageUrl) {
                requestImage.add(entry.uri!);
            }
        }
    }

    for (let i = renderedRows; i < streamData.length; i++) {
        streamData[i][1].forEach((entry, index) => {
            if (!entry.imageUrl) {
                requestImage.add(entry.uri!);
            }
        })
    }

    return Array.from(requestImage);
}