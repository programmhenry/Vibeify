import { GoogleGenAI, Type } from "@google/genai";
import { SpotifyTrack } from '../types';

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY
});

interface PlaylistResponse {
  playlistName: string;
  description: string;
  selectedUris: string[];
  reasoning: string;
}

export const generatePlaylistFromLibrary = async (
  library: SpotifyTrack[],
  prompt: string,
  mode: 'vibe' | 'smart' | 'deep_cuts',
  seeds: string[] = [],
  deepCutDateThreshold?: string,
  targetCount: number = 30
): Promise<PlaylistResponse> => {

  // Optimization: Reduce token count by mapping to a minimal string format
  const simplifiedLibrary = library.map(t => ({
    id: t.id,
    uri: t.uri,
    artist: t.artists[0]?.name || 'Unknown Artist',
    title: t.name,
    added: t.added_at.split('T')[0]
  }));

  const systemInstruction = `
    You are an elite music curator and professional DJ.
    Your task is to select a subset of songs from the User's Library that perfectly match the requested vibe.
    
    RULES:
    1. PLAYLIST LENGTH: Aim for exactly ${targetCount} tracks if possible. Never return fewer than 15.
    2. COHESION: Prioritize musical flow and thematic harmony. 
    3. SEEDS: If the user provides seed artists or tracks, use them as the primary anchors for the playlist's sound.
    4. ACCURACY: ONLY select songs from the provided list. Do not hallucinate.
    5. RETURN FORMAT: Strict JSON.
  `;

  const userPrompt = `
    Task Mode: ${mode}
    ${seeds.length > 0 ? `Primary Seeds: ${seeds.join(', ')}` : ''}
    User Request: "${prompt}"

    My Library (Sample):
    ${JSON.stringify(simplifiedLibrary.slice(0, 1000))}

    Analyze my library and find a coherent set of ${targetCount} songs that fit this vibe perfectly.
    ${mode === 'deep_cuts' ? `Strictly prioritize older songs added before ${deepCutDateThreshold || '2023-01-01'}.` : ""}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: userPrompt,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          playlistName: { type: Type.STRING },
          description: { type: Type.STRING },
          selectedUris: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Array of Spotify URIs matching the criteria"
          },
          reasoning: { type: Type.STRING, description: "Why you chose this set of songs" }
        },
        required: ["playlistName", "description", "selectedUris", "reasoning"]
      }
    }
  });

  if (!response.text) {
    throw new Error("AI returned empty response");
  }

  return JSON.parse(response.text) as PlaylistResponse;
};

export const refinePlaylist = async (
  library: SpotifyTrack[],
  currentPlaylist: PlaylistResponse,
  refinementPrompt: string,
  targetCount: number = 30
): Promise<PlaylistResponse> => {
  const simplifiedLibrary = library.map(t => ({
    id: t.id,
    uri: t.uri,
    artist: t.artists[0]?.name || 'Unknown Artist',
    title: t.name
  }));

  const systemInstruction = `
    You are an elite music curator. You are refining an existing playlist based on user feedback.
    
    CURRENT PLAYLIST:
    Name: ${currentPlaylist.playlistName}
    Current Tracks: ${currentPlaylist.selectedUris.length} tracks selected.
    
    USER FEEDBACK: "${refinementPrompt}"
    
    RULES:
    1. ADJUSTMENT: You can add new tracks from the library, remove tracks from the current selection, or completely overhaul it if the prompt suggests a major shift.
    2. LENGTH: Aim for exactly ${targetCount} tracks.
    3. RETURN FORMAT: Strict JSON matching the previous schema.
    4. ACCURACY: ONLY select songs from the provided library.
  `;

  const userPrompt = `
    Library (Sample):
    ${JSON.stringify(simplifiedLibrary.slice(0, 800))}
    
    Current Selection URIs:
    ${JSON.stringify(currentPlaylist.selectedUris)}
    
    Refine the playlist based on the feedback: "${refinementPrompt}".
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: userPrompt,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          playlistName: { type: Type.STRING },
          description: { type: Type.STRING },
          selectedUris: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          reasoning: { type: Type.STRING }
        },
        required: ["playlistName", "description", "selectedUris", "reasoning"]
      }
    }
  });

  if (!response.text) throw new Error("AI refinement failed");
  return JSON.parse(response.text) as PlaylistResponse;
};

export interface TasteDNA {
  tags: string[];
  featured: {
    title: string;
    description: string;
    prompt: string;
    emoji: string;
  };
  categories: {
    title: string;
    items: {
      title: string;
      description: string;
      prompt: string;
      emoji: string;
    }[];
  }[];
}

export const analyzeTasteDNA = async (
  library: SpotifyTrack[],
  topArtists: any[],
  topTracks: any[]
): Promise<TasteDNA> => {
  const systemInstruction = `
    You are a master musicologist and data scientist. 
    Analyze the user's music library and top listening stats to define their "Taste DNA".
    
    1. Provide 5-7 concise, moody tags (e.g. "Hyperpop Enthusiast", "90s Grunge Revivalist", "Nocturnal Lo-Fi").
    2. Suggest exactly 10 creative playlist scenarios.
    3. Select the single most relevant and "wowing" suggestion as the 'featured' item.
    4. Group the remaining 9 suggestions into exactly 3 categories with these titles:
       - 'Based on Recent Listening' (focus on top artists/tracks)
       - 'Nostalgia Trips' (focus on older sounds or 80s/90s/00s vibes)
       - 'Time of Day' (Energy for morning, Chill/Ambient for evening - check local time context if possible, or provide a mix)
    
    Each category MUST have exactly 3 items.
    Return the result in strict JSON format.
  `;

  const simplifiedLibrary = library.slice(0, 50).map(t => `${t.name} by ${t.artists[0]?.name || 'Unknown'}`);
  const simplifiedTop = {
    artists: topArtists.slice(0, 10).map(a => a.name),
    tracks: topTracks.slice(0, 10).map(t => t.name)
  };

  const userPrompt = `
    Context (Current Time): ${new Date().toLocaleTimeString()}
    User Library Sample: ${simplifiedLibrary.join(', ')}
    User Top Artists: ${simplifiedTop.artists.join(', ')}
    User Top Tracks: ${simplifiedTop.tracks.join(', ')}
    
    Identify my Taste DNA and group recommendations into the 3 specified categories.
  `;

  const vibeSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      prompt: { type: Type.STRING },
      emoji: { type: Type.STRING }
    },
    required: ["title", "description", "prompt", "emoji"]
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: userPrompt,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          featured: vibeSchema,
          categories: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                items: { type: Type.ARRAY, items: vibeSchema }
              },
              required: ["title", "items"]
            }
          }
        },
        required: ["tags", "featured", "categories"]
      }
    }
  });

  if (!response.text) throw new Error("AI analysis failed");
  return JSON.parse(response.text) as TasteDNA;
};

export const generateMusicalBio = async (stats: {
  archetype: string;
  topGenres: string[];
  audioFeatures: any;
}): Promise<string> => {
  const systemInstruction = `
    You are a professional musicologist and high-end audio critic. 
    Write a precise, almost scientific analysis of a user's musical identity based on their stats. 
    
    TONE: 
    - Analytical, elegant, and sophisticated.
    - Avoid jokes, slang, or generic lifestyle attributes.
    - Style: Like a review in a prestigious architectural or high-end audio journal.

    RULES:
    - Refer to the user by their Archetype: ${stats.archetype}.
    - Headline: Start with the Archetype name.
    - Body: 1-2 sentences max. 
    - Grounding: Strictly analyze the tension or harmony between their Top Genres (${stats.topGenres.join(', ')}) and the audio features provided. Mention specific artists if they help anchor the analysis.
    - Keep it under 280 characters.
  `;

  const userPrompt = `
    Archetype: ${stats.archetype}
    Top Genres: ${stats.topGenres.join(', ')}
    Audio Profile (Averages): ${JSON.stringify(stats.audioFeatures)}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: userPrompt,
    config: {
      systemInstruction: systemInstruction,
    }
  });

  return response.text || "Your musical soul is a beautiful mystery.";
};