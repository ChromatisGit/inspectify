import JSZip from 'jszip';

interface SpotifyEntry {
  ts: string,
  ms_played: number,
  master_metadata_track_name: string,
  master_metadata_album_artist_name: string,
  master_metadata_album_album_name: string,
  spotify_track_uri: string
}

interface PlayCountData {
  [key: string]: { [key: number]: number }
}

interface TrackData {
  [key: number]:
  {
    track: string,
    artist: string,
    uri: string,
    album: string
  }
}

interface MergedResult {
  playCountData: PlayCountData;
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

  if (folderNames.length !== 1)
    return { error: 'unknownZipError' };

  if (folderNames[0] === 'Spotify Account Data/')
    return { error: 'accountDataError' };

  if (folderNames[0] !== 'Spotify Extended Streaming History/')
    return { error: 'unknownZipError' };

  const result: MergedResult = { ids: {}, trackData: {}, playCountData: {}, idCounter: 1 }
  try {
    await Promise.all(
      Object.keys(zipFile.files).map(async (filename) => {
        const fileData = await zipFile.files[filename].async('string');
        if (filename.endsWith('.json')) {
          try {
            const spotifyData: SpotifyEntry[] = JSON.parse(fileData)
            spotifyData.reduce((acc, entry) => convertToPlayCountFormat(acc, entry), result)
          } catch (error) {
            throw new Error('corruptJSONError');
          }
        }
      })
    );

  } catch (error) {
    return { error: 'corruptJSONError' };
  }

  const playCountData = Object.keys(result.playCountData).sort().reduce(
    (obj, key) => {
      obj[key] = result.playCountData[key];
      return obj;
    },
    {} as PlayCountData
  );

  const { trackData } = result;

  return { playCountData, trackData }
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
    const periodMap = acc.playCountData[period] || (acc.playCountData[period] = {});
    periodMap[id] = (periodMap[id] ?? 0) + 1;
  }

  return acc;
};