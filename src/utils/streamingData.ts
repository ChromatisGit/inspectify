export interface TrackData {
    [key: string]:
    {
        track: string,
        artist: string,
        uri: string,
        album: string,
        imageUrl?: string
    }
}

export interface PlayDataEntry {
    playTime: number;
    playCount: number;
    id?: string
    track?: string;
    artist?: string;
    uri?: string;
    album?: string;
    imageUrl?: string
}

export type StreamingDataArray = [string, PlayDataEntry[]][]

export interface PlayData {
    [group: string]: PlayDataEntry[]
}

export class StreamingData {
    private _tracks: TrackData;

    private _data: PlayData;
    public get data(): PlayData {
        return structuredClone(this._data);
    }

    constructor(source: Storage | StreamingData) {
        if (source instanceof Storage) {
            this._data = this.getJSONFromLocalStorage('play_count_data', source);
            this._tracks = this.getJSONFromLocalStorage('track_data', source);
            return
        }
        this._data = source.data;
        this._tracks = source._tracks;
    }

    public copy(): StreamingData {
        const copy = new StreamingData(this);
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

    public getPeriod(period: string) {
        return structuredClone(this._data[period]);
    }

    public groupAll(): this {
        let res: PlayDataEntry[] = []
        Object.values(this._data).forEach((arr) => {
            res = res.concat(arr)
        })
        this._data = { 'total': this.group(res) }
        return this;
    }

    public groupByYear(): this {
        const res: PlayData = {}
        Object.entries(this._data).forEach(([period, arr]) => {
            const year = period.slice(0, 4);
            const group = res[year] || [];
            res[year] = group.concat(arr)
        })
        Object.entries(res).forEach(([year, arr]) => {
            res[year] = this.group(arr);
        });
        this._data = res
        return this;
    }

    public groupByArtist(): this {
        Object.entries(this._data).forEach(([period, arr]) => {
            this._data[period] = this.group(arr.map(entry => { return { ...entry, id: this._tracks[entry.id!].artist } }))
        })
        return this;
    }

    public sort() {
        Object.values(this._data).forEach((arr) => {
            arr.sort((a, b) => {
                if (a.playCount === b.playCount) {
                    return b.playTime - a.playTime;
                }
                return b.playCount - a.playCount;
            })
        });

        return this;
    }

    public removeTracksInSet(set: Set<string>) {
        Object.entries(this.data).forEach(([period, arr]) => {
            this._data[period] = arr.filter(entry => !set.has(entry.id!))
        })
        return this;
    }

    public getTop(top: number): this {
        Object.entries(this._data).forEach(([period, arr]) => {
            if (arr.length >= top) {
                this._data[period] = arr.slice(0, top);
            }
        });
        return this;
    }

    public returnUnique() {
        const res = new Set<string>();

        Object.values(this._data).forEach((obj) => {
            Object.values(obj).forEach((entry) => {
                res.add(entry.id!);
            });
        });

        return res;
    }

    public enrichPlayData(dataType: "artists" | "songs") {
        Object.entries(this._data).forEach(([period, arr]) => {
            this._data[period] = arr.map(entry => {
                const { id, ...rest } = entry;
                return dataType === "artists" ? { artist: id, ...rest } : { ...this._tracks[id!], ...rest };
            })
        });
        return this;
    }

    private getJSONFromLocalStorage(key: string, storage: Storage) {
        const dataString = storage.getItem(key);
        if (dataString === null)
            throw new Error('No data found')
        try {
            return JSON.parse(dataString);
        } catch (error) {
            throw new Error('Error parsing JSON');
        }
    }

    private group(arr: PlayDataEntry[]): PlayDataEntry[] {
        return Object.values(arr.reduce((acc, entry) => {
            if (acc[entry.id!]) {
                acc[entry.id!].playCount += entry.playCount;
                acc[entry.id!].playTime += entry.playTime;
                return acc
            }
            acc[entry.id!] = { ...entry };
            return acc;
        }, {} as { [id: string]: PlayDataEntry }));
    }
}