import Image from "next/image";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import { StreamingDataArray, StreamingData, PlayDataEntry } from "@/utils/streamingData";
import { JSX, useEffect, useState } from "react";
import { fetchImages } from "@/utils/requestImages";
import '../../styles/top.css';

interface Settings {
    top: number,
    show: "artists" | "tracks",
    timeFrame: TimeFrame
}

type TimeFrame = "month" | "year" | "allTime";


export function SongEntry({song}: {song: PlayDataEntry}) {
    let { track, artist, imageUrl, playCount } = song
    // TODO: Replace with placeholder image
    if (imageUrl === undefined)
        imageUrl = "https://i.scdn.co/image/ab67616d0000485111e50151974d60a789b9626d";

    return (
        <div className="song-entry">
            <div>
                <Image
                    src={imageUrl}
                    alt="Image"
                    width={64}
                    height={64}
                    className="song-image"
                />
            </div>
            <div className="song-details">
                <span className="song-title">{track}</span>
                <span className="song-artist">{artist}</span>
            </div>
            <div>
                <span className="song-playcount">{playCount}</span>
            </div>
        </div>
    );
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
    const [requestImages, setRequestImages] = useState<{ uri: string, id: string }[]>([]);

    useEffect(() => {
        const { data, images } = getModifiedStreamingData({ top, show, timeFrame, showSlides });
        setStreamData(data);
        setRequestImages(images)
    }, [top, show, timeFrame]);

    useEffect(() => {
        if (requestImages.length > 0) {
            fetchImages({ requestImages, streamData, type: 'tracks' }).then(data => {
                setStreamData(data.streamData);
                setRequestImages(data.requestImages)
            });
        }
    }, [requestImages, streamData]);

    const streamDataElements: JSX.Element[] = []

    if (streamData) {
        streamData.forEach(([title, songs]) => {
            streamDataElements.push(<ColumnTitle {...{ title, timeFrame }} />)
            for (let i = 0; i < top; i++) {
                const entry = i < songs.length ? <SongEntry song={songs[i]} /> : <div />;
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

    return { data: streamData, images: getUrlOfMissingImages({ streamData, top, showSlides }) };
}

function getUrlOfMissingImages({ streamData, showSlides, top }: { streamData: StreamingDataArray, showSlides: number, top: number }) {
    const requestImage: Set<{ uri: string, id: string }> = new Set();

    const renderedRows = Math.min(streamData.length, showSlides + 1)

    //Grab images in view
    for (let i = 0; i < top; i++) {
        for (let ii = 0; ii < renderedRows; ii++) {
            const entry = streamData[ii][1][i] ?? undefined;
            if (entry && !entry.imageUrl) {
                requestImage.add({ uri: entry.uri!, id: entry.id! });
            }
        }
    }

    for (let i = renderedRows; i < streamData.length; i++) {
        streamData[i][1].forEach((entry, index) => {
            if (!entry.imageUrl) {
                requestImage.add({ uri: entry.uri!, id: entry.id! });
            }
        })
    }

    return Array.from(requestImage);
}