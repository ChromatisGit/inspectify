export interface TrackData {
    [key: number]:
    {
        track: string,
        artist: string,
        uri: string,
        album: string
    }
}

export interface PlayData {
    [group: string]: {
        [entry: string]: {
            playTime: number; playCount: number
        }
    }
}

export class StreamingData {
    private data: PlayData;
    private tracks: TrackData;

    constructor({ data, tracks }: { data?: {}, tracks?: TrackData }) {
        this.data = data || getJSONFromLocalStorage('play_count_data')
        this.tracks = tracks || getJSONFromLocalStorage('track_data')
    }

    public returnCopy(): StreamingData {
        const copy = new StreamingData({
            data: structuredClone(this.data),
            tracks: this.tracks
        });
        return copy;
    }

    before(year: number, month: number): ThisType<StreamingData> {
        let res: PlayData = {};

        Object.entries(this.data).forEach(([period, data]) => {
            const year2 = Number(period.slice(0, 4));
            const month2 = Number(period.slice(5, 7));

            if (year2 < year || (year2 === year && month2 < month)) {
                res[period] = data;
            }
        });

        this.data = res;
        return this;
    }

    after(year: number, month: number): ThisType<StreamingData> {
        let res: PlayData = {};

        Object.entries(this.data).forEach(([period, data]) => {
            const year2 = Number(period.slice(0, 4));
            const month2 = Number(period.slice(5, 7));

            if (year2 > year || (year2 === year && month2 > month)) {
                res[period] = data;
            }
        });

        this.data = res;
        return this;
    }
}

class StreamingDataArray {
    private data: [];
    private tracks: TrackData;

    constructor({ data, tracks }: { data: [], tracks: TrackData }) {
        this.data = data
        this.tracks = tracks
    }

    public returnCopy(): StreamingDataArray {
        const copy = new StreamingDataArray({
            data: structuredClone(this.data),
            tracks: this.tracks
        });
        return copy;
    }
}

function getJSONFromLocalStorage(key: string) {
    const dataString = localStorage.getItem(key);
    if (dataString === null)
        throw new Error('No data found')
    try {
        return JSON.parse(dataString);
    } catch (error) {
        throw new Error('Error parsing JSON');
    }
}