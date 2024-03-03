"use client"
import { Dispatch, SetStateAction } from "react";
import { SyncResponse, requestManager } from "./request";
import { ArtistData, StreamingDataArray, TrackData, getJSONFromLocalStorage } from "./streamingData";

export type StreamDataSetter = Dispatch<SetStateAction<StreamingDataArray | []>>

export async function fetchAdditionalData({ uris, type, streamData }: { uris: { uri: string, id: string }[], type: "artists" | "tracks", streamData: StreamDataModifier }) {
  const accessToken = localStorage.getItem('access_token')
  if (accessToken === null)
    throw new Error('Access via backend not implemented yet')

  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  sliceArray(uris).forEach((urisChunk) => {
    const slice = type === "artists" ? "spotify:artist:" : "spotify:track:"
    const idString = urisChunk.map((entry) => entry.uri.slice(slice.length)).join(',')
    const endpoint = `https://api.spotify.com/v1/${type}?ids=${idString}`

    requestManager.addRequest({
      headers,
      endpoint,
      callback: type === "artists" ? receiveArtistData : receiveTrackData,
      parameters: { uris: urisChunk, streamData }
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

interface SpotifyEntry {
  artists: any;
  artist: any;
  id: string
  images: any
  album: any
}

interface StreamDataModifier {
  data: StreamingDataArray,
  setter: StreamDataSetter
  add: 'receivedImages' | 'receivedArtistUris'
}

function receiveTrackData(response: SyncResponse, { uris, streamData }: {
  uris: { uri: string; id: string; }[]; streamData: StreamDataModifier
}) {
  validateAdditionalData(response)
  if (response.status !== 200)
    return;

  const dataWithoutId = Object.values(response.content)[0] as SpotifyEntry[];
  const data: SpotifyEntry[] = dataWithoutId.map((entry, index) => {
    return { ...entry, id: uris[index].id }
  })

  // Update storage
  const imageMap = data.reduce((acc, entry) => {
    const imageUrl = entry.album?.images?.[2]?.url;
    acc[entry.id] = imageUrl;
    return acc;
  }, {} as { [key: string]: string });

  const storageData: TrackData = getJSONFromLocalStorage('track_data', localStorage);
  uris.forEach(entry => {
    storageData[entry.id].imageUrl = imageMap[entry.id]
  })
  localStorage.setItem('track_data', JSON.stringify(storageData));

  const artistUriMap = data.reduce((acc, entry) => {
    const uri = entry.artists[0].uri
    acc[entry.id] = uri;
    return acc;
  }, {} as { [key: string]: string });

  const artistData: ArtistData = getJSONFromLocalStorage('artist_data', localStorage);
  uris.forEach(({ id }) => {
    const artistId = storageData[id].artistId!
    artistData[artistId].uri = artistUriMap[id];
  })
  localStorage.setItem('artist_data', JSON.stringify(artistData));

  switch (streamData.add) {
    case "receivedImages":
      receivedImages({ imageMap, ...streamData })
      break;
    case "receivedArtistUris":
      receivedArtistUris({ artistUriMap, ...streamData })
      break;
  }
}

function receiveArtistData(response: SyncResponse, { uris, streamData }: {
  uris: { uri: string; id: string; }[]; streamData: StreamDataModifier
}) {
  validateAdditionalData(response)
  if (response.status !== 200)
    return;

  const dataWithoutId = Object.values(response.content)[0] as SpotifyEntry[];
  const data: SpotifyEntry[] = dataWithoutId.map((entry, index) => {
    return { ...entry, id: uris[index].id }
  })

  // Update storage
  const imageMap = data.reduce((acc, entry) => {
    const imageUrl = entry.images?.[2]?.url;
    acc[entry.id] = imageUrl;
    return acc;
  }, {} as { [key: string]: string });

  const storageData: ArtistData = getJSONFromLocalStorage('artist_data', localStorage);
  uris.forEach(entry => {
    storageData[entry.id].imageUrl = imageMap[entry.id]
  })
  localStorage.setItem('artist_data', JSON.stringify(storageData));

  switch (streamData.add) {
    case "receivedImages":
      receivedImages({ imageMap, ...streamData })
      break;
  }
}

function receivedImages({ imageMap, data, setter }:
  { imageMap: { [key: string]: string; }, data: StreamingDataArray, setter: StreamDataSetter }) {
  data = data.map(group => {
    group[1] = group[1].map(entry => {
      const imageUrl = imageMap[entry.id!];
      if (imageUrl)
        return { ...entry, imageUrl };
      return entry;
    })
    return group;
  });

  setter(data);
}

async function receivedArtistUris({ artistUriMap, data, setter }:
  { artistUriMap: { [key: string]: string; }, data: StreamingDataArray, setter: StreamDataSetter }) {

  data = data.map(group => {
    group[1] = group[1].map(entry => {
      const artistUri = artistUriMap[entry.id!];
      if (artistUri)
        return { ...entry, artistUri };
      return entry;
    })
    return group;
  });

  const uris = Object.entries(artistUriMap).map(([a, b]) => {return {id: a, uri: b}} )
  fetchAdditionalData({
    uris: uris,
    type: 'artists',
    streamData: {
      setter,
      data,
      add: 'receivedImages'
    }
  })
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