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
  playData: PlayData;
  trackData: TrackData;
  idCounter: number;
  ids: { [key: string]: number };
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
          spotifyData.reduce((acc, entry) => convertToPlayCountFormat(acc, entry), result)
        } catch (error) {
          throw new Error('upload.corruptJSONError')
        }
      }
    })
  );

  const playData = Object.keys(result.playData).sort().reduce(
    (obj, key) => {
      obj[key] = result.playData[key];
      return obj;
    },
    {} as PlayData
  );

  const { trackData } = result;

  return { playData, trackData }
}

function convertToPlayCountFormat(acc: MergedResult, entry: SpotifyEntry) {
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
    periodMap[id].playCount = (periodMap[id].playCount ?? 0) + 1;
    periodMap[id].playTime = (periodMap[id].playTime ?? 0) + Math.floor(entry.ms_played/1000);
  }

  return acc;
};