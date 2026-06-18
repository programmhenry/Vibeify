export interface SpotifyUser {
  id: string;
  display_name: string;
  images: { url: string }[];
}

export interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  artists: { id: string; name: string }[];
  album: { name: string; images: { url: string }[]; release_date?: string };
  added_at: string; // ISO date string from 'added_at' in saved tracks
}

export interface Seed {
  id: string;
  name: string;
  type: 'artist' | 'track';
  artist?: string;
  image?: string;
  subtitle?: string;
}

export interface VibeSuggestion {
  title: string;
  description: string;
  prompt: string;
  emoji: string;
}

export interface SavedPlaylist {
  id: string;
  name: string;
  description: string;
  uris: string[];
  reasoning: string;
  createdAt: number;
}

export interface AudioFeatures {
  id: string;
  danceability: number;
  energy: number;
  valence: number;
  tempo: number;
}

export interface EnrichedTrack extends SpotifyTrack {
  features?: AudioFeatures;
}

export enum AppState {
  LOGIN = 'LOGIN',
  SCANNING = 'SCANNING',
  DASHBOARD = 'DASHBOARD',
  GENERATING = 'GENERATING',
  RESULT = 'RESULT',
  SAVED_VIBES = 'SAVED_VIBES',
  CULTURE_DECK = 'CULTURE_DECK',
  PLAYLIST_STUDIO = 'PLAYLIST_STUDIO',
  PLAYLIST_ORGANIZER = 'PLAYLIST_ORGANIZER'
}

export interface SimplifiedPlaylist {
  id: string;
  name: string;
  images: { url: string }[];
  tracks: { total: number };
  owner: { display_name: string };
}

export interface PlaylistRemixResponse {
  playlistName: string;
  description: string;
  remixNotes: string;
  selectedUris: string[];
}

export interface CultureDeckTrack {
  artist: string;
  track_name: string;
  category: 'Anthem' | 'Fan Favorite' | 'Deep Cut' | 'Zeitgeist';
  why_it_matters: string;
  uri?: string;
  image?: string;
}

export interface CultureDeck {
  id: string;
  mode: 'DEFINITIVE_ARTIST' | 'SONIC_BRIDGE' | 'HORIZON_SCAN' | 'ZEITGEIST_RADAR';
  inputContext: string;
  curator_briefing: string;
  playlist_name: string;
  tracks: CultureDeckTrack[];
}

export interface GenerationRequest {
  mode: 'mood' | 'prompt' | 'smart';
  prompt: string;
  useDeepCuts: boolean;
}

export interface SpotifyAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Timestamp in milliseconds
}