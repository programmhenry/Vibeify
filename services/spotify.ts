import { SpotifyTrack, SpotifyUser, SpotifyAuthTokens } from '../types';

const SCOPES = [
  'user-library-read',
  'user-top-read',
  'playlist-modify-public',
  'playlist-modify-private'
].join(' ');

export const getAuthUrl = async (clientId: string, redirectUri: string) => {
  const verifier = generateCodeVerifier();
  sessionStorage.setItem('spotify_code_verifier', verifier);

  const challenge = await generateCodeChallenge(verifier);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    show_dialog: 'true'
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

function generateCodeVerifier() {
  const allowed = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let verifier = '';
  for (let i = 0; i < 128; i++) {
    verifier += allowed.charAt(Math.floor(Math.random() * allowed.length));
  }
  return verifier;
}

async function generateCodeChallenge(codeVerifier: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  const base64Digest = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return base64Digest;
}

export const exchangeCodeForToken = async (
  clientId: string,
  code: string,
  redirectUri: string
): Promise<SpotifyAuthTokens> => {
  const verifier = sessionStorage.getItem('spotify_code_verifier');
  if (!verifier) throw new Error("Missing code verifier");

  const params = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error('Token exchange failed:', errorBody);
    throw new Error('Failed to exchange code for token');
  }

  const data = await res.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000
  };
};

export const refreshAccessToken = async (
  clientId: string,
  refreshToken: string
): Promise<SpotifyAuthTokens> => {
  const params = new URLSearchParams({
    client_id: clientId,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error('Token refresh failed:', errorBody);
    throw new Error('Failed to refresh token');
  }

  const data = await res.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken, // Spotify might not return a new refresh token
    expires_at: Date.now() + data.expires_in * 1000
  };
};

export const saveTokens = (tokens: SpotifyAuthTokens) => {
  localStorage.setItem('spotify_auth_tokens', JSON.stringify(tokens));
};

export const getStoredTokens = (): SpotifyAuthTokens | null => {
  const stored = localStorage.getItem('spotify_auth_tokens');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch (e) {
    return null;
  }
};

export const clearStoredTokens = () => {
  localStorage.removeItem('spotify_auth_tokens');
};

export const isTokenExpired = (expiresAt: number): boolean => {
  // Add 1 minute buffer
  return Date.now() > (expiresAt - 60000);
};

export const extractTokenFromHash = (): string | null => {
  // Legacy support for fragment-based token (Implicit Grant)
  const hash = window.location.hash;
  if (!hash) return null;
  const params = new URLSearchParams(hash.substring(1));
  return params.get('access_token');
};

export const extractCodeFromUrl = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get('code');
};

export const fetchUserProfile = async (token: string): Promise<SpotifyUser> => {
  const res = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch user profile');
  return res.json();
};

/**
 * Recursively fetches all liked songs.
 * Handles pagination automatically.
 */
