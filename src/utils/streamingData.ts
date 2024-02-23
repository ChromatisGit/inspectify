export interface TrackData {
    [key: string]:
    {
        track: string,
        artist: string,
        uri: string,
        album: string
    }
}

interface PlayDataEntry {
    [entry: string]: {
        playTime: number;
        playCount: number;
        id?: string
        track?: string;
        artist?: string;
        uri?: string;
        album?: string;
    }
}

export interface PlayData {
    [group: string]: PlayDataEntry
}

export class StreamingData {
    private _tracks: TrackData;

    private _data: PlayData;
    public get data(): PlayData {
        return structuredClone(this._data);
    }

    constructor({ data, tracks }: { data: PlayData, tracks: TrackData }) {
        this._data = data
        this._tracks = tracks
    }

    public copy(): StreamingData {
        const copy = new StreamingData({
            data: this.data,
            tracks: this._tracks
        });
        return copy;
    }

    public before(year: number, month: number): this {
        let res: PlayData = {};

        Object.entries(this._data).forEach(([period, entry]) => {
            const year2 = Number(period.slice(0, 4));
            const month2 = Number(period.slice(5, 7));

            if (year2 < year || (year2 === year && month2 < month)) {
                res[period] = entry;
            }
        });

        this._data = res;
        return this;
    }

    public after(year: number, month: number): this {
        let res: PlayData = {};

        Object.entries(this._data).forEach(([period, entry]) => {
            const year2 = Number(period.slice(0, 4));
            const month2 = Number(period.slice(5, 7));

            if (year2 > year || (year2 === year && month2 > month)) {
                res[period] = entry;
            }
        });

        this._data = res;
        return this;
    }

    public groupAll(): this {
        const res: PlayData = { 'total': {} };

        Object.values(this._data).forEach((obj) => {
            Object.entries(obj).forEach(([id, { playCount, playTime }]) => {
                const entry = res['total'][id] || (res['total'][id] = { playCount: 0, playTime: 0 })
                entry.playCount += playCount;
                entry.playTime += playTime;
            });
        });

        this._data = res
        return this;
    }

    public groupByYear(): this {
        const res: PlayData = {};

        Object.entries(this._data).forEach(([period, obj]) => {
            const year = period.slice(0, 4);

            Object.entries(obj).forEach(([id, { playCount, playTime }]) => {
                const group = res[year] || (res[year] = {});
                const entry = group[id] || (group[id] = { playCount: 0, playTime: 0 })
                entry.playCount += playCount;
                entry.playTime += playTime;
            });
        });

        this._data = res;
        return this;
    }

    public groupByArtist(): this {
        const res: PlayData = {};

        Object.entries(this._data).forEach(([period, obj]) => {
            Object.entries(obj).forEach(([id, { playCount, playTime }]) => {
                const artist = this._tracks[id].artist
                const group = res[period] || (res[period] = {});
                const entry = group[artist] || (group[artist] = { playCount: 0, playTime: 0 })
                entry.playCount += playCount;
                entry.playTime += playTime;
            });
        });

        this._data = res;
        return this;
    }

    public getTop(top: number): this {
        const res: PlayData = {};

        Object.entries(this._data).forEach(([period, arr]) => {
            res[period] = Object.entries(arr)
                .sort(([, a], [, b]) => {
                    if (a.playCount === b.playCount) {
                        return b.playTime - a.playTime;
                    }
                    return b.playCount - a.playCount;
                })
                .slice(0, top)
                .reduce((acc, [id, entry], index) => {
                    acc[index.toString()] = { id, ...entry };
                    return acc;
                }, {} as PlayDataEntry);
        });

        this._data = res;
        return this;
    }

    public enrichPlayData(dataType: "artists" | "songs") {
        const res: PlayData = {};

        Object.entries(this._data).forEach(([period, obj]) => {
            res[period] = {}
            Object.entries(obj).forEach(([key, entry]) => {
                const { id, ...rest } = entry
                res[period][key] = dataType === "artists" ? { artist: id, ...rest } : { ...this._tracks[id!], ...rest };
            });
        });

        this._data = res;
        return this;
    }
}

export function getJSONFromLocalStorage(key: string, storage: Storage) {
    const dataString = storage.getItem(key);
    if (dataString === null)
        throw new Error('No data found')
    try {
        return JSON.parse(dataString);
    } catch (error) {
        throw new Error('Error parsing JSON');
    }
}