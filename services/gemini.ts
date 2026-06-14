import { GoogleGenAI, Type } from "@google/genai";
import { SpotifyTrack, CultureDeck, CultureDeckTrack } from '../types';

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

export interface CultureDeckResponse {
  playlist_name: string;
  curator_briefing: string;
  tracks: CultureDeckTrack[];
}

export const generateCultureDeck = async (
  mode: 'DEFINITIVE_ARTIST' | 'SONIC_BRIDGE' | 'HORIZON_SCAN' | 'ZEITGEIST_RADAR',
  inputContext: string
): Promise<CultureDeckResponse> => {
  const systemInstruction = `
    You are an elite musicologist, cultural historian, and legendary DJ.
    Your task is to generate a highly curated "Culture Deck" playlist structure based on the chosen mode.
    
    CRITICAL RULES FOR EACH MODE:
    1. "DEFINITIVE_ARTIST": 
       - User Input: Name of an artist.
       - Provide EXACTLY 20-25 tracks.
       - EXACTLY 5 tracks with category "Anthem" (the artist's biggest, defining global hits).
       - EXACTLY 5 tracks with category "Fan Favorite" (deeper album cuts loved by fans).
       - EXACTLY 5 tracks with category "Deep Cut" (obscure, rare, or early tracks showing the artist's DNA).
       - EXACTLY 5-10 tracks with category "Zeitgeist" (recent relevant tracks, new collabs, or contemporary tracks that show their current standing in culture).
    
    2. "SONIC_BRIDGE":
       - User Input: Format "Genre/Artist A to Genre/Artist B" (e.g. "Hip Hop to House").
       - Curate a playlist of 15-20 tracks that smoothly transition from A to B.
       - Use crossover artists (e.g. Kaytranada, Channel Tres, etc.).
       - Categorize tracks based on where they lie: "Anthem" (huge crossover hits), "Fan Favorite" (definitive bridge tracks), "Deep Cut" (underground fusion), "Zeitgeist" (brand new tracks executing this fusion).
       
    3. "HORIZON_SCAN":
       - User Input: A specific subculture, decade, or city (e.g. "UK Grime 2015", "Detroit Techno 90s").
       - Curate 15-20 historical, fundamental tracks of this specific movement.
       - Categorize: "Anthem" (scene giants), "Fan Favorite" (cult classics), "Deep Cut" (obscure/raw tracks that shaped the subculture), "Zeitgeist" (contemporary tracks keeping that specific spirit alive).
       
    4. "ZEITGEIST_RADAR":
       - User Input: A list of artists separated by commas (e.g. "Drake, Travis Scott, Kanye West") or general trend.
       - Curate 15-20 brand new, progressive tracks (e.g., 3-5 songs per artist if multiple artists are given, or top trending tracks).
       - All tracks must be from different artists if possible, representing the cutting edge of current musical discourse.
       - Categorize all of these as "Zeitgeist".
    
    For each track, you MUST provide a "why_it_matters" field explaining in 1-2 short sentences its exact cultural relevance or context.
    Return the response as a strict JSON matching the schema. Do not hallucinate artists and song titles; verify they exist.
  `;

  const userPrompt = `
    Mode: ${mode}
    Input Context: "${inputContext}"
    
    Generate the playlist. Ensure all tracks are real, and provide the curator_briefing explaining the historical/cultural context of this selection in 3-4 elegant sentences.
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
          playlist_name: { type: Type.STRING },
          curator_briefing: { type: Type.STRING },
          tracks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                artist: { type: Type.STRING },
                track_name: { type: Type.STRING },
                category: { 
                  type: Type.STRING, 
                  enum: ["Anthem", "Fan Favorite", "Deep Cut", "Zeitgeist"] 
                },
                why_it_matters: { type: Type.STRING }
              },
              required: ["artist", "track_name", "category", "why_it_matters"]
            }
          }
        },
        required: ["playlist_name", "curator_briefing", "tracks"]
      }
    }
  });

  if (!response.text) throw new Error("AI returned empty response");
  return JSON.parse(response.text) as CultureDeckResponse;
};

export const rerollCultureDeck = async (
  currentDeck: CultureDeck
): Promise<CultureDeckResponse> => {
  const systemInstruction = `
    You are an elite musicologist. You are performing a "Dynamic Reroll" on a Culture Deck.
    
    RULES:
    1. KEEP ALL tracks categorized as "Anthem" exactly as they are.
    2. REPLACE all tracks categorized as "Fan Favorite", "Deep Cut", and "Zeitgeist" (if applicable) with alternative, equally good tracks fitting the same theme/mode ("${currentDeck.mode}") and context ("${currentDeck.inputContext}").
    3. The size of the playlist must match the original.
    4. Provide a new curator_briefing that reflects the updated selection.
    5. Return the result in strict JSON format.
  `;

  const userPrompt = `
    Current Deck Name: ${currentDeck.playlist_name}
    Current Tracks:
    ${JSON.stringify(currentDeck.tracks)}
    
    Perform a Reroll. Retain the "Anthem" tracks, but supply new replacements for the other categories. Ensure all songs are real.
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
          playlist_name: { type: Type.STRING },
          curator_briefing: { type: Type.STRING },
          tracks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                artist: { type: Type.STRING },
                track_name: { type: Type.STRING },
                category: { 
                  type: Type.STRING, 
                  enum: ["Anthem", "Fan Favorite", "Deep Cut", "Zeitgeist"] 
                },
                why_it_matters: { type: Type.STRING }
              },
              required: ["artist", "track_name", "category", "why_it_matters"]
            }
          }
        },
        required: ["playlist_name", "curator_briefing", "tracks"]
      }
    }
  });

  if (!response.text) throw new Error("AI returned empty response");
  return JSON.parse(response.text) as CultureDeckResponse;
};