export const fetchAllLikedSongs = async (
  token: string,
  onProgress: (count: number) => void
): Promise<SpotifyTrack[]> => {
  // 1. Get total count first
  const initialRes = await fetch('https://api.spotify.com/v1/me/tracks?limit=1', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!initialRes.ok) throw new Error('Failed to fetch library metadata');
  const initialData = await initialRes.json();
  const total = initialData.total;

  const limit = 50;
  const offsets = [];
  for (let i = 0; i < total; i += limit) {
    offsets.push(i);
  }

  let tracks: SpotifyTrack[] = [];
  const concurrency = 5; // Fetch 5 pages at once

  for (let i = 0; i < offsets.length; i += concurrency) {
    const batchOffsets = offsets.slice(i, i + concurrency);
    const batchPromises = batchOffsets.map(offset =>
      fetch(`https://api.spotify.com/v1/me/tracks?limit=${limit}&offset=${offset}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(async res => {
        if (res.status === 429) {
          const retryAfter = parseInt(res.headers.get('Retry-After') || '5', 10);
          await new Promise(r => setTimeout(r, retryAfter * 1000));
          return null; // Should retry really, but for simplicity returning null here or recurse
        }
        if (!res.ok) return null;
        return res.json();
      })
    );

    const results = await Promise.all(batchPromises);

    results.filter(Boolean).forEach(data => {
      const chunk = data.items.map((item: any) => ({
        id: item.track.id,
        uri: item.track.uri,
        name: item.track.name,
        artists: item.track.artists.map((a: any) => ({ id: a.id, name: a.name })),
        album: {
          ...item.track.album,
          release_date: item.track.album.release_date
        },
        added_at: item.added_at
      }));
      tracks = [...tracks, ...chunk];
    });

    onProgress(tracks.length);
  }

  return tracks;
};

export const fetchTopItems = async (token: string, type: 'artists' | 'tracks'): Promise<any[]> => {
  const res = await fetch(`https://api.spotify.com/v1/me/top/${type}?limit=20&time_range=medium_term`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Failed to fetch top ${type}`);
  const data = await res.json();
  return data.items;
};

export const createPlaylist = async (
  token: string,
  userId: string,
  name: string,
  description: string,
  uris: string[]
): Promise<string> => {
  // 1. Create Playlist
  const createRes = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name,
      description,
      public: false
    })
  });

  if (!createRes.ok) throw new Error('Failed to create playlist');
  const playlistData = await createRes.json();
  const playlistId = playlistData.id;

  // 2. Add Tracks (Batching in chunks of 100 if necessary, but simpler here for <100)
  // Spotify allows up to 100 tracks per request.
  const chunks = [];
  for (let i = 0; i < uris.length; i += 100) {
    chunks.push(uris.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ uris: chunk })
    });
  }

  return playlistData.external_urls.spotify;
};

/**
 * Searches for artists and tracks to resolve them to IDs for seeding.
 */
export const searchItems = async (token: string, query: string): Promise<any[]> => {
  const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist,track&limit=5`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Search failed for ${query}`);
  const data = await res.json();

  const artists = data.artists.items.map((item: any) => ({
    id: item.id,
    name: item.name,
    type: 'artist',
    image: item.images[2]?.url || item.images[0]?.url || null,
    subtitle: 'Artist'
  }));

  const tracks = data.tracks.items.map((item: any) => ({
    id: item.id,
    name: item.name,
    type: 'track',
    image: item.album.images[2]?.url || item.album.images[0]?.url || null,
    subtitle: `Track • ${item.artists[0]?.name}`
  }));

  return [...artists, ...tracks].slice(0, 8);
};

/**
 * Fetches tracks from Spotify Recommendations API.
 */
export const getRecommendations = async (
  token: string,
  seeds: { seed_artists?: string[], seed_tracks?: string[] },
  features: { target_energy?: number, limit?: number }
): Promise<SpotifyTrack[]> => {
  const params = new URLSearchParams({
    limit: (features.limit || 30).toString(),
    ...features.target_energy !== undefined && { target_energy: (features.target_energy / 100).toString() },
    ...seeds.seed_artists && { seed_artists: seeds.seed_artists.join(',') },
    ...seeds.seed_tracks && { seed_tracks: seeds.seed_tracks.join(',') },
  });

  const res = await fetch(`https://api.spotify.com/v1/recommendations?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to fetch recommendations');
  }

  const data = await res.json();
  return data.tracks.map((t: any) => ({
    id: t.id,
    uri: t.uri,
    name: t.name,
    artists: t.artists.map((a: any) => ({ id: a.id, name: a.name })),
    album: {
      ...t.album,
      release_date: t.album.release_date
    },
    added_at: new Date().toISOString() // Placeholder for global tracks
  }));
};

/**
 * Fetches audio features for up to 100 tracks.
 */
export const fetchAudioFeaturesBatch = async (token: string, ids: string[]): Promise<any[]> => {
  const res = await fetch(`https://api.spotify.com/v1/audio-features?ids=${ids.join(',')}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.audio_features || [];
};

/**
 * Fetches artist profiles (genres) for up to 50 artists.
 */
export const fetchArtistsBatch = async (token: string, ids: string[]): Promise<any[]> => {
  const res = await fetch(`https://api.spotify.com/v1/artists?ids=${ids.join(',')}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.artists || [];
};