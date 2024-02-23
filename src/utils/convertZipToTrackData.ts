import JSZip from 'jszip';
import { TrackData, PlayData } from './streamingData';

interface SpotifyEntry {
  ts: string,
  ms_played: number,
  master_metadata_track_name: string,
  master_metadata_album_artist_name: string,
  master_metadata_album_album_name: string,
  spotify_track_uri: string
}

interface MergedResult {
  playData: PlayDataObj;
  trackData: TrackData;
  idCounter: number;
  ids: { [key: string]: number };
}

interface PlayDataObj {
  [group: string]: {
    [entry: string]: {
        playTime: number; playCount: number
    }
}
}

export async function convertZipToTrackData(file: File) {
  const zip = new JSZip();

  const zipFile = await zip.loadAsync(file, { createFolders: true });

  const folderNames = Object.keys(zipFile.files).filter((filename) =>
    zipFile.files[filename].dir
  );

  if (folderNames.length === 1 && folderNames[0] === 'Spotify Account Data/')
    throw new Error('upload.accountDataError');

  if (folderNames.length !== 1 || folderNames[0] !== 'Spotify Extended Streaming History/')
    throw new Error('upload.unknownZipError')

  const result: MergedResult = { ids: {}, trackData: {}, playData: {}, idCounter: 1 }
  await Promise.all(
    Object.keys(zipFile.files).map(async (filename) => {
      const fileData = await zipFile.files[filename].async('string');
      if (filename.endsWith('.json')) {
        try {
          const spotifyData: SpotifyEntry[] = JSON.parse(fileData)
          spotifyData.reduce((acc, entry) => convertToPlayFormat(acc, entry), result)
        } catch (error) {
          console.error(error)
          throw new Error('upload.corruptJSONError')
        }
      }
    })
  );

  const playData: PlayData = Object.keys(result.playData).sort().reduce(
    (obj, key) => {
      obj[key] = Object.entries(result.playData[key]).map(([id, entry]) => ({ id, ...entry }));
      return obj;
    },
    {} as PlayData
  );

  const { trackData } = result;

  return { playData, trackData }
}

function convertToPlayFormat(acc: MergedResult, entry: SpotifyEntry) {
  if (entry.ms_played > 30000 && entry.master_metadata_track_name) {

    const trackArtistKey = `${entry.master_metadata_track_name}-${entry.master_metadata_album_artist_name}`;
    const period = entry.ts.slice(0, 7);

    let id = acc.ids[trackArtistKey];

    // Check if the combination of track and artist has an id
    if (!id) {
      id = acc.idCounter++;
      acc.ids[trackArtistKey] = id;
      acc.trackData[id] = {
        track: entry.master_metadata_track_name,
        artist: entry.master_metadata_album_artist_name,
        uri: entry.spotify_track_uri,
        album: entry.master_metadata_album_album_name,
      };
    }

    // Increase Play Count
    const periodMap = acc.playData[period] || (acc.playData[period] = {});
    const newEntry =  periodMap[id] || (periodMap[id] = {playCount: 0, playTime: 0})

    newEntry.playCount += 1;
    newEntry.playTime += Math.floor(entry.ms_played/1000);
  }

  return acc;
};