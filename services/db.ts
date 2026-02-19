import { SpotifyTrack, VibeSuggestion, SavedPlaylist } from '../types';

const DB_NAME = 'vibeify_db';
const STORE_NAME = 'library_cache';
const SAVED_VIBES_STORE = 'saved_vibes';
const MY_MIXES_STORE = 'my_mixes';
const DB_VERSION = 3; // Incremented version to add my_mixes store

export interface CachedLibrary {
    tracks: SpotifyTrack[];
    lastFetched: number;
}

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
            if (!db.objectStoreNames.contains(SAVED_VIBES_STORE)) {
                db.createObjectStore(SAVED_VIBES_STORE);
            }
            if (!db.objectStoreNames.contains(MY_MIXES_STORE)) {
                db.createObjectStore(MY_MIXES_STORE, { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const saveLibrary = async (tracks: SpotifyTrack[]): Promise<void> => {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const data: CachedLibrary = {
        tracks,
        lastFetched: Date.now()
    };
    store.put(data, 'current_library');
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

export const getCachedLibrary = async (): Promise<CachedLibrary | null> => {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get('current_library');
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
};

export const clearLibrary = async (): Promise<void> => {
    const db = await openDB();
    const tx = db.transaction([STORE_NAME, SAVED_VIBES_STORE, MY_MIXES_STORE], 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.objectStore(SAVED_VIBES_STORE).clear();
    tx.objectStore(MY_MIXES_STORE).clear();
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

export const getSavedVibes = async (): Promise<VibeSuggestion[]> => {
    const db = await openDB();
    const tx = db.transaction(SAVED_VIBES_STORE, 'readonly');
    const store = tx.objectStore(SAVED_VIBES_STORE);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
};

export const toggleBookmark = async (vibe: VibeSuggestion): Promise<boolean> => {
    const db = await openDB();
    const tx = db.transaction(SAVED_VIBES_STORE, 'readwrite');
    const store = tx.objectStore(SAVED_VIBES_STORE);

    const existing = await new Promise((resolve) => {
        const req = store.get(vibe.title);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
    });

    if (existing) {
        store.delete(vibe.title);
    } else {
        store.put(vibe, vibe.title);
    }

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve(!existing);
        tx.onerror = () => reject(tx.error);
    });
};

export const isBookmarked = async (title: string): Promise<boolean> => {
    const db = await openDB();
    const tx = db.transaction(SAVED_VIBES_STORE, 'readonly');
    const store = tx.objectStore(SAVED_VIBES_STORE);
    const request = store.get(title);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(!!request.result);
        request.onerror = () => reject(request.error);
    });
};

export const savePlaylist = async (playlist: SavedPlaylist): Promise<void> => {
    const db = await openDB();
    const tx = db.transaction(MY_MIXES_STORE, 'readwrite');
    const store = tx.objectStore(MY_MIXES_STORE);
    store.put(playlist);
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

export const getSavedPlaylists = async (): Promise<SavedPlaylist[]> => {
    const db = await openDB();
    const tx = db.transaction(MY_MIXES_STORE, 'readonly');
    const store = tx.objectStore(MY_MIXES_STORE);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            const results = request.result || [];
            resolve(results.sort((a: SavedPlaylist, b: SavedPlaylist) => b.createdAt - a.createdAt));
        };
        request.onerror = () => reject(request.error);
    });
};

export const deletePlaylist = async (id: string): Promise<void> => {
    const db = await openDB();
    const tx = db.transaction(MY_MIXES_STORE, 'readwrite');
    const store = tx.objectStore(MY_MIXES_STORE);
    store.delete(id);
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};
