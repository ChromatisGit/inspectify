import JSZip from 'jszip';
import { TrackData, PlayData, ArtistData } from './streamingData';

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
  tracks: {
    data: TrackData;
    ids: { [key: string]: number }
    counter: number;
  };
  artists: {
    data: ArtistData;
    ids: { [key: string]: number };
    counter: number;
  };
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

  const result: MergedResult = { tracks: {data: {}, ids: {}, counter: 0}, artists: {data: {}, ids: {}, counter: 0}, playData: {}}
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

  const trackData = result.tracks.data;
  const artistData = result.artists.data;

  return { playData, trackData, artistData }
}

function convertToPlayFormat(acc: MergedResult, entry: SpotifyEntry) {
  if (entry.ms_played > 30000 && entry.spotify_track_uri) {

    const trackArtistKey = `${entry.master_metadata_track_name}-${entry.master_metadata_album_artist_name}`;
    const artist = entry.master_metadata_album_artist_name
    const period = entry.ts.slice(0, 7);

    let artistId = acc.artists.ids[artist];
    if (!artistId) {
      artistId = acc.artists.counter++;
      acc.artists.ids[artist] = artistId;
      acc.artists.data[artistId] = {
        artist: artist,
        tracks: []
      };
    }

    let trackId = acc.tracks.ids[trackArtistKey];
    if (!trackId) {
      trackId = acc.tracks.counter++;
      acc.tracks.ids[trackArtistKey] = trackId;
      acc.tracks.data[trackId] = {
        track: entry.master_metadata_track_name,
        artist: artist,
        artistId: artistId,
        uri: entry.spotify_track_uri,
        album: entry.master_metadata_album_album_name,
      };
      acc.artists.data[artistId].tracks.push(trackId)
    }

    // Increase Play Count
    const periodMap = acc.playData[period] || (acc.playData[period] = {});
    const newEntry =  periodMap[trackId] || (periodMap[trackId] = {playCount: 0, playTime: 0})

    newEntry.playCount += 1;
    newEntry.playTime += Math.floor(entry.ms_played/1000);
  }

  return acc;
};