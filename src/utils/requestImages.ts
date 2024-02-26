"use client"
import { StreamingDataArray, getJSONFromLocalStorage } from "./streamingData";

export async function fetchImages({ requestImages, streamData, type }: { requestImages: { uri: string, id: string }[], streamData: StreamingDataArray, type: "artists" | "tracks" }) {

  const requestedImages = requestImages.slice(0, 50);
  const remainingImages = requestImages.slice(50);

  const data = await fetchAdditionalData({ uris: requestedImages, type })

  if (data === undefined) {
    await new Promise(resolve => setTimeout(resolve, 5000))
    return { requestImages, streamData }
  }

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

  requestedImages.forEach(entry => {
      trackData[entry.id].imageUrl = imageMap[entry.id]
    })

  localStorage.setItem(storageKey, JSON.stringify(trackData));

  return { requestImages: remainingImages, streamData }
}

export async function fetchAdditionalData({ uris, type }: { uris: { uri: string, id: string }[], type: "artists" | "tracks" }) {
  const idString = uris.map((entry) => entry.uri.slice("spotify:track:".length)).join(',')
  const endpoint = `https://api.spotify.com/v1/${type}?ids=${idString}`

  const accessToken = localStorage.getItem('access_token')
  if (accessToken === null)
    throw new Error('Access via backend not implemented yet')

  try {
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorObj = await response.json();
      console.log(errorObj.error.status === 401)
      //TODO Reauthenticate user
      throw new Error(errorObj.error.message)
    }

    const data: {[key: string]: SpotifyEntry[]} = await response.json();
    const dataWithID: SpotifyEntry[]  = Object.values(data)[0].map((entry,index) => {
      return {...entry, id: uris[index].id}
    })
    return dataWithID

  } catch (error: any) {
    console.error('Error fetching data:', error.message || 'Unknown error');
    return undefined
  }
}

interface SpotifyEntry {
  id: string
  images: any
  album: any
}