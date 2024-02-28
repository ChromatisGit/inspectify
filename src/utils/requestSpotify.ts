"use client"
import { Dispatch, SetStateAction } from "react";
import { SyncResponse, requestManager } from "./request";
import { StreamingDataArray, getJSONFromLocalStorage } from "./streamingData";

export type StreamDataSetter = Dispatch<SetStateAction<StreamingDataArray | []>>

export async function fetchAdditionalData({ uris, type, callback, streamData, setStreamData }: { uris: { uri: string, id: string }[], type: "artists" | "tracks", callback: (response: SyncResponse, parameters?: any) => void, streamData: StreamingDataArray, setStreamData: StreamDataSetter}) {
  const accessToken = localStorage.getItem('access_token')
  if (accessToken === null)
    throw new Error('Access via backend not implemented yet')

  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  sliceArray(uris).forEach((urisChunk) => {
    const idString = urisChunk.map((entry) => entry.uri.slice("spotify:track:".length)).join(',')
    const endpoint = `https://api.spotify.com/v1/${type}?ids=${idString}`

    requestManager.addRequest({
      headers,
      endpoint,
      callback,
      parameters: { uris: urisChunk, type, streamData, setStreamData }
    })
  })
}

function sliceArray<T>(arr: T[], chunkSize: number = 50): T[][] {
  const slicedArrays: T[][] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    slicedArrays.push(arr.slice(i, i + chunkSize));
  }
  return slicedArrays;
}

function validateAdditionalData({ status, request }: SyncResponse) {
  switch (status) {
    case 200:
      break
    case 401:
      requestManager.clearRequestQueue()
      //TODO
      window.location.href = '/';
      console.error('New token required')
      break;
    case 429:
      console.error('Rate limited')
      requestManager.gotRateLimited()
      requestManager.retryRequest(request!)
      break
    case 400:
      throw new Error('Bad request')
    case 403:
      throw new Error('Bad OAuth')
    default:
      throw new Error('Unknown error')
  }
}

interface SpotifyEntry {
  id: string
  images: any
  album: any
}

export function receiveImages(response: SyncResponse, { uris, type, streamData, setStreamData }: { uris: { uri: string; id: string; }[]; type: "artists" | "tracks"; streamData: StreamingDataArray, setStreamData: StreamDataSetter}) {
  validateAdditionalData(response)
  if (response.status !== 200)
    return;

  const dataWithoutId = Object.values(response.content)[0] as SpotifyEntry[];

  const data: SpotifyEntry[]  = dataWithoutId.map((entry,index) => {
    return {...entry, id: uris[index].id}
  })

  const imageMap = data.reduce((acc, entry) => {
    const imageUrl = type === 'artists' ? entry.images?.[2]?.url : entry.album?.images?.[2]?.url;

    acc[entry.id] = imageUrl;
    return acc;
  }, {} as { [key: string]: string });

  streamData = streamData.map(group => {
    group[1] = group[1].map(entry => {
      const imageUrl = imageMap[entry.id!];
      if (imageUrl)
        return { ...entry, imageUrl };
      return entry;
    })
    return group;
  });

  // Update storage
  const storageKey = type === 'artists' ? 'artist_data' : 'track_data'
  const trackData = getJSONFromLocalStorage(storageKey, localStorage);

  uris.forEach(entry => {
    trackData[entry.id].imageUrl = imageMap[entry.id]
  })

  localStorage.setItem(storageKey, JSON.stringify(trackData));

  setStreamData(streamData);
}