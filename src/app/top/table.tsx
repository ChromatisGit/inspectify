import Image from "next/image";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import { StreamingDataArray, StreamingData, PlayDataEntry } from "@/utils/streamingData";
import { JSX, useEffect, useState } from "react";
import { fetchImages } from "@/utils/requestImages";
import '../../styles/top.css';
import { useInternalState } from "@/components/provider";
import { langFlat } from "@/components/lang";

interface Settings {
    top: number,
    show: "artists" | "tracks",
    timeFrame: TimeFrame
    showSlides?: number
}

type TimeFrame = "month" | "year" | "allTime";


export function SongEntry({ song }: { song: PlayDataEntry }) {
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
    const [internalState, _] = useInternalState();
    if (timeFrame === 'month') {
        const year = title.slice(0, 4)
        let period = title.slice(5)
        if (period === "honorableMentions")
            period = langFlat(internalState?.lang, `top.${period}`)
        else
            period = langFlat(internalState?.lang, `month.${period}`)

        title = `${period} ${year}`
    }

    if (title === "honorableMentions")
        title = langFlat(internalState?.lang, `top.${title}`)

    return (
        <div className="column-title-container">
            <h1 className="column-title">{title}</h1>
        </div>
    )
}

export function SongTable({ top, show, timeFrame }: Settings) {

    const [streamData, setStreamData] = useState<StreamingDataArray | []>([]);
    const [requestImages, setRequestImages] = useState<{ uri: string, id: string }[]>([]);
    const [showSlides, setShowSlides] = useState<number>(3);

    useEffect(() => {
        const { data, images } = getModifiedStreamingData({ top, show, timeFrame });
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

    useEffect(() => {
        const updateShowSlides = () => {
            if (window.innerWidth < 700) {
                setShowSlides(1);
            } else if (window.innerWidth < 1000) {
                setShowSlides(2);
            } else {
                setShowSlides(3);
            }
        };

        updateShowSlides();

        window.addEventListener('resize', updateShowSlides);

        return () => {
            window.removeEventListener('resize', updateShowSlides);
        };
    }, []);

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
        swipeToSlide: true,
        slidesPerRow: 1
    };

    return (
        <div className="table-container">
            <PlacementColumn top={top} />
            <div className="slider-container">
                <Slider {...carouselSettings}>
                    {streamDataElements.map((item, index) => (
                        <div key={index}>{item}</div>
                    ))}
                </Slider>
            </div>
        </div>
    );
}
export function PlacementColumn({ top }: { top: number }) {

    const placementElements: JSX.Element[] = []

    for (let i = 1; i <= top; i++) {
        const entry = <span className="placement-number">{i}</span>;
        placementElements.push(entry);
    }

    return (
        <div className="placement-column">
            {placementElements.map((item, index) => (
                <div className="placement-container" key={index}>{item}</div>
            ))}
        </div>
    );
}

function getModifiedStreamingData({ top, show, timeFrame }: Settings) {
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

    return { data: streamData, images: getUrlOfMissingImages({ streamData, top }) };
}

function getUrlOfMissingImages({ streamData, top }: { streamData: StreamingDataArray, top: number }) {
    const requestImage: Set<{ uri: string, id: string }> = new Set();

    const renderedRows = Math.min(streamData.length, 4)

    //Grab images in view
    for (let i = 0; i < top; i++) {
        for (let ii = 0; ii < renderedRows; ii++) {
            const entry = streamData[ii][1][i] ?? undefined;
            if (entry && entry.uri !== undefined && entry.uri !== '' && !entry.imageUrl) {
                requestImage.add({ uri: entry.uri, id: entry.id! });
            }
        }
    }

    for (let i = renderedRows; i < streamData.length; i++) {
        streamData[i][1].forEach((entry, index) => {
            if (entry.uri !== undefined && entry.uri !== '' && !entry.imageUrl) {
                requestImage.add({ uri: entry.uri!, id: entry.id! });
            }
        })
    }

    return Array.from(requestImage);
}