import React, { useState, useEffect } from 'react';
import { AppState, SpotifyUser, SpotifyTrack, GenerationRequest, Seed, CultureDeck, CultureDeckTrack } from './types';
import * as SpotifyService from './services/spotify';
import * as GeminiService from './services/gemini';
import {
  Music,
  Search,
  Zap,
  LogOut,
  Loader2,
  ListMusic,
  CheckCircle,
  Archive,
  CloudLightning,
  Copy,
  Heart,
  History,
  Info,
  Plus,
  RefreshCw,
  Trash2,
  X,
  Wand2,
  Sparkles,
  Waves,
  Globe,
  Library,
  Compass,
  Trophy,
  Menu,
  ChevronRight,
  User,
  Share2,
  BarChart3,
  Dna
} from 'lucide-react';
import * as DBService from './services/db';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { toPng } from 'html-to-image';

// Sub-components defined here for single-file constraints in XML structure, 
// but logically separated.

const Button = ({ children, onClick, variant = 'primary', disabled = false, className = '' }: any) => {
  const base = "px-6 py-3 rounded-full font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-[#1DB954] text-black hover:bg-[#1ed760]",
    secondary: "bg-white text-black hover:bg-gray-200",
    outline: "border border-gray-500 text-white hover:border-white",
    ghost: "text-gray-400 hover:text-white"
  };
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variants[variant as keyof typeof variants]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

const Sidebar = ({
  appState,
  setAppState,
  library,
  savedVibes,
  myMixes,
  tasteDNA,
  user,
  lastFetched,
  isRescanning,
  handleRescan,
  handleDeleteMix,
  setGeneratedResult,
  setGeneratedCultureDeck,
  onLogout,
  isOpen,
  onClose,
  onOpenDNA
}: any) => {
  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside className={`fixed md:relative top-0 left-0 bottom-0 w-72 md:w-64 bg-black p-6 flex flex-col gap-8 border-r border-[#282828] h-full shrink-0 z-[300] transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-xl cursor-pointer" onClick={() => { setAppState(AppState.DASHBOARD); onClose(); }}>
            <Music className="text-[#1DB954]" /> Vibeify
          </div>
          <button onClick={onClose} className="md:hidden text-gray-500 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-8 min-h-0 overflow-hidden">
          <div>
            <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4">Your Library</div>
            <div className="space-y-4">
              <button
                onClick={() => { setAppState(AppState.DASHBOARD); onClose(); }}
                className={`flex items-center gap-3 w-full text-left transition-colors ${appState === AppState.DASHBOARD ? 'text-[#1DB954] font-bold' : 'text-gray-300 hover:text-white'}`}
              >
                <Zap size={18} /> Dashboard
              </button>
              <button
                onClick={() => { setAppState(AppState.CULTURE_DECK); onClose(); }}
                className={`flex items-center gap-3 w-full text-left transition-colors ${appState === AppState.CULTURE_DECK ? 'text-[#1DB954] font-bold' : 'text-gray-300 hover:text-white'}`}
              >
                <Compass size={18} /> Culture Deck
              </button>
              <button
                onClick={() => { setAppState(AppState.SAVED_VIBES); onClose(); }}
                className={`flex items-center gap-3 w-full text-left transition-colors ${appState === AppState.SAVED_VIBES ? 'text-[#1DB954] font-bold' : 'text-gray-300 hover:text-white'}`}
              >
                <Heart size={18} className={savedVibes.length > 0 ? 'fill-[#1DB954] text-[#1DB954]' : ''} /> Saved Vibes
                {savedVibes.length > 0 && <span className="ml-auto bg-[#1DB954] text-black text-[10px] px-1.5 py-0.5 rounded-full font-bold">{savedVibes.length}</span>}
              </button>
              <div className="flex items-center gap-3 text-gray-300">
                <Archive size={18} /> {library.length} Songs Scanned
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4">My Mixes</div>
            <div className="space-y-1 flex-1 overflow-y-auto custom-scrollbar no-scrollbar">
              {myMixes.length === 0 && <p className="text-xs text-gray-600 italic">No saved mixes yet.</p>}
              {myMixes.map((mix: any) => (
                <div key={mix.id} className="group relative flex items-center">
                  <button
                    onClick={() => {
                      if (mix.isCultureDeck) {
                        setGeneratedCultureDeck(mix.cultureDeckData);
                        setAppState(AppState.CULTURE_DECK);
                      } else {
                        setGeneratedResult({
                          name: mix.name,
                          desc: mix.description,
                          uris: mix.uris,
                          reasoning: mix.reasoning
                        });
                        setAppState(AppState.RESULT);
                      }
                      onClose();
                    }}
                    className="flex-1 text-left py-2 px-3 rounded hover:bg-[#282828] text-sm text-gray-400 hover:text-white transition-all truncate flex items-center gap-2"
                  >
                    <ListMusic size={14} className="text-[#1DB954] shrink-0" />
                    <span className="truncate">{mix.name}</span>
                  </button>
                  <button
                    onClick={(e) => handleDeleteMix(e, mix.id)}
                    className="absolute right-1 opacity-0 group-hover:opacity-100 p-1.5 text-gray-600 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {tasteDNA && (
          <div
            className="mt-4 shrink-0 cursor-pointer group"
            onClick={() => { setAppState(AppState.DASHBOARD); onOpenDNA(); }}
          >
            <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4 group-hover:text-[#1DB954] flex items-center gap-2">
              Taste DNA <Sparkles size={12} />
            </div>
            <div className="flex flex-wrap gap-2">
              {tasteDNA.tags.map((tag: string) => (
                <span key={tag} className="text-[10px] bg-purple-900/40 text-purple-300 px-2 py-1 rounded border border-purple-900/50 group-hover:border-purple-500/50 transition-colors">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {user && (
          <div className="mt-auto pt-8 border-t border-[#282828] space-y-4 shrink-0">
            <div
              className="flex items-center gap-3 cursor-pointer group p-2 -m-2 rounded-xl hover:bg-white/5 transition-colors"
              onClick={onOpenDNA}
            >
              {user.images?.[0] ? (
                <img src={user.images[0].url} alt="Profile" className="w-10 h-10 rounded-full shadow-lg group-hover:ring-2 ring-[#1DB954] transition-all" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#282828] flex items-center justify-center group-hover:ring-2 ring-[#1DB954] transition-all">
                  <User size={20} className="text-gray-400" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white group-hover:text-[#1DB954] transition-colors">{user.display_name}</span>
                {lastFetched && (
                  <span className="text-[10px] text-gray-500">
                    Synced {new Date(lastFetched).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleRescan}
              disabled={isRescanning}
              className="w-full flex items-center gap-2 text-xs text-gray-400 hover:text-[#1DB954] transition-colors py-2 px-2 rounded hover:bg-[#1DB954]/5 group"
            >
              <RefreshCw size={14} className={`${isRescanning ? 'animate-spin text-[#1DB954]' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              {isRescanning ? 'Syncing...' : 'Rescan Library'}
            </button>

            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-full text-left py-2 px-2"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

const getGradientByVibe = (title: string): string => {
  const t = title.toLowerCase();

  if (t.includes('night') || t.includes('dark') || t.includes('melancholic') || t.includes('focus') || t.includes('underground') || t.includes('rainy') || t.includes('stormy'))
    return 'bg-gradient-to-br from-[#2e1065] via-[#000000] to-[#047857]';

  if (t.includes('summer') || t.includes('sunny') || t.includes('beach') || t.includes('energy') || t.includes('gym') || t.includes('love') || t.includes('pop') || t.includes('road'))
    return 'bg-gradient-to-br from-[#f97316] via-[#ec4899] to-[#eab308]';

  if (t.includes('gold') || t.includes('luxury') || t.includes('ego') || t.includes('classic') || t.includes('dreamy') || t.includes('nostalgia'))
    return 'bg-gradient-to-br from-[#ca8a04] via-[#000000] to-[#991b1b]';

  if (t.includes('morning') || t.includes('fresh') || t.includes('upbeat'))
    return 'bg-gradient-to-br from-[#065f46] via-[#10b981] to-[#3b82f6]';

  return 'bg-gradient-to-br from-[#1a1a1a] via-[#262626] to-[#1a1a1a]';
};

const VibeCard = ({ vibe, onGenerate, onToggleBookmark, isBookmarked }: any) => {
  const gradientClass = getGradientByVibe(vibe.title);

  return (
    <div
      onClick={() => onGenerate('prompt', vibe.prompt)}
      className={`relative h-64 rounded-3xl overflow-hidden cursor-pointer group transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/50 border border-white/5 ${gradientClass}`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleBookmark(e, vibe);
        }}
        className="absolute top-4 right-4 p-2 bg-black/20 backdrop-blur-md rounded-full text-white/70 hover:text-[#1DB954] hover:bg-black/40 transition-all z-20 group/heart"
      >
        <Heart
          size={20}
          className={`${isBookmarked ? 'fill-[#1DB954] text-[#1DB954]' : 'text-white/70'} group-hover/heart:scale-110 transition-transform`}
        />
      </button>

      <div className="absolute inset-x-0 bottom-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 text-white/80 group-hover:text-[#1DB954] transition-colors drop-shadow-md">
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Curated Set</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2 leading-tight drop-shadow-md">
            {vibe.title}
          </h3>
          <p className="text-sm text-white/80 line-clamp-2 leading-relaxed drop-shadow-md">
            {vibe.description}
          </p>
        </div>
        <div className="absolute bottom-0 left-0 h-1 bg-[#1DB954] w-0 group-hover:w-full transition-all duration-500" />
      </div>

      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none" />
    </div>
  );
};

const MainLayout = ({ children, sidebarProps, onOpenMobileMenu }: any) => {
  return (
    <div className="min-h-screen md:h-screen bg-[#121212] flex flex-col md:flex-row md:overflow-hidden">
      {/* Mobile Top Bar */}
      <header className="md:hidden bg-black/50 backdrop-blur-lg border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-[100]">
        <div className="flex items-center gap-2 text-white font-bold" onClick={() => sidebarProps.setAppState(AppState.DASHBOARD)}>
          <Music className="text-[#1DB954]" size={20} /> Vibeify
        </div>
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -mr-2 text-gray-400 hover:text-white transition-colors active:scale-95"
        >
          <Menu size={24} />
        </button>
      </header>

      <Sidebar {...sidebarProps} />
      <main className="flex-1 overflow-y-auto relative no-scrollbar">
        {children}
      </main>
    </div>
  );
};

const UserInsightsModal = ({ isOpen, onClose, library, token }: any) => {
  const [insightData, setInsightData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [aiBio, setAiBio] = useState<string>('');
  const modalRef = React.useRef<HTMLDivElement>(null);

  // Dynamic Theming based on Archetype
  const getTheme = (archetype: string) => {
    const themes: Record<string, { bg: string, text: string, accent: string, pulse: string }> = {
      'The Contemporary Synthesist': { bg: 'from-emerald-900/40', text: 'text-emerald-400', accent: '#1DB954', pulse: 'shadow-emerald-500/20' },
      'The Melodic Realist': { bg: 'from-indigo-900/40', text: 'text-indigo-400', accent: '#818cf8', pulse: 'shadow-indigo-500/20' },
      'The Nocturnal Strategist': { bg: 'from-purple-900/40', text: 'text-purple-400', accent: '#a855f7', pulse: 'shadow-purple-500/20' },
      'The Lyric Architect': { bg: 'from-orange-900/40', text: 'text-orange-400', accent: '#fb923c', pulse: 'shadow-orange-500/20' },
      'The Soulful Curator': { bg: 'from-rose-900/40', text: 'text-rose-400', accent: '#fb7185', pulse: 'shadow-rose-500/20' },
      'The Symphonic Strategist': { bg: 'from-cyan-900/40', text: 'text-cyan-400', accent: '#22d3ee', pulse: 'shadow-cyan-500/20' },
      'The Sonic Rebel': { bg: 'from-red-900/40', text: 'text-red-400', accent: '#ef4444', pulse: 'shadow-red-500/20' },
      'The Sonic Explorer': { bg: 'from-gray-900/40', text: 'text-gray-400', accent: '#9ca3af', pulse: 'shadow-gray-500/20' }
    };
    return themes[archetype] || themes['The Sonic Explorer'];
  };

  useEffect(() => {
    if (isOpen && library.length > 0 && token) {
      const cached = localStorage.getItem('vibeify_user_dna');
      if (cached) {
        const parsed = JSON.parse(cached);
        setInsightData(parsed.insightData);
        setAiBio(parsed.aiBio);
      } else {
        calculateInsights();
      }
    }
  }, [isOpen]);

  const calculateInsights = async (force = false) => {
    setLoading(true);
    if (force) setAiBio('');
    try {
      // 1. Audio Features (Radar Chart) - Sample 50 tracks
      const sampleTracks = library
        .sort(() => 0.5 - Math.random())
        .slice(0, 50)
        .map((t: any) => t.id);

      const features = await SpotifyService.fetchAudioFeaturesBatch(token, sampleTracks);

      const avgs = features.reduce((acc, f) => {
        if (!f) return acc;
        acc.energy += f.energy;
        acc.danceability += f.danceability;
        acc.valence += f.valence;
        acc.acousticness += f.acousticness || 0;
        acc.count++;
        return acc;
      }, { energy: 0, danceability: 0, valence: 0, acousticness: 0, count: 0 });

      const radarData = [
        { subject: 'Energy', A: (avgs.energy / avgs.count) * 100, fullMark: 100 },
        { subject: 'Dance', A: (avgs.danceability / avgs.count) * 100, fullMark: 100 },
        { subject: 'Vibe', A: (avgs.valence / avgs.count) * 100, fullMark: 100 },
        { subject: 'Acoustic', A: (avgs.acousticness / avgs.count) * 100, fullMark: 100 },
      ];

      // 2. Archetype & Anchor Artists
      const artistCounts: Record<string, { count: number, name: string, image?: string }> = {};
      library.forEach(t => {
        const id = t.artists[0]?.id;
        if (id) {
          if (!artistCounts[id]) artistCounts[id] = { count: 0, name: t.artists[0].name, image: t.album.images?.[0]?.url };
          artistCounts[id].count++;
        }
      });

      const anchorArtists = Object.values(artistCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      const uniqueArtistsIds = Array.from(new Set(library.map((t: any) => t.artists[0]?.id))).filter(Boolean).slice(0, 40);
      const artistsMetadata = await SpotifyService.fetchArtistsBatch(token, uniqueArtistsIds as string[]);

      const genreCounts: Record<string, number> = {};
      artistsMetadata.forEach(a => {
        a.genres?.forEach((g: string) => {
          genreCounts[g] = (genreCounts[g] || 0) + 1;
        });
      });

      const topGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(g => g[0]);

      let archetype = 'The Sonic Explorer';
      if (topGenres.some(g => g.includes('pop') || g.includes('dance'))) archetype = 'The Contemporary Synthesist';
      if (topGenres.some(g => g.includes('rock') || g.includes('indie') || g.includes('punk'))) archetype = 'The Melodic Realist';
      if (topGenres.some(g => g.includes('techno') || g.includes('house') || g.includes('electronic') || g.includes('trance'))) archetype = 'The Nocturnal Strategist';
      if (topGenres.some(g => g.includes('hip hop') || g.includes('rap') || g.includes('trap'))) archetype = 'The Lyric Architect';
      if (topGenres.some(g => g.includes('jazz') || g.includes('soul') || g.includes('blues') || g.includes('r&b'))) archetype = 'The Soulful Curator';
      if (topGenres.some(g => g.includes('classical') || g.includes('composition') || g.includes('ambient'))) archetype = 'The Symphonic Strategist';
      if (topGenres.some(g => g.includes('metal') || g.includes('hardcore'))) archetype = 'The Sonic Rebel';

      // 3. Eras (Decades)
      const eraMap: Record<string, number> = {};
      library.forEach((t: any) => {
        const year = t.album.release_date?.split('-')[0];
        if (year) {
          const decade = Math.floor(parseInt(year) / 10) * 10;
          const label = `${decade}s`;
          eraMap[label] = (eraMap[label] || 0) + 1;
        }
      });

      const eraData = Object.entries(eraMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => parseInt(b.name) - parseInt(a.name))
        .slice(0, 5);

      const finalInsightData = { archetype, radarData, eraData, topGenres, anchorArtists };

      // 4. AI Bio (Gemini)
      const bio = await GeminiService.generateMusicalBio({
        archetype,
        topGenres,
        audioFeatures: radarData
      });

      setInsightData(finalInsightData);
      setAiBio(bio);

      // 5. Persist
      localStorage.setItem('vibeify_user_dna', JSON.stringify({
        insightData: finalInsightData,
        aiBio: bio,
        timestamp: Date.now()
      }));

    } catch (err) {
      console.error('Insight calculation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = () => {
    localStorage.removeItem('vibeify_user_dna');
    calculateInsights(true);
  };

  const handleShare = async () => {
    if (modalRef.current === null) return;
    try {
      const dataUrl = await toPng(modalRef.current, {
        cacheBust: true,
        style: {
          borderRadius: '0', // Full bleed for share card
        }
      });
      const link = document.createElement('a');
      link.download = `vibeify-${insightData?.archetype.replace(/\s+/g, '-').toLowerCase()}-dna.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  if (!isOpen) return null;

  const theme = insightData ? getTheme(insightData.archetype) : getTheme('The Sonic Explorer');

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={onClose} />

      <div
        ref={modalRef}
        className={`relative bg-[#0a0a0a] md:border border-white/10 w-full max-w-2xl h-full md:h-auto md:rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-500 flex flex-col max-h-screen md:max-h-[90vh] ${theme.pulse}`}
      >
        {/* Background Glow */}
        <div className={`absolute top-0 left-0 right-0 h-96 bg-gradient-to-b ${theme.bg} to-transparent opacity-50 pointer-events-none`} />

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 z-10">
            <div className="relative">
              <div className="absolute inset-0 blur-xl bg-[#1DB954]/20 animate-pulse rounded-full" />
              <Loader2 className="animate-spin text-[#1DB954] relative z-20" size={64} />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-2">Analyzing DNA</h2>
              <p className="text-gray-500 font-mono text-sm">Decoding musical patterns...</p>
            </div>
          </div>
        ) : insightData && (
          <div className="flex-1 overflow-y-auto no-scrollbar p-8 md:p-14 z-10">
            <div className="flex justify-between items-start mb-10">
              <div className="max-w-[80%]">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full animate-pulse`} style={{ backgroundColor: theme.accent }} />
                  <span className={`${theme.text} font-black uppercase tracking-[0.4em] text-[10px]`}>Vibeify DNA Card</span>
                </div>
                <h2 className={`text-4xl md:text-6xl font-black text-white leading-[0.9] uppercase italic tracking-tighter drop-shadow-2xl`}>
                  {insightData.archetype}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRecalculate}
                  className="p-3 hover:bg-white/5 rounded-full text-gray-500 transition-colors hover:text-[#1DB954]"
                  title="Recalculate DNA"
                >
                  <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
                <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-full text-gray-500 transition-colors">
                  <X size={28} />
                </button>
              </div>
            </div>

            {/* AI Bio Section */}
            {aiBio && (
              <div className="mb-12 relative">
                <div className="absolute -left-6 top-0 bottom-0 w-1 rounded-full opacity-50" style={{ backgroundColor: theme.accent }} />
                <p className="text-xl md:text-2xl text-gray-200 font-light leading-relaxed italic">
                  "{aiBio}"
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="bg-white/5 backdrop-blur-md rounded-[2rem] p-8 border border-white/5 flex flex-col items-center">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 self-start flex items-center gap-2">
                  <Dna size={12} style={{ color: theme.accent }} /> Sonic Signature
                </h3>
                <div className="w-full h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={insightData.radarData}>
                      <PolarGrid stroke="#555" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 700 }} />
                      <Radar
                        name="User"
                        dataKey="A"
                        stroke={theme.accent}
                        fill={theme.accent}
                        fillOpacity={0.4}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md rounded-[2rem] p-8 border border-white/5">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <History size={12} style={{ color: theme.accent }} /> Era Ancestry
                </h3>
                <div className="w-full h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={insightData.eraData} layout="vertical" margin={{ left: -20, right: 20 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 700 }} />
                      <Tooltip cursor={{ fill: 'transparent' }} content={({ active, payload }) => {
                        if (active && payload?.[0]) return (
                          <div className="bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white uppercase">
                            {payload[0].value} Sets
                          </div>
                        );
                        return null;
                      }} />
                      <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={24}>
                        {insightData.eraData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? theme.accent : '#1a1a1a'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Anchor Artists */}
            <div className="mb-12">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Zap size={12} style={{ color: theme.accent }} /> Anchor Artists
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {insightData.anchorArtists.map((artist: any, idx: number) => (
                  <div key={artist.name} className="flex flex-col items-center gap-3">
                    <div className="relative group/anchor shrink-0">
                      <div className={`absolute inset-0 blur-lg opacity-40 group-hover/anchor:opacity-100 transition-opacity rounded-full`} style={{ backgroundColor: theme.accent }} />
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-white/10 relative z-10 shadow-2xl">
                        {artist.image ? (
                          <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center text-gray-500 font-bold">{idx + 1}</div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] md:text-xs font-bold text-white text-center line-clamp-1">{artist.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center justify-between pt-10 border-t border-white/5">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black italic shadow-2xl skew-x-[-12deg]`} style={{ background: `linear-gradient(45deg, ${theme.accent}, #0a0a0a)` }}>
                  V
                </div>
                <div>
                  <p className="text-white font-black uppercase tracking-tight text-lg">Vibeify AI</p>
                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest italic opacity-60">Insight Card V2.0</p>
                </div>
              </div>
              <Button
                onClick={handleShare}
                className="w-full md:w-auto bg-white text-black px-10 py-5 rounded-full font-black text-base hover:scale-105 transition-all shadow-xl shadow-white/5"
              >
                <Share2 size={20} /> Share my DNA
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CULTURE_DECK_PRESETS = {
  DEFINITIVE_ARTIST: [
    { name: 'Daft Punk', description: 'The Electronic Pioneers', query: 'Daft Punk', image: '🤖' },
    { name: 'Kendrick Lamar', description: 'The Poet of Compton', query: 'Kendrick Lamar', image: '🎤' },
    { name: 'Radiohead', description: 'The Art-Rock Innovators', query: 'Radiohead', image: '🎸' }
  ],
  SONIC_BRIDGE: [
    { name: 'Hip Hop to House', description: 'From boom-bap rhythms to 4x4 electronic beats', query: 'Hip Hop to House', image: '🌉' },
    { name: 'Post-Punk to Techno', description: 'Industrial drums and dark synth waves', query: 'Post-Punk to Techno', image: '⚡' },
    { name: 'Jazz to Hip Hop', description: 'The fundamental connection of breakbeats and sampling', query: 'Jazz to Hip Hop', image: '🎺' }
  ],
  HORIZON_SCAN: [
    { name: 'UK Grime 2015', description: 'The golden era of London grime (Skepta, Jme, Stormzy)', query: 'UK Grime 2015', image: '🇬🇧' },
    { name: 'Detroit Techno 90s', description: 'The birth of techno from the Belleville Three', query: 'Detroit Techno 90s', image: '⚙️' },
    { name: 'French Touch 90s/00s', description: 'The disco-infused filter house revolution in Paris', query: 'French Touch 90s/00s', image: '🇫🇷' }
  ],
  ZEITGEIST_RADAR: [
    { name: 'Kanye, Travis, Drake', description: 'The Modern Rap Titans', query: 'Kanye West, Travis Scott, Drake', image: '🔥' },
    { name: 'Fred again.., Overmono, Four Tet', description: 'The UK Electronic Vanguard', query: 'Fred again.., Overmono, Four Tet', image: '🎛️' },
    { name: 'Billie Eilish, Olivia Rodrigo, Charli XCX', description: 'Modern Pop Disruptors', query: 'Billie Eilish, Olivia Rodrigo, Charli XCX', image: '💥' }
  ]
};

const CultureDeckCover = ({ tracks }: { tracks: CultureDeckTrack[] }) => {
  // Get tracks with resolved image URLs
  const coverTracks = tracks.filter(t => !!t.image).slice(0, 4);
  
  if (coverTracks.length >= 4) {
    return (
      <div className="grid grid-cols-2 grid-rows-2 w-full h-full rounded-2xl overflow-hidden shadow-2xl shrink-0">
        {coverTracks.map((t, i) => (
          <img key={i} src={t.image} alt={t.track_name} className="w-full h-full object-cover" />
        ))}
      </div>
    );
  }
  
  if (coverTracks.length > 0) {
    return (
      <img 
        src={coverTracks[0].image} 
        alt="Playlist Cover" 
        className="w-full h-full object-cover rounded-2xl shadow-2xl shrink-0" 
      />
    );
  }
  
  return (
    <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-[#1DB954] to-black flex items-center justify-center rounded-2xl shadow-2xl shrink-0 text-white/50 text-xs uppercase tracking-widest font-black">
      Culture Deck
    </div>
  );
};

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>('6af5049db3e24dd9a794fabd6721e7df');
  const [redirectUri, setRedirectUri] = useState<string>('');
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [library, setLibrary] = useState<SpotifyTrack[]>([]);
  const [appState, setAppState] = useState<AppState>(AppState.LOGIN);
  const [scanProgress, setScanProgress] = useState(0);
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generator State
  const [prompt, setPrompt] = useState('');
  const [isDeepCuts, setIsDeepCuts] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{
    name: string;
    desc: string;
    uris: string[];
    reasoning: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [playlistLink, setPlaylistLink] = useState<string | null>(null);
  const [tasteDNA, setTasteDNA] = useState<GeminiService.TasteDNA | null>(null);
  const [topArtists, setTopArtists] = useState<any[]>([]);
  const [topTracks, setTopTracks] = useState<any[]>([]);
  const [selectedSeeds, setSelectedSeeds] = useState<Seed[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const [isRescanning, setIsRescanning] = useState(false);
  const [isRefreshingVibes, setIsRefreshingVibes] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Culture Deck States
  const [generatedCultureDeck, setGeneratedCultureDeck] = useState<CultureDeck | null>(null);
  const [activeDeckMode, setActiveDeckMode] = useState<'DEFINITIVE_ARTIST' | 'SONIC_BRIDGE' | 'HORIZON_SCAN' | 'ZEITGEIST_RADAR' | null>(null);

  // Selected Objects
  const [selectedDefArtist, setSelectedDefArtist] = useState<any | null>(null);
  const [selectedZeitgeistArtists, setSelectedZeitgeistArtists] = useState<any[]>([]);
  const [selectedBridgeFrom, setSelectedBridgeFrom] = useState<any | null>(null);
  const [selectedBridgeTo, setSelectedBridgeTo] = useState<any | null>(null);

  // Search Inputs
  const [defArtistSearchQuery, setDefArtistSearchQuery] = useState('');
  const [zeitgeistSearchQuery, setZeitgeistSearchQuery] = useState('');
  const [bridgeFromSearchQuery, setBridgeFromSearchQuery] = useState('');
  const [bridgeToSearchQuery, setBridgeToSearchQuery] = useState('');

  // Search Results
  const [defArtistSearchResults, setDefArtistSearchResults] = useState<any[]>([]);
  const [zeitgeistSearchResults, setZeitgeistSearchResults] = useState<any[]>([]);
  const [bridgeFromSearchResults, setBridgeFromSearchResults] = useState<any[]>([]);
  const [bridgeToSearchResults, setBridgeToSearchResults] = useState<any[]>([]);

  // Suggestions (Related Artists)
  const [defArtistSuggestions, setDefArtistSuggestions] = useState<any[]>([]);
  const [zeitgeistSuggestions, setZeitgeistSuggestions] = useState<any[]>([]);

  // Text inputs
  const [horizonInput, setHorizonInput] = useState('');

  // Customization States
  const [targetLength, setTargetLength] = useState(30);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  // Custom Vibe Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDNAModalOpen, setIsDNAModalOpen] = useState(false);
  const [vibeForm, setVibeForm] = useState({
    source: 'library' as 'library' | 'global',
    strategy: 'best_match' as 'best_match' | 'buried_treasures',
    selectedSeeds: [] as Seed[],
    atmosphere: [] as string[],
    energy: 50,
    discovery: 50,
    useRecentlyAdded: false
  });

  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalSearchResults, setModalSearchResults] = useState<Seed[]>([]);
  const [isModalSearching, setIsModalSearching] = useState(false);

  // Debounced Search for Modal
  useEffect(() => {
    if (!modalSearchQuery.trim()) {
      setModalSearchResults([]);
      return;
    }

    const handler = setTimeout(async () => {
      if (!token) return;
      setIsModalSearching(true);
      try {
        const results = await SpotifyService.searchItems(token, modalSearchQuery);
        setModalSearchResults(results);
      } catch (err) {
        console.error("Modal search failed:", err);
      } finally {
        setIsModalSearching(false);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [modalSearchQuery, token]);

  // Debounced search for Definitive Artist input
  useEffect(() => {
    if (!defArtistSearchQuery.trim()) {
      setDefArtistSearchResults([]);
      return;
    }
    const handler = setTimeout(async () => {
      if (!token) return;
      try {
        const results = await SpotifyService.searchItems(token, defArtistSearchQuery);
        setDefArtistSearchResults(results.filter(r => r.type === 'artist'));
      } catch (err) {
        console.error("Definitive artist search failed:", err);
      }
    }, 450);
    return () => clearTimeout(handler);
  }, [defArtistSearchQuery, token]);

  // Debounced search for Zeitgeist Radar input
  useEffect(() => {
    if (!zeitgeistSearchQuery.trim()) {
      setZeitgeistSearchResults([]);
      return;
    }
    const handler = setTimeout(async () => {
      if (!token) return;
      try {
        const results = await SpotifyService.searchItems(token, zeitgeistSearchQuery);
        setZeitgeistSearchResults(results.filter(r => r.type === 'artist'));
      } catch (err) {
        console.error("Zeitgeist search failed:", err);
      }
    }, 450);
    return () => clearTimeout(handler);
  }, [zeitgeistSearchQuery, token]);

  // Debounced search for Sonic Bridge From input
  useEffect(() => {
    if (!bridgeFromSearchQuery.trim()) {
      setBridgeFromSearchResults([]);
      return;
    }
    const handler = setTimeout(async () => {
      if (!token) return;
      try {
        const results = await SpotifyService.searchItems(token, bridgeFromSearchQuery);
        setBridgeFromSearchResults(results);
      } catch (err) {
        console.error("Bridge from search failed:", err);
      }
    }, 450);
    return () => clearTimeout(handler);
  }, [bridgeFromSearchQuery, token]);

  // Debounced search for Sonic Bridge To input
  useEffect(() => {
    if (!bridgeToSearchQuery.trim()) {
      setBridgeToSearchResults([]);
      return;
    }
    const handler = setTimeout(async () => {
      if (!token) return;
      try {
        const results = await SpotifyService.searchItems(token, bridgeToSearchQuery);
        setBridgeToSearchResults(results);
      } catch (err) {
        console.error("Bridge to search failed:", err);
      }
    }, 450);
    return () => clearTimeout(handler);
  }, [bridgeToSearchQuery, token]);

  const handleSelectSeed = (seed: Seed) => {
    if (vibeForm.selectedSeeds.some(s => s.id === seed.id)) return;
    if (vibeForm.selectedSeeds.length >= 5) {
      alert("Spotify allows maximum 5 seeds per request.");
      return;
    }
    setVibeForm({
      ...vibeForm,
      selectedSeeds: [...vibeForm.selectedSeeds, seed]
    });
    setModalSearchQuery('');
    setModalSearchResults([]);
  };

  const handleRemoveSeed = (seedId: string) => {
    setVibeForm({
      ...vibeForm,
      selectedSeeds: vibeForm.selectedSeeds.filter(s => s.id !== seedId)
    });
  };

  const atmosphereTags = [
    { label: 'Night', emoji: '🌑' },
    { label: 'Drive', emoji: '🏎️' },
    { label: 'Gym', emoji: '🏋️' },
    { label: 'Heartbreak', emoji: '💔' },
    { label: 'Chill', emoji: '🧘' },
    { label: 'Party', emoji: '🎉' },
    { label: 'Focus', emoji: '🧠' },
    { label: 'Summer', emoji: '☀️' }
  ];

  const handleToggleTag = (tag: string) => {
    setVibeForm(prev => ({
      ...prev,
      atmosphere: prev.atmosphere.includes(tag)
        ? prev.atmosphere.filter(t => t !== tag)
        : [...prev.atmosphere, tag]
    }));
  };

  const generateCustomVibe = () => {
    const { selectedSeeds, atmosphere, energy, discovery } = vibeForm;
    let finalPrompt = 'Create a playlist';

    if (selectedSeeds.length > 0) {
      finalPrompt += ` featuring elements like ${selectedSeeds.map(s => s.name).join(', ')}`;
    }

    if (atmosphere.length > 0) {
      finalPrompt += ` with a ${atmosphere.join('/')} atmosphere`;
    }

    finalPrompt += `. Energy level should be ${energy > 70 ? 'High Voltage' : energy < 30 ? 'Low Key' : 'Balanced'}.`;

    if (discovery > 70) {
      finalPrompt += ' Focus heavily on Deep Cuts and obscure tracks.';
    } else if (discovery < 30) {
      finalPrompt += ' Stick to the Hits and familiar favorites.';
    } else {
      finalPrompt += ' Provide a balanced mix of hits and discoveries.';
    }

    setIsCreateModalOpen(false);
    handleGenerate('prompt', finalPrompt, vibeForm.source, vibeForm.useRecentlyAdded);
  };
  const [savedVibes, setSavedVibes] = useState<any[]>([]);
  const [myMixes, setMyMixes] = useState<any[]>([]);

  useEffect(() => {
    // 1. Load Client ID from localStorage if exists
    const storedId = localStorage.getItem('spotify_client_id');
    if (storedId) setClientId(storedId);

    // 2. Set default Redirect URI on mount
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);

      // Spotify deprecation fix: Prefer 127.0.0.1 over localhost
      if (url.hostname === 'localhost') {
        url.hostname = '127.0.0.1';
        window.location.href = url.toString();
        return;
      }

      const cleanUrl = url.origin + url.pathname;
      setRedirectUri(cleanUrl);
      setIsLocalhost(url.hostname === 'localhost' || url.hostname === '127.0.0.1');
    }

    // 3. Check for code in URL (PKCE Flow)
    const code = SpotifyService.extractCodeFromUrl();
    if (code) {
      handleCodeExchange(code);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    // 4. Check hash for token (Legacy support)
    const hashToken = SpotifyService.extractTokenFromHash();
    if (hashToken) {
      setToken(hashToken);
      window.location.hash = ''; // Clear hash
      setAppState(AppState.SCANNING);
      return;
    }

    // 5. Restore persistent session
    const tokens = SpotifyService.getStoredTokens();
    if (tokens) {
      if (SpotifyService.isTokenExpired(tokens.expires_at)) {
        if (storedId) {
          handleTokenRefresh(storedId, tokens.refresh_token);
        } else {
          // Can't refresh without client ID
          SpotifyService.clearStoredTokens();
        }
      } else {
        setToken(tokens.access_token);
        setAppState(AppState.SCANNING);
      }
    }
  }, []);

  const handleCodeExchange = async (code: string) => {
    setAppState(AppState.SCANNING); // Show loading state
    try {
      // Must match authorization request EXACTLY
      const currentRedirectUri = window.location.origin + window.location.pathname;
      const tokens = await SpotifyService.exchangeCodeForToken(clientId, code, currentRedirectUri);
      setToken(tokens.access_token);
      SpotifyService.saveTokens(tokens);
    } catch (err) {
      console.error(err);
      alert("Failed to authenticate with Spotify. Please try again.");
      setAppState(AppState.LOGIN);
    }
  };

  const handleTokenRefresh = async (cid: string, refreshToken: string) => {
    try {
      const tokens = await SpotifyService.refreshAccessToken(cid, refreshToken);
      setToken(tokens.access_token);
      SpotifyService.saveTokens(tokens);
      setAppState(AppState.SCANNING);
    } catch (err) {
      console.error('Auto-refresh failed:', err);
      // If refresh fails, clear tokens and go to login
      SpotifyService.clearStoredTokens();
      setAppState(AppState.LOGIN);
    }
  };

  useEffect(() => {
    if (token && appState === AppState.SCANNING && library.length === 0) {
      loadUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, appState]);

  const handleLogin = async () => {
    if (!clientId) return alert("Please enter a Client ID");
    if (!redirectUri) return alert("Please confirm the Redirect URI");

    localStorage.setItem('spotify_client_id', clientId);
    const authUrl = await SpotifyService.getAuthUrl(clientId, redirectUri);
    window.location.href = authUrl;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(redirectUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadUserData = async (forceRefresh = false) => {
    if (!token) return;
    try {
      // 1. Fetch profile first
      const userProfile = await SpotifyService.fetchUserProfile(token);
      setUser(userProfile);

      // 2. Multi-stage library loading
      let tracks: SpotifyTrack[] = [];
      let usedCache = false;

      if (!forceRefresh) {
        const cached = await DBService.getCachedLibrary();
        if (cached && (Date.now() - cached.lastFetched < 24 * 60 * 60 * 1000)) {
          tracks = cached.tracks;
          setLastFetched(cached.lastFetched);
          usedCache = true;
          setScanProgress(tracks.length);
        }
      }

      if (!usedCache) {
        setAppState(AppState.SCANNING);
        tracks = await SpotifyService.fetchAllLikedSongs(token, (count) => {
          setScanProgress(count);
        });
        await DBService.saveLibrary(tracks);
        setLastFetched(Date.now());
      }

      setLibrary(tracks);
      setAppState(AppState.DASHBOARD);

      // Perform background analysis
      const [artists, topTracks] = await Promise.all([
        SpotifyService.fetchTopItems(token, 'artists'),
        SpotifyService.fetchTopItems(token, 'tracks')
      ]);
      setTopArtists(artists);
      setTopTracks(topTracks);

      // Check cache for Taste DNA first
      const cachedVibes = localStorage.getItem('cached_vibe_suggestions');
      if (cachedVibes) {
        const parsed = JSON.parse(cachedVibes);
        // Migration/Validation: Support the new structure
        if (parsed.categories && parsed.featured) {
          setTasteDNA(parsed);
        } else {
          // Fallback if old cache exists: trigger new analysis
          const dna = await GeminiService.analyzeTasteDNA(tracks, artists, topTracks);
          setTasteDNA(dna);
          localStorage.setItem('cached_vibe_suggestions', JSON.stringify(dna));
        }
      } else {
        const dna = await GeminiService.analyzeTasteDNA(tracks, artists, topTracks);
        setTasteDNA(dna);
        localStorage.setItem('cached_vibe_suggestions', JSON.stringify(dna));
      }

      // Load saved vibes and mixes from IndexedDB
      const [saved, mixes] = await Promise.all([
        DBService.getSavedVibes(),
        DBService.getSavedPlaylists()
      ]);
      setSavedVibes(saved);
      setMyMixes(mixes);
    } catch (err) {
      console.error(err);
      alert("Error loading data. Check console.");
      setAppState(AppState.LOGIN);
    } finally {
      setIsRescanning(false);
    }
  };

  const handleRescan = () => {
    setIsRescanning(true);
    loadUserData(true);
  };

  const handleRefreshVibes = async () => {
    if (!library.length || !topArtists.length || !topTracks.length) return;
    setIsRefreshingVibes(true);
    try {
      const dna = await GeminiService.analyzeTasteDNA(library, topArtists, topTracks);
      setTasteDNA(dna);
      localStorage.setItem('cached_vibe_suggestions', JSON.stringify(dna));
    } catch (err) {
      console.error("Refresh vibes failed:", err);
      alert("Failed to refresh vibes. Please try again.");
    } finally {
      setIsRefreshingVibes(false);
    }
  };

  const handleToggleBookmark = async (e: React.MouseEvent, vibe: any) => {
    e.stopPropagation();
    const isAdded = await DBService.toggleBookmark(vibe);
    if (isAdded) {
      setSavedVibes([...savedVibes, vibe]);
    } else {
      setSavedVibes(savedVibes.filter(v => v.title !== vibe.title));
    }
  };

  const handleSaveToLibrary = async () => {
    if (!generatedResult) return;
    const newMix: any = {
      id: crypto.randomUUID(),
      name: generatedResult.name,
      description: generatedResult.desc,
      uris: generatedResult.uris,
      reasoning: generatedResult.reasoning,
      createdAt: Date.now()
    };
    await DBService.savePlaylist(newMix);
    setMyMixes([newMix, ...myMixes]);
    alert("Saved to your local library!");
  };

  const handleDeleteMix = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this mix?")) return;
    await DBService.deletePlaylist(id);
    setMyMixes(myMixes.filter(m => m.id !== id));
    if (appState === AppState.RESULT && generatedResult?.name === myMixes.find(m => m.id === id)?.name) {
      setAppState(AppState.DASHBOARD);
    }
  };

  const handleGenerate = async (
    mode: 'mood' | 'prompt' | 'smart',
    customPrompt?: string,
    sourceOverride?: 'library' | 'global',
    recentlyAddedOnly: boolean = false
  ) => {
    if (!token) return;
    setIsProcessing(true);
    setAppState(AppState.GENERATING);

    try {
      const finalPrompt = customPrompt || prompt;
      const source = sourceOverride || 'library';

      if (source === 'global') {
        // GLOBAL DISCOVERY MODE
        // Spotify allows Max 5 seeds total
        const allSeeds = vibeForm.selectedSeeds.slice(0, 5);
        const seedArtists = allSeeds.filter(s => s.type === 'artist').map(s => s.id);
        const seedTracks = allSeeds.filter(s => s.type === 'track').map(s => s.id);

        // 1. Fallback to top artists if no seeds provided in form
        let finalSeedArtists = seedArtists;
        if (seedArtists.length === 0 && seedTracks.length === 0) {
          finalSeedArtists = topArtists.slice(0, 3).map(a => a.id);
        }

        // 2. Get recommendations from Spotify
        const recommendedTracks = await SpotifyService.getRecommendations(token,
          { seed_artists: finalSeedArtists, seed_tracks: seedTracks },
          { target_energy: vibeForm.energy }
        );

        // 3. Use Gemini to provide reasoning and name for the mix
        const tracksSample = recommendedTracks.slice(0, 10).map(t => `${t.name} by ${t.artists[0]?.name}`);
        const result = await GeminiService.generatePlaylistFromLibrary(
          [],
          `Context: Global Discovery Mix for "${finalPrompt}". Samples: ${tracksSample.join(', ')}`,
          'vibe'
        );

        setGeneratedResult({
          name: result.playlistName,
          desc: result.description,
          uris: recommendedTracks.map(t => t.uri),
          reasoning: result.reasoning
        });
      } else {
        // LIBRARY MODE
        const deepCutDate = new Date();
        deepCutDate.setFullYear(deepCutDate.getFullYear() - 1); // 1 year ago

        let serviceMode: 'vibe' | 'smart' | 'deep_cuts' = 'vibe';
        if (isDeepCuts) {
          serviceMode = 'deep_cuts';
        } else if (mode === 'smart') {
          serviceMode = 'smart';
        }

        // Use seeds from form if available, otherwise fallback to global selectedSeeds (from search bar)
        const activeSeeds = (sourceOverride && vibeForm.selectedSeeds.length > 0)
          ? vibeForm.selectedSeeds
          : selectedSeeds;

        const seedIdentifiers = activeSeeds.map(s =>
          s.type === 'artist' ? `Artist: ${s.name}` : `Track: ${s.name} by ${s.artist}`
        );

        // Filter library if "Recently Added" is selected
        let targetLibrary = library;
        if (recentlyAddedOnly) {
          // Sort by added_at descending just in case it's not
          targetLibrary = [...library].sort((a, b) =>
            new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
          ).slice(0, 100); // Focus on last 100 songs
        }

        const result = await GeminiService.generatePlaylistFromLibrary(
          targetLibrary,
          finalPrompt,
          serviceMode,
          seedIdentifiers,
          deepCutDate.toISOString().split('T')[0],
          targetLength
        );

        let finalUris = result.selectedUris;

        // Apply Buried Treasures Logic
        if (source === 'library' && vibeForm.strategy === 'buried_treasures') {
          // 1. Map URIs to full track objects to get added_at
          const matchedTracks = result.selectedUris
            .map(uri => library.find(t => t.uri === uri))
            .filter((t): t is SpotifyTrack => !!t);

          // 2. Sort by added_at ascending (oldest first)
          const sortedByOldest = [...matchedTracks].sort((a, b) =>
            new Date(a.added_at).getTime() - new Date(b.added_at).getTime()
          );

          // 3. Shuffle Tweak: take top 20% oldest and shuffle them
          const top20PercentCount = Math.max(1, Math.floor(sortedByOldest.length * 0.2));
          const oldestChunk = sortedByOldest.slice(0, top20PercentCount);
          const remainingChunk = sortedByOldest.slice(top20PercentCount);

          // Simple shuffle function
          const shuffledOldest = oldestChunk.sort(() => Math.random() - 0.5);

          finalUris = [...shuffledOldest, ...remainingChunk].map(t => t.uri);
        }

        setGeneratedResult({
          name: result.playlistName,
          desc: result.description,
          uris: finalUris,
          reasoning: result.reasoning
        });
      }

      setAppState(AppState.RESULT);
    } catch (e) {
      console.error(e);
      alert("AI Generation failed. Please try again.");
      setAppState(AppState.DASHBOARD);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefine = async () => {
    if (!token || !generatedResult || !refinePrompt.trim()) return;
    setIsProcessing(true);
    setAppState(AppState.GENERATING);
    try {
      const result = await GeminiService.refinePlaylist(
        library,
        {
          playlistName: generatedResult.name,
          description: generatedResult.desc,
          reasoning: generatedResult.reasoning,
          selectedUris: generatedResult.uris
        },
        refinePrompt,
        targetLength
      );

      setGeneratedResult({
        name: result.playlistName,
        desc: result.description,
        uris: result.selectedUris,
        reasoning: result.reasoning
      });
      setRefinePrompt('');
      setAppState(AppState.RESULT);
    } catch (e) {
      console.error(e);
      alert("Refinement failed.");
      setAppState(AppState.RESULT);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSavePlaylist = async () => {
    if (!token || !user || !generatedResult) return;
    setIsProcessing(true);
    try {
      const link = await SpotifyService.createPlaylist(
        token,
        user.id,
        generatedResult.name,
        generatedResult.desc + " (Curated by Vibeify AI)",
        generatedResult.uris
      );
      setPlaylistLink(link);
    } catch (e) {
      alert("Failed to save playlist to Spotify.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectDefArtist = async (artist: any) => {
    setSelectedDefArtist(artist);
    setDefArtistSearchQuery(artist.name);
    setDefArtistSearchResults([]);
    
    // Fetch related artists
    if (token) {
      try {
        const related = await SpotifyService.fetchRelatedArtists(token, artist.id);
        setDefArtistSuggestions(related.slice(0, 4));
      } catch (e) {
        console.error("Failed to fetch related artists", e);
      }
    }
  };

  const updateZeitgeistSuggestions = async (authToken: string, selectedArtists: any[]) => {
    if (selectedArtists.length === 0) {
      setZeitgeistSuggestions([]);
      return;
    }
    try {
      const allRelatedPromises = selectedArtists.map(a => SpotifyService.fetchRelatedArtists(authToken, a.id));
      const allRelatedResults = await Promise.all(allRelatedPromises);
      
      // Count frequencies of related artists
      const frequencyMap: Record<string, { count: number; artist: any }> = {};
      allRelatedResults.forEach((list) => {
        list.forEach((artist: any) => {
          // Exclude already selected artists
          if (selectedArtists.some(sa => sa.id === artist.id)) return;
          
          if (!frequencyMap[artist.id]) {
            frequencyMap[artist.id] = { count: 0, artist };
          }
          frequencyMap[artist.id].count++;
        });
      });
      
      // Sort by frequency (highest overlap first)
      const sorted = Object.values(frequencyMap)
        .sort((a, b) => b.count - a.count)
        .map(entry => entry.artist);
        
      setZeitgeistSuggestions(sorted.slice(0, 5));
    } catch (err) {
      console.error("Failed to update combination suggestions", err);
    }
  };

  const handleSelectZeitgeistArtist = async (artist: any) => {
    if (selectedZeitgeistArtists.find(a => a.id === artist.id)) return;
    if (selectedZeitgeistArtists.length >= 5) {
      alert("You can select maximum 5 artists.");
      return;
    }
    
    const updated = [...selectedZeitgeistArtists, artist];
    setSelectedZeitgeistArtists(updated);
    setZeitgeistSearchQuery('');
    setZeitgeistSearchResults([]);

    if (token) {
      await updateZeitgeistSuggestions(token, updated);
    }
  };

  const handleRemoveZeitgeistArtist = async (artistId: string) => {
    const updated = selectedZeitgeistArtists.filter(a => a.id !== artistId);
    setSelectedZeitgeistArtists(updated);
    if (token) {
      await updateZeitgeistSuggestions(token, updated);
    }
  };

  const handleSelectBridgeFrom = (item: any) => {
    setSelectedBridgeFrom(item);
    setBridgeFromSearchQuery(item.name + (item.artist ? ` (by ${item.artist})` : ''));
    setBridgeFromSearchResults([]);
  };

  const handleSelectBridgeTo = (item: any) => {
    setSelectedBridgeTo(item);
    setBridgeToSearchQuery(item.name + (item.artist ? ` (by ${item.artist})` : ''));
    setBridgeToSearchResults([]);
  };

  const handleGenerateCultureDeck = async (
    mode: 'DEFINITIVE_ARTIST' | 'SONIC_BRIDGE' | 'HORIZON_SCAN' | 'ZEITGEIST_RADAR',
    contextInput: string
  ) => {
    if (!token) return;
    setIsProcessing(true);
    setAppState(AppState.GENERATING);
    try {
      const response = await GeminiService.generateCultureDeck(mode, contextInput);
      
      // Resolve Spotify URIs
      const resolvedTracks = await Promise.all(
        response.tracks.map(async (t) => {
          const result = await SpotifyService.searchTrackByNameAndArtist(token, t.track_name, t.artist);
          return { ...t, uri: result?.uri, image: result?.image };
        })
      );

      setGeneratedCultureDeck({
        id: crypto.randomUUID(),
        mode,
        inputContext: contextInput,
        curator_briefing: response.curator_briefing,
        playlist_name: response.playlist_name,
        tracks: resolvedTracks
      });
      setPlaylistLink(null); // Reset playlist export link
      setAppState(AppState.CULTURE_DECK);
    } catch (err) {
      console.error("Culture Deck generation failed:", err);
      alert("Failed to generate Culture Deck. Please try again.");
      setAppState(AppState.CULTURE_DECK);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRerollCultureDeck = async () => {
    if (!token || !generatedCultureDeck) return;
    setIsProcessing(true);
    setAppState(AppState.GENERATING);
    try {
      const response = await GeminiService.rerollCultureDeck(generatedCultureDeck);
      
      // Resolve Spotify URIs with optimization
      const resolvedTracks = await Promise.all(
        response.tracks.map(async (t) => {
          // Find if it was in the old deck to reuse URI
          const oldMatch = generatedCultureDeck.tracks.find(
            ot => ot.track_name.toLowerCase() === t.track_name.toLowerCase() && 
                  ot.artist.toLowerCase() === t.artist.toLowerCase()
          );
          if (oldMatch && oldMatch.uri) {
            return { ...t, uri: oldMatch.uri, image: oldMatch.image };
          }
          const result = await SpotifyService.searchTrackByNameAndArtist(token, t.track_name, t.artist);
          return { ...t, uri: result?.uri, image: result?.image };
        })
      );

      setGeneratedCultureDeck({
        ...generatedCultureDeck,
        curator_briefing: response.curator_briefing,
        playlist_name: response.playlist_name,
        tracks: resolvedTracks
      });
      setPlaylistLink(null); // Reset playlist export link since playlist contents changed
      setAppState(AppState.CULTURE_DECK);
    } catch (err) {
      console.error("Culture Deck reroll failed:", err);
      alert("Failed to reroll Culture Deck. Please try again.");
      setAppState(AppState.CULTURE_DECK);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveCultureDeckToSpotify = async () => {
    if (!token || !user || !generatedCultureDeck) return;
    setIsProcessing(true);
    try {
      const uris = generatedCultureDeck.tracks.map(t => t.uri).filter((uri): uri is string => !!uri);
      if (uris.length === 0) {
        alert("No tracks found on Spotify to export.");
        return;
      }
      const link = await SpotifyService.createPlaylist(
        token,
        user.id,
        generatedCultureDeck.playlist_name,
        `Curator's Briefing: ${generatedCultureDeck.curator_briefing.slice(0, 150)}... (Culture Deck via Vibeify AI)`,
        uris
      );
      setPlaylistLink(link);
    } catch (e) {
      alert("Failed to save playlist to Spotify.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveCultureDeckToLibrary = async () => {
    if (!generatedCultureDeck) return;
    const newMix: any = {
      id: generatedCultureDeck.id,
      name: generatedCultureDeck.playlist_name,
      description: generatedCultureDeck.curator_briefing,
      uris: generatedCultureDeck.tracks.map(t => t.uri).filter((uri): uri is string => !!uri),
      reasoning: "Culture Deck: " + generatedCultureDeck.mode.replace(/_/g, ' '),
      createdAt: Date.now(),
      isCultureDeck: true,
      cultureDeckData: generatedCultureDeck
    };
    await DBService.savePlaylist(newMix);
    setMyMixes([newMix, ...myMixes]);
    alert("Culture Deck saved to your local library!");
  };

  const reset = () => {
    setAppState(AppState.DASHBOARD);
    setGeneratedResult(null);
    setPlaylistLink(null);
    setPrompt('');
  };

  const handleLogout = () => {
    setToken(null);
    SpotifyService.clearStoredTokens();
    DBService.clearLibrary();
    localStorage.removeItem('cached_vibe_suggestions');
    setAppState(AppState.LOGIN);
    window.location.hash = '';
  };

  const sidebarProps = {
    appState,
    setAppState,
    library,
    savedVibes,
    myMixes,
    tasteDNA,
    user,
    lastFetched,
    isRescanning,
    handleRescan,
    handleDeleteMix,
    setGeneratedResult,
    setGeneratedCultureDeck,
    onLogout: handleLogout,
    isOpen: isMobileMenuOpen,
    onClose: () => setIsMobileMenuOpen(false),
    onOpenDNA: () => { setIsDNAModalOpen(true); setIsMobileMenuOpen(false); }
  };

  /* --- RENDERERS --- */

  if (appState === AppState.LOGIN) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4 text-center">
        <div className="mb-8 animate-pulse">
          <Music size={64} className="text-[#1DB954]" />
        </div>
        <h1 className="text-5xl font-bold mb-4 tracking-tighter">Vibeify AI</h1>
        <p className="text-gray-400 mb-8 max-w-md text-lg">
          Your music library is a mess. Let Gemini AI rediscover your forgotten gems and curate the perfect vibe.
        </p>

        <div className="w-full max-w-md space-y-6">
          <div className="bg-[#181818] p-6 rounded-xl border border-[#333] space-y-5 text-left shadow-2xl">

            {/* Client ID Input */}
            <div>
              <label className="block text-xs text-gray-400 mb-2 uppercase font-bold tracking-widest">
                Spotify Client ID
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Paste Client ID from Dashboard"
                className="w-full bg-[#282828] text-white p-3 rounded-md border border-transparent focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] outline-none transition-all"
              />
            </div>

            {/* Redirect URI Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs text-gray-400 uppercase font-bold tracking-widest">
                  Redirect URI
                </label>
                {isLocalhost && (
                  <span className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded border border-blue-900/50">
                    Localhost Detected
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={redirectUri}
                  readOnly
                  className="flex-1 bg-[#282828] text-gray-300 p-3 rounded-md border border-transparent outline-none text-sm font-mono cursor-not-allowed opacity-80"
                />
                <button
                  onClick={copyToClipboard}
                  className="bg-[#282828] hover:bg-[#333] text-gray-300 p-3 rounded-md border border-transparent transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? <CheckCircle size={20} className="text-[#1DB954]" /> : <Copy size={20} />}
                </button>
              </div>

              <div className="mt-3 bg-[#282828]/50 p-3 rounded border border-[#333] text-[11px] text-gray-400 leading-relaxed">
                <div className="flex gap-2 items-start">
                  <Info size={14} className="mt-0.5 shrink-0 text-[#1DB954]" />
                  <div>
                    <strong className="text-gray-300">Spotify Policy Update:</strong> As of 2025, Spotify requires explicit loopback IPs.
                    You <span className="text-white font-medium">must</span> use <span className="text-white font-medium">127.0.0.1</span> instead of <span className="text-white font-medium">localhost</span>.
                    {isLocalhost && (
                      <p className="mt-1 text-green-400/80">
                        Register <strong className="text-white underline">{redirectUri}</strong> in your Spotify Dashboard &rarr; App Settings &rarr; Redirect URIs.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Button onClick={handleLogin} disabled={!clientId || !redirectUri} className="w-full text-lg py-4">
            Connect Spotify Library
          </Button>
        </div>
      </div>
    );
  }

  if (appState === AppState.SCANNING) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#121212]">
        <Loader2 size={48} className="text-[#1DB954] animate-spin mb-6" />
        <h2 className="text-2xl font-bold mb-2">Ingesting Library...</h2>
        <p className="text-gray-400 font-mono">{scanProgress} songs found</p>
      </div>
    );
  }

  if (appState === AppState.GENERATING) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#121212]">
        <CloudLightning size={48} className="text-purple-400 animate-bounce mb-6" />
        <h2 className="text-2xl font-bold mb-2">Gemini is Thinking...</h2>
        <p className="text-gray-400">Analyzing {library.length} tracks against your vibe.</p>
      </div>
    );
  }

  if (appState === AppState.RESULT && generatedResult) {
    return (
      <MainLayout sidebarProps={sidebarProps}>
        <div className="p-6 md:p-12">
          <div className="max-w-4xl mx-auto">
            <button onClick={reset} className="text-gray-400 hover:text-white flex items-center gap-2 mb-8">
              &larr; Back to Dashboard
            </button>

            <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8 md:mb-12">
              <div className="bg-gradient-to-br from-purple-900 to-[#1DB954] w-full md:w-64 aspect-square md:h-64 shadow-2xl flex items-center justify-center rounded-xl md:rounded-lg shrink-0">
                <Music size={64} md:size={80} className="text-white opacity-50" />
              </div>
              <div className="flex flex-col justify-end">
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#1DB954] mb-2">AI Generated Playlist</span>
                <input
                  type="text"
                  value={generatedResult.name}
                  onChange={(e) => setGeneratedResult({ ...generatedResult, name: e.target.value })}
                  className="text-3xl md:text-6xl font-bold mb-3 md:mb-4 bg-transparent border-b border-transparent hover:border-white/20 focus:border-[#1DB954] focus:outline-none text-white leading-tight w-full transition-all"
                  title="Click to rename"
                />
                <p className="text-gray-400 text-base md:text-lg mb-6">{generatedResult.desc}</p>

                <div className="bg-[#282828] p-4 rounded-lg border-l-4 border-purple-500 mb-6">
                  <p className="text-sm text-gray-300 italic">" {generatedResult.reasoning} "</p>
                </div>

                <div className="flex gap-4 mb-6">
                  {!playlistLink ? (
                    <Button onClick={handleSavePlaylist} disabled={isProcessing}>
                      {isProcessing ? <Loader2 className="animate-spin" /> : 'Export to Spotify'}
                    </Button>
                  ) : (
                    <a href={playlistLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-gray-200 w-fit">
                      <CheckCircle size={20} className="text-[#1DB954]" /> Open in Spotify
                    </a>
                  )}

                  <Button variant="outline" onClick={handleSaveToLibrary}>
                    Save to Library
                  </Button>
                </div>

                {/* Refinement Section */}
                <div className="mt-8 pt-8 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={16} className="text-[#1DB954]" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Refine this Vibe</span>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="What should we add or change? (e.g., 'Make it more acoustic', 'Add some 80s synth')"
                        value={refinePrompt}
                        onChange={(e) => setRefinePrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                        className="w-full bg-[#181818] border border-[#333] focus:border-[#1DB954] rounded-xl py-3 px-4 text-sm focus:outline-none transition-all text-white placeholder-gray-500"
                      />
                    </div>
                    <div className="flex items-center bg-[#181818] border border-[#333] rounded-xl p-1 shrink-0">
                      {[20, 30, 40, 50].map((len) => (
                        <button
                          key={len}
                          onClick={() => setTargetLength(len)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${targetLength === len ? 'bg-[#1DB954] text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                          {len}
                        </button>
                      ))}
                    </div>
                    <Button
                      onClick={handleRefine}
                      disabled={!refinePrompt.trim() || isProcessing}
                      className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-sm"
                    >
                      Refine Result
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#181818] rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4 border-b border-gray-800 pb-2 text-white">Tracks ({generatedResult.uris.length})</h3>
              <div className="space-y-2">
                {generatedResult.uris.map((uri, idx) => {
                  const track = library.find(t => t.uri === uri);
                  if (!track) return null;
                  return (
                    <div key={uri} className="flex items-center justify-between p-3 hover:bg-[#282828] rounded group">
                      <div className="flex items-center gap-4">
                        <span className="text-gray-500 w-6 text-right">{idx + 1}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-white font-medium">{track.name}</div>
                            {(() => {
                              const addedDate = new Date(track.added_at);
                              const isOld = (new Date().getTime() - addedDate.getTime()) > (730 * 24 * 60 * 60 * 1000);
                              return isOld && (
                                <span className="bg-amber-900/40 text-amber-300 text-[10px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded flex items-center gap-1 border border-amber-900/50">
                                  <History size={10} /> Added {addedDate.getFullYear()}
                                </span>
                              );
                            })()}
                          </div>
                          <div className="text-gray-400 text-sm">{track.artists[0].name}</div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-600 group-hover:text-gray-400">
                        {track.album.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (appState === AppState.CULTURE_DECK) {
    return (
      <MainLayout sidebarProps={sidebarProps} onOpenMobileMenu={() => setIsMobileMenuOpen(true)}>
        <div className="p-6 md:p-12 pb-32 flex flex-col gap-8 h-full max-w-[1600px] mx-auto">
          <header className="mb-4">
            <h1 className="text-3xl md:text-5xl font-black mb-2 text-white tracking-tight flex items-center gap-3">
              <Compass className="text-[#1DB954]" size={36} /> Culture Deck
            </h1>
            <p className="text-sm md:text-base text-gray-400">Discover genres, artists, and musical movements through expert-level kuration.</p>
          </header>

          <div className="flex flex-col lg:flex-row gap-8 items-stretch flex-1 min-h-0">
            {/* LEFT CONTROL PANEL */}
            <div className="w-full lg:w-[420px] xl:w-[450px] shrink-0 bg-[#181818] border border-white/5 p-6 rounded-3xl shadow-2xl flex flex-col gap-6 select-none justify-between h-fit">
              <div>
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 mb-6">
                  {/* Mode Selector Buttons */}
                  {[
                    { mode: 'DEFINITIVE_ARTIST', label: 'Artist', icon: <User size={14} /> },
                    { mode: 'SONIC_BRIDGE', label: 'Bridge', icon: <Waves size={14} /> },
                    { mode: 'HORIZON_SCAN', label: 'Horizon', icon: <Compass size={14} /> },
                    { mode: 'ZEITGEIST_RADAR', label: 'Zeitgeist', icon: <Zap size={14} /> }
                  ].map(tab => (
                    <button
                      key={tab.mode}
                      onClick={() => {
                        setActiveDeckMode(tab.mode as any);
                        setSelectedDefArtist(null);
                        setSelectedZeitgeistArtists([]);
                        setSelectedBridgeFrom(null);
                        setSelectedBridgeTo(null);
                        setDefArtistSearchQuery('');
                        setZeitgeistSearchQuery('');
                        setBridgeFromSearchQuery('');
                        setBridgeToSearchQuery('');
                        setDefArtistSuggestions([]);
                        setZeitgeistSuggestions([]);
                      }}
                      className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider transition-all ${
                        (activeDeckMode === tab.mode || (!activeDeckMode && tab.mode === 'DEFINITIVE_ARTIST'))
                          ? 'bg-[#1DB954] text-black shadow-lg shadow-[#1DB954]/20'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {tab.icon}
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* DYNAMIC FORM INNER CONTAINER */}
                <div className="space-y-6">
                  {(!activeDeckMode || activeDeckMode === 'DEFINITIVE_ARTIST') && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="relative">
                        <label className="block text-xs text-gray-500 mb-2 uppercase font-black tracking-widest">Explore Artist</label>
                        <div className="relative">
                          <input 
                            type="text"
                            value={defArtistSearchQuery}
                            onChange={(e) => setDefArtistSearchQuery(e.target.value)}
                            placeholder="Type to search e.g. Radiohead..."
                            className="w-full bg-black/40 text-white p-4 pl-10 rounded-xl border border-[#333] focus:border-purple-500/50 outline-none transition-all placeholder:text-gray-600 text-sm"
                          />
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                            <Search size={18} />
                          </div>
                        </div>

                        {defArtistSearchResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-[#1f1f1f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto">
                            <div className="p-2 space-y-1">
                              {defArtistSearchResults.map((artist) => (
                                <button
                                  key={artist.id}
                                  onClick={() => handleSelectDefArtist(artist)}
                                  className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
                                >
                                  {artist.image && <img src={artist.image} alt={artist.name} className="w-10 h-10 rounded-lg object-cover" />}
                                  <span className="text-white font-bold group-hover:text-purple-400 transition-colors">{artist.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {selectedDefArtist && (
                        <div className="bg-purple-950/20 border border-purple-500/20 p-4 rounded-2xl flex items-center gap-4 animate-in fade-in duration-300">
                          {selectedDefArtist.image && <img src={selectedDefArtist.image} alt={selectedDefArtist.name} className="w-14 h-14 rounded-xl object-cover shadow-lg" />}
                          <div>
                            <h4 className="font-bold text-white text-lg">{selectedDefArtist.name}</h4>
                            <span className="text-[10px] uppercase font-bold text-purple-400 tracking-widest">Selected Anchor</span>
                          </div>
                        </div>
                      )}

                      {selectedDefArtist && defArtistSuggestions.length > 0 && (
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 animate-in fade-in">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <Compass size={12} className="text-purple-400" /> Broaden your Horizon: Discover Similar
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {defArtistSuggestions.map((artist) => (
                              <button
                                key={artist.id}
                                onClick={() => handleSelectDefArtist({ id: artist.id, name: artist.name, image: artist.images?.[2]?.url || artist.images?.[0]?.url })}
                                className="px-3 py-1.5 rounded-full bg-purple-900/10 border border-purple-900/20 text-purple-300 text-xs font-bold hover:bg-purple-900/30 hover:border-purple-500/50 transition-all"
                              >
                                {artist.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button 
                        onClick={() => handleGenerateCultureDeck('DEFINITIVE_ARTIST', selectedDefArtist ? selectedDefArtist.name : defArtistSearchQuery)}
                        disabled={(!selectedDefArtist && !defArtistSearchQuery.trim()) || isProcessing}
                        className="w-full bg-purple-600 text-white hover:bg-purple-500 py-4 text-base font-bold shadow-lg"
                      >
                        Generate Definitive Deck
                      </Button>
                    </div>
                  )}

                  {activeDeckMode === 'SONIC_BRIDGE' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="grid grid-cols-1 gap-6">
                        <div className="relative">
                          <label className="block text-xs text-gray-500 mb-2 uppercase font-black tracking-widest">From (Genre or Artist)</label>
                          <div className="relative">
                            <input 
                              type="text"
                              value={bridgeFromSearchQuery}
                              onChange={(e) => setBridgeFromSearchQuery(e.target.value)}
                              placeholder="Search artist or genre..."
                              className="w-full bg-black/40 text-white p-4 pl-10 rounded-xl border border-[#333] focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-600 text-sm"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                              <Search size={18} />
                            </div>
                          </div>

                          {bridgeFromSearchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1f1f1f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto">
                              <div className="p-2 space-y-1">
                                {bridgeFromSearchResults.map((item) => (
                                  <button
                                    key={item.id}
                                    onClick={() => handleSelectBridgeFrom(item)}
                                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors text-left text-sm"
                                  >
                                    {item.image && <img src={item.image} alt={item.name} className="w-8 h-8 rounded-lg object-cover" />}
                                    <div>
                                      <span className="text-white font-bold block">{item.name}</span>
                                      <span className="text-[10px] text-gray-500 font-mono uppercase">{item.subtitle}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="relative">
                          <label className="block text-xs text-gray-500 mb-2 uppercase font-black tracking-widest">To (Target Genre)</label>
                          <div className="relative">
                            <input 
                              type="text"
                              value={bridgeToSearchQuery}
                              onChange={(e) => setBridgeToSearchQuery(e.target.value)}
                              placeholder="Search artist or genre..."
                              className="w-full bg-black/40 text-white p-4 pl-10 rounded-xl border border-[#333] focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-600 text-sm"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                              <Search size={18} />
                            </div>
                          </div>

                          {bridgeToSearchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1f1f1f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto">
                              <div className="p-2 space-y-1">
                                {bridgeToSearchResults.map((item) => (
                                  <button
                                    key={item.id}
                                    onClick={() => handleSelectBridgeTo(item)}
                                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors text-left text-sm"
                                  >
                                    {item.image && <img src={item.image} alt={item.name} className="w-8 h-8 rounded-lg object-cover" />}
                                    <div>
                                      <span className="text-white font-bold block">{item.name}</span>
                                      <span className="text-[10px] text-gray-500 font-mono uppercase">{item.subtitle}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => handleGenerateCultureDeck('SONIC_BRIDGE', `${selectedBridgeFrom ? selectedBridgeFrom.name : bridgeFromSearchQuery} to ${selectedBridgeTo ? selectedBridgeTo.name : bridgeToSearchQuery}`)}
                        disabled={(!selectedBridgeFrom && !bridgeFromSearchQuery.trim()) || (!selectedBridgeTo && !bridgeToSearchQuery.trim()) || isProcessing}
                        className="w-full bg-blue-600 text-white hover:bg-blue-500 py-4 text-base font-bold shadow-lg"
                      >
                        Build Sonic Bridge
                      </Button>
                    </div>
                  )}

                  {activeDeckMode === 'HORIZON_SCAN' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div>
                        <label className="block text-xs text-gray-500 mb-2 uppercase font-black tracking-widest">Subculture / City / Decade</label>
                        <input 
                          type="text"
                          value={horizonInput}
                          onChange={(e) => setHorizonInput(e.target.value)}
                          placeholder="e.g. UK Grime 2015, Detroit Techno 90s..."
                          className="w-full bg-black/40 text-white p-4 rounded-xl border border-[#333] focus:border-emerald-500/50 outline-none transition-all placeholder:text-gray-600 text-sm"
                        />
                      </div>
                      <Button 
                        onClick={() => handleGenerateCultureDeck('HORIZON_SCAN', horizonInput)}
                        disabled={!horizonInput.trim() || isProcessing}
                        className="w-full bg-emerald-600 text-white hover:bg-emerald-500 py-4 text-base font-bold shadow-lg"
                      >
                        Scan Horizon
                      </Button>
                    </div>
                  )}

                  {activeDeckMode === 'ZEITGEIST_RADAR' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div className="space-y-4 relative">
                        <label className="block text-xs text-gray-500 uppercase font-black tracking-widest">Selected Artists ({selectedZeitgeistArtists.length}/5)</label>
                        
                        {selectedZeitgeistArtists.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {selectedZeitgeistArtists.map((artist) => (
                              <div 
                                key={artist.id}
                                className="bg-white/10 backdrop-blur-md border border-white/10 pl-2 pr-3 py-1.5 rounded-full flex items-center gap-2"
                              >
                                {artist.image && <img src={artist.image} alt={artist.name} className="w-6 h-6 rounded-full object-cover" />}
                                <span className="text-xs font-bold text-white">{artist.name}</span>
                                <button 
                                  onClick={() => handleRemoveZeitgeistArtist(artist.id)}
                                  className="p-0.5 hover:bg-white/20 rounded-full text-gray-400 hover:text-white"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {selectedZeitgeistArtists.length < 5 && (
                          <div className="relative">
                            <input 
                              type="text"
                              value={zeitgeistSearchQuery}
                              onChange={(e) => setZeitgeistSearchQuery(e.target.value)}
                              placeholder="Search artist to add..."
                              className="w-full bg-black/40 text-white p-4 pl-10 rounded-xl border border-[#333] focus:border-[#1DB954] outline-none transition-all placeholder:text-gray-600 text-sm"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                              <Search size={18} />
                            </div>
                          </div>
                        )}

                        {zeitgeistSearchResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-[#1f1f1f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                            <div className="p-2 space-y-1">
                              {zeitgeistSearchResults.map((artist) => (
                                <button
                                  key={artist.id}
                                  onClick={() => handleSelectZeitgeistArtist(artist)}
                                  className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
                                >
                                  {artist.image && <img src={artist.image} alt={artist.name} className="w-10 h-10 rounded-lg object-cover" />}
                                  <span className="text-white font-bold group-hover:text-orange-400 transition-colors">{artist.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Combined Suggestions */}
                        {selectedZeitgeistArtists.length > 0 && zeitgeistSuggestions.length > 0 && (
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 animate-in fade-in">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                              <Sparkles size={12} className="text-orange-400 animate-pulse" /> Dynamic Overlap Suggestions
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {zeitgeistSuggestions.map((artist) => (
                                <button
                                  key={artist.id}
                                  onClick={() => handleSelectZeitgeistArtist({ id: artist.id, name: artist.name, image: artist.images?.[2]?.url || artist.images?.[0]?.url })}
                                  className="px-3 py-1.5 rounded-full bg-orange-950/20 border border-orange-500/20 text-orange-300 text-xs font-bold hover:bg-orange-950/30 hover:border-orange-500/50 transition-all flex items-center gap-1"
                                >
                                  + {artist.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <Button 
                        onClick={() => handleGenerateCultureDeck('ZEITGEIST_RADAR', selectedZeitgeistArtists.map(a => a.name).join(', '))}
                        disabled={selectedZeitgeistArtists.length === 0 || isProcessing}
                        className="w-full bg-orange-600 text-black hover:bg-orange-500 py-4 text-base font-bold shadow-lg"
                      >
                        Scan Zeitgeist Radar
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* CURATED PRESETS */}
              <div className="mt-8 border-t border-white/5 pt-6">
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-[#1DB954]" /> Curated Presets
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {CULTURE_DECK_PRESETS[activeDeckMode || 'DEFINITIVE_ARTIST'].map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handleGenerateCultureDeck(activeDeckMode || 'DEFINITIVE_ARTIST', preset.query)}
                      className="bg-white/5 border border-white/5 hover:border-[#1DB954]/50 hover:bg-white/10 rounded-xl p-2.5 text-left transition-all h-24 flex flex-col justify-between"
                    >
                      <span className="text-lg">{preset.image}</span>
                      <span className="font-bold text-white text-[10px] line-clamp-2 leading-tight">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT PLAYLIST CANVAS */}
            <div className="flex-1 min-w-0 flex flex-col justify-stretch">
              {!generatedCultureDeck ? (
                /* Spin Vinyl Placeholder */
                <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white/5 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden min-h-[500px] animate-in fade-in duration-700">
                  <div className="absolute inset-0 bg-[#1DB954]/5 blur-3xl rounded-full opacity-50 pointer-events-none" />
                  <div className="relative group mb-8">
                    <div className="absolute inset-0 bg-[#1DB954]/20 blur-3xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity animate-pulse" />
                    <div className="relative w-48 h-48 bg-black rounded-full shadow-2xl border-4 border-white/10 flex items-center justify-center animate-spin" style={{ animationDuration: '10s' }}>
                      <div className="absolute inset-2 border border-white/5 rounded-full" />
                      <div className="absolute inset-4 border border-white/5 rounded-full" />
                      <div className="absolute inset-6 border border-white/5 rounded-full" />
                      <div className="absolute inset-8 border border-white/5 rounded-full" />
                      <div className="absolute inset-10 border border-white/5 rounded-full" />
                      <div className="w-12 h-12 bg-[#1DB954]/20 rounded-full flex items-center justify-center border-4 border-black">
                        <Compass size={24} className="text-[#1DB954]" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Curator's Canvas</h3>
                  <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
                    Select a mode on the left panel, add your anchors, and generate a customized Culture Deck to begin your discovery journey.
                  </p>
                </div>
              ) : (
                /* Spotify Style Playlist view */
                <div className="bg-[#181818] border border-white/5 rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col flex-1 h-full min-h-[500px] animate-in slide-in-from-right duration-500 overflow-y-auto custom-scrollbar">
                  {/* Header info */}
                  <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8">
                    <div className="w-36 h-36 md:w-44 md:h-44 shrink-0 shadow-2xl">
                      <CultureDeckCover tracks={generatedCultureDeck.tracks} />
                    </div>
                    <div className="flex flex-col justify-end flex-1 min-w-0">
                      <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#1DB954] mb-2 flex items-center gap-1.5">
                        <Sparkles size={12} /> Culture Deck • {generatedCultureDeck.mode.replace(/_/g, ' ')}
                      </span>
                      <h2 className="text-3xl md:text-4xl font-black mb-3 text-white leading-tight">
                        {generatedCultureDeck.playlist_name}
                      </h2>
                      <p className="text-xs text-gray-500 font-mono mb-3">Context: "{generatedCultureDeck.inputContext}"</p>
                      
                      {/* Curator briefing description */}
                      <p className="text-xs md:text-sm text-gray-300 italic leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                        {generatedCultureDeck.curator_briefing}
                      </p>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex flex-wrap gap-4 mb-6 border-b border-white/5 pb-6">
                    {!playlistLink ? (
                      <Button onClick={handleSaveCultureDeckToSpotify} disabled={isProcessing} className="bg-[#1DB954] text-black">
                        {isProcessing ? <Loader2 className="animate-spin" /> : 'Export to Spotify'}
                      </Button>
                    ) : (
                      <a href={playlistLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-gray-200 w-fit">
                        <CheckCircle size={20} className="text-[#1DB954]" /> Open in Spotify
                      </a>
                    )}

                    <Button variant="outline" onClick={handleSaveCultureDeckToLibrary}>
                      Save to Library
                    </Button>

                    <Button 
                      variant="outline" 
                      onClick={handleRerollCultureDeck} 
                      disabled={isProcessing}
                      className="border-purple-500/50 hover:bg-purple-950/20 text-purple-300 hover:text-white"
                    >
                      <RefreshCw size={16} className={isProcessing ? 'animate-spin' : ''} /> Reroll Deck
                    </Button>
                  </div>

                  {/* Tracks list table */}
                  <div className="flex-1">
                    <div className="grid grid-cols-[30px_1fr] md:grid-cols-[40px_2fr_1fr] border-b border-white/5 pb-2 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">
                      <span>#</span>
                      <span>Title</span>
                      <span className="hidden md:inline">Category</span>
                    </div>

                    <div className="space-y-1">
                      {generatedCultureDeck.tracks.map((track, idx) => {
                        let badgeClass = '';
                        if (track.category === 'Anthem') badgeClass = 'bg-red-950/40 text-red-400 border-red-900/50';
                        else if (track.category === 'Fan Favorite') badgeClass = 'bg-purple-950/40 text-purple-400 border-purple-900/50';
                        else if (track.category === 'Deep Cut') badgeClass = 'bg-indigo-950/40 text-indigo-400 border-indigo-900/50';
                        else if (track.category === 'Zeitgeist') badgeClass = 'bg-orange-950/40 text-orange-400 border-orange-900/50';

                        return (
                          <div key={idx} className="grid grid-cols-[30px_1fr] md:grid-cols-[40px_2fr_1fr] p-3 rounded-xl hover:bg-white/5 transition-all items-start group">
                            <span className="text-gray-500 font-mono text-sm mt-1.5">{idx + 1}</span>
                            <div className="min-w-0 pr-4">
                              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                <span className="text-white font-bold truncate text-sm">{track.track_name}</span>
                                <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.2 rounded border md:hidden ${badgeClass}`}>
                                  {track.category}
                                </span>
                                {!track.uri && (
                                  <span className="bg-gray-850 text-gray-500 border border-gray-700/50 text-[8px] font-bold px-1.5 py-0.2 rounded ml-1">
                                    Not Found
                                  </span>
                                )}
                              </div>
                              <span className="text-gray-400 text-xs font-medium block mb-2">{track.artist}</span>
                              <p className="text-[11px] text-gray-500 italic bg-black/10 p-2 rounded-lg border border-white/5 leading-normal max-w-xl">
                                {track.why_it_matters}
                              </p>
                            </div>
                            <span className="hidden md:flex items-center mt-1">
                              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${badgeClass}`}>
                                {track.category}
                              </span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (appState === AppState.SAVED_VIBES) {
    return (
      <MainLayout sidebarProps={sidebarProps} onOpenMobileMenu={() => setIsMobileMenuOpen(true)}>
        <div className="p-6 md:p-12 pb-32">
          <header className="mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">Saved Vibes</h1>
            <p className="text-sm md:text-base text-gray-400">Your bookmarked AI sets ready for generation.</p>
          </header>

          {savedVibes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Heart size={64} className="text-gray-800 mb-4" />
              <h3 className="text-xl font-bold text-gray-400">No saved vibes yet</h3>
              <p className="text-gray-500 mt-2">Heart your favorite recommendations on the dashboard to see them here.</p>
              <Button onClick={() => setAppState(AppState.DASHBOARD)} variant="outline" className="mt-8">Go to Dashboard</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedVibes.map((vibe) => (
                <VibeCard
                  key={vibe.title}
                  vibe={vibe}
                  onGenerate={handleGenerate}
                  onToggleBookmark={handleToggleBookmark}
                  isBookmarked={true}
                />
              ))}
            </div>
          )}
        </div>
      </MainLayout>
    );
  }

  // Dashboard View
  return (
    <MainLayout sidebarProps={sidebarProps} onOpenMobileMenu={() => setIsMobileMenuOpen(true)}>
      <div className="p-6 md:p-12 pb-24">
        <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="md:max-w-xl">
            <h1 className="text-3xl md:text-5xl font-black mb-2 text-white tracking-tight">Good {new Date().getHours() < 12 ? 'Morning' : 'Evening'}</h1>
            <p className="text-gray-400 text-sm md:text-base">Ready to create your next mix?</p>
          </div>

          <div className="relative w-full md:w-80 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#1DB954] transition-colors">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search artist or song to seed..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#181818] border border-[#333] focus:border-[#1DB954] rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none transition-all text-white placeholder-gray-500"
            />

            {searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#282828] border border-[#333] rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto custom-scrollbar no-scrollbar">
                {/* Artist Results */}
                <div className="p-2 border-b border-[#333]">
                  <div className="text-[10px] text-gray-500 font-bold uppercase px-2 py-1">Artists</div>
                  {Array.from(new Set(library
                    .filter(t => t.artists[0]?.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(t => t.artists[0]?.name)))
                    .slice(0, 3)
                    .map(artistName => (
                      <button
                        key={`artist-${artistName}`}
                        onClick={() => {
                          if (!selectedSeeds.find(s => s.name === artistName && s.type === 'artist')) {
                            setSelectedSeeds([...selectedSeeds, { id: `artist-${artistName}`, name: artistName, type: 'artist' }]);
                          }
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-[#333] rounded-lg transition-colors flex items-center justify-between group/item"
                      >
                        <span className="text-sm font-medium text-white">{artistName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-purple-900/30 text-purple-300 px-1.5 py-0.5 rounded">Artist</span>
                          <Plus size={14} className="text-[#1DB954] opacity-0 group-hover/item:opacity-100" />
                        </div>
                      </button>
                    ))
                  }
                </div>

                {/* Track Results */}
                <div className="p-2">
                  <div className="text-[10px] text-gray-500 font-bold uppercase px-2 py-1">Songs</div>
                  {library
                    .filter(track => track.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .slice(0, 8)
                    .map(track => (
                      <button
                        key={`track-${track.id}`}
                        onClick={() => {
                          if (!selectedSeeds.find(s => s.id === track.id)) {
                            setSelectedSeeds([...selectedSeeds, { id: track.id, name: track.name, type: 'track', artist: track.artists[0]?.name }]);
                          }
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-[#333] rounded-lg transition-colors flex items-center justify-between group/item"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium truncate text-white">{track.name}</span>
                          <span className="text-xs text-gray-400">{track.artists[0]?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-blue-900/30 text-blue-300 px-1.5 py-0.5 rounded">Song</span>
                          <Plus size={14} className="text-[#1DB954] opacity-0 group-hover/item:opacity-100" />
                        </div>
                      </button>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Mood Input Section */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400">
              <Sparkles size={20} />
            </div>
            <h2 className="text-2xl font-bold text-white">Change the Vibe</h2>
          </div>

          <div className="bg-[#181818] border border-[#333] p-6 rounded-[2rem] group focus-within:border-purple-500/50 transition-all shadow-xl">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Describe your mood... (e.g., 'Rainy day jazz', '90s underground rave')"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && prompt.trim() && handleGenerate('prompt')}
                  className="w-full bg-black/40 border border-[#333] focus:border-purple-500/50 rounded-2xl py-4 px-6 text-lg focus:outline-none transition-all text-white placeholder-gray-500"
                />
              </div>

              {/* Length Selector */}
              <div className="flex flex-col gap-1 shrink-0">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-2">Tracks</span>
                <div className="flex items-center bg-black/40 border border-[#333] rounded-2xl p-1 gap-1">
                  {[20, 30, 40, 50].map((len) => (
                    <button
                      key={len}
                      onClick={() => setTargetLength(len)}
                      className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${targetLength === len ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                      {len}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => handleGenerate('prompt')}
                disabled={!prompt.trim() || isProcessing}
                className="px-10 py-4 bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20 rounded-2xl"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : <Wand2 size={20} />}
                Generate Vibe
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 items-center">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mr-2">Quick Moods:</span>
              <button
                onClick={() => { setPrompt('Breakup'); handleGenerate('prompt', 'Breakup'); }}
                className="px-4 py-2 rounded-full bg-red-900/10 border border-red-900/20 text-red-400 text-xs font-bold hover:bg-red-900/30 hover:border-red-500/50 transition-all flex items-center gap-2"
              >
                💔 Breakup
              </button>
              <button
                onClick={() => { setPrompt('Late night rainy drive'); handleGenerate('prompt', 'Late night rainy drive'); }}
                className="px-4 py-2 rounded-full bg-blue-900/10 border border-blue-900/20 text-blue-400 text-xs font-bold hover:bg-blue-900/30 hover:border-blue-500/50 transition-all flex items-center gap-2"
              >
                🌧️ Rainy Night
              </button>
              <button
                onClick={() => { setPrompt('High energy gym session'); handleGenerate('prompt', 'High energy gym session'); }}
                className="px-4 py-2 rounded-full bg-orange-900/10 border border-orange-900/20 text-orange-400 text-xs font-bold hover:bg-orange-900/30 hover:border-orange-500/50 transition-all flex items-center gap-2"
              >
                🔥 Energy
              </button>
              <button
                onClick={() => { setPrompt('Focus and deep concentration'); handleGenerate('prompt', 'Focus and deep concentration'); }}
                className="px-4 py-2 rounded-full bg-emerald-900/10 border border-emerald-900/20 text-emerald-400 text-xs font-bold hover:bg-emerald-900/30 hover:border-emerald-500/50 transition-all flex items-center gap-2"
              >
                🧠 Focus
              </button>
            </div>
          </div>
        </section>

        {/* Workout & Sports Mixes */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-orange-500/20 p-2 rounded-lg text-orange-400">
              <Zap size={20} />
            </div>
            <h2 className="text-2xl font-bold text-white">Workout & Action</h2>
            <span className="text-[10px] bg-orange-900/40 text-orange-400 px-2 py-1 rounded border border-orange-900/50 uppercase font-bold tracking-widest ml-2">Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Gym / Heavy Lifting */}
            <div
              onClick={() => handleGenerate('prompt', 'High energy, aggressive heavy lifting gym session, metal or hard rap')}
              className="relative h-48 rounded-3xl overflow-hidden cursor-pointer group transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-500/20 border border-white/5 bg-gradient-to-br from-[#7c2d12] via-black to-[#450a0a]"
            >
              <div className="absolute inset-x-0 bottom-0 p-6">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2 text-orange-400 drop-shadow-md">
                    <span className="text-[20px]">🏋️</span>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-1 uppercase tracking-tighter drop-shadow-md">Gym Intensity</h3>
                  <p className="text-sm text-white/70 drop-shadow-md">Heavy lifting hits for PRs</p>
                </div>
              </div>
            </div>

            {/* Running */}
            <div
              onClick={() => handleGenerate('prompt', '160 BPM steady paced running music, upbeat pop and electronic')}
              className="relative h-48 rounded-3xl overflow-hidden cursor-pointer group transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20 border border-white/5 bg-gradient-to-br from-[#1e3a8a] via-black to-[#064e3b]"
            >
              <div className="absolute inset-x-0 bottom-0 p-6">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2 text-blue-400 drop-shadow-md">
                    <span className="text-[20px]">🏃</span>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-1 uppercase tracking-tighter drop-shadow-md">Runner's High</h3>
                  <p className="text-sm text-white/70 drop-shadow-md">Steady paced, upbeat fuel</p>
                </div>
              </div>
            </div>

            {/* Sports / Team */}
            <div
              onClick={() => handleGenerate('prompt', 'Upbeat stadium sports motivation hype music, hiphop and rock')}
              className="relative h-48 rounded-3xl overflow-hidden cursor-pointer group transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/20 border border-white/5 bg-gradient-to-br from-[#064e3b] via-black to-[#831843]"
            >
              <div className="absolute inset-x-0 bottom-0 p-6">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2 text-emerald-400 drop-shadow-md">
                    <span className="text-[20px]">🏆</span>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-1 uppercase tracking-tighter drop-shadow-md">Sports Hype</h3>
                  <p className="text-sm text-white/70 drop-shadow-md">Stadium motivation & agility</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {
          selectedSeeds.length > 0 && (
            <section className="mb-8 p-4 bg-[#1DB954]/5 rounded-2xl border border-[#1DB954]/10">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={16} className="text-[#1DB954]" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Search Seeds</span>
                <button
                  onClick={() => setSelectedSeeds([])}
                  className="text-xs text-red-500 hover:text-red-400 ml-auto font-bold"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedSeeds.map(seed => (
                  <div key={seed.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${seed.type === 'artist'
                    ? 'bg-purple-900/20 border-purple-500/30 text-purple-300'
                    : 'bg-blue-900/20 border-blue-500/30 text-blue-300'
                    }`}>
                    <span className="text-[10px] opacity-60 uppercase font-black">{seed.type}</span>
                    <span>{seed.name}</span>
                    <button onClick={() => setSelectedSeeds(selectedSeeds.filter(s => s.id !== seed.id))} className="hover:text-white transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleGenerate('prompt')}
                className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-3 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#1DB954]/20"
              >
                <Music size={18} />
                Generate Balanced Mix from Seeds
              </button>
            </section>
          )
        }

        {
          tasteDNA && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="bg-[#1DB954]/20 p-2 rounded-lg">
                    <CloudLightning size={20} className="text-[#1DB954]" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Recommended for You</h2>
                  <button
                    onClick={handleRefreshVibes}
                    disabled={isRefreshingVibes}
                    className="p-2 hover:bg-[#282828] rounded-full transition-colors text-gray-500 hover:text-[#1DB954] group"
                    title="Refresh AI Suggestions"
                  >
                    <RefreshCw size={18} className={`${isRefreshingVibes ? 'animate-spin text-[#1DB954]' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
                  </button>
                </div>
                <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">AI Categorized</span>
              </div>

              {/* Hero Card / Featured Vibe */}
              <div className="mb-12">
                <div
                  onClick={() => handleGenerate('prompt', tasteDNA.featured.prompt)}
                  className={`relative w-full h-[600px] md:h-[500px] rounded-[2rem] md:rounded-[2rem] overflow-hidden cursor-pointer group shadow-2xl transition-all duration-700 hover:shadow-emerald-900/20 ${getGradientByVibe(tasteDNA.featured.title)}`}
                >
                  {/* Noise Texture Overlay */}
                  <div className="absolute inset-0 bg-noise opacity-30 mix-blend-overlay pointer-events-none" />

                  {/* Darker Gradient Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />

                  {/* Watermark Typography Background */}
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden z-0 pointer-events-none opacity-10">
                    <span className="text-[15rem] font-black text-transparent stroke-white stroke-2 whitespace-nowrap -rotate-6 select-none uppercase blur-sm">
                      {tasteDNA.featured.title.split(' ')[0] || 'VIBE'}
                    </span>
                  </div>

                  {/* Content Container */}
                  <div className="absolute inset-0 p-6 md:p-14 z-20 flex flex-col justify-between">

                    {/* Top Tag */}
                    <div className="flex items-start justify-between">
                      <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold uppercase tracking-[0.2em] text-[10px] px-4 py-2 rounded-full flex items-center gap-2">
                        <Zap size={12} className="fill-white" /> Featured Vibe
                      </span>

                      <button
                        onClick={(e) => handleToggleBookmark(e, tasteDNA.featured)}
                        className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md border border-white/10 group/heart"
                      >
                        <Heart
                          size={24}
                          className={`${savedVibes.some(v => v.title === tasteDNA.featured.title) ? "fill-[#1DB954] text-[#1DB954]" : "text-white"} group-hover/heart:scale-110 transition-transform`}
                        />
                      </button>
                    </div>

                    {/* Main Content */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8">
                      <div className="max-w-2xl">
                        <h1 className="text-3xl md:text-7xl font-black mb-4 md:mb-6 text-white leading-[0.9] tracking-tight drop-shadow-xl uppercase">
                          {tasteDNA.featured.title}
                        </h1>
                        <p className="text-gray-200 text-sm md:text-xl font-light leading-relaxed max-w-lg drop-shadow-md border-l-2 border-[#1DB954] pl-4">
                          {tasteDNA.featured.description}
                        </p>
                      </div>

                      {/* Action Button */}
                      <div className="shrink-0 w-full md:w-auto">
                        <div
                          onClick={(e: any) => { e.stopPropagation(); handleGenerate('prompt', tasteDNA.featured.prompt); }}
                          className="bg-white text-black font-black text-sm md:text-lg py-4 md:py-5 px-8 md:px-10 rounded-full flex items-center justify-center gap-3 transition-all hover:scale-105 hover:bg-gray-100 shadow-xl shadow-black/50 group/btn cursor-pointer w-full md:w-auto"
                        >
                          Generate Mix
                          <span className="bg-black text-white rounded-full p-1 group-hover/btn:rotate-45 transition-transform duration-300">
                            <Zap size={16} className="fill-white" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Swimlanes */}
              <div className="space-y-12">
                {tasteDNA.categories.map((category) => (
                  <div key={category.title} className="relative">
                    <h3 className="text-xl font-bold mb-4 px-4 md:px-0 text-white">{category.title}</h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 px-4 md:px-0 no-scrollbar scroll-smooth snap-x snap-mandatory">
                      {category.items.map((item) => (
                        <div key={item.title} className="min-w-[280px] md:min-w-[350px] shrink-0 snap-start">
                          <VibeCard
                            vibe={item}
                            onGenerate={handleGenerate}
                            onToggleBookmark={handleToggleBookmark}
                            isBookmarked={savedVibes.some(v => v.title === item.title)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        }

        <div className="pb-12 text-center text-gray-600 text-sm">
          <p>Vibeify AI — Premium Music Curation</p>
        </div>
      </div>

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-[#1DB954] text-black rounded-full shadow-2xl shadow-[#1DB954]/40 flex items-center justify-center hover:scale-110 hover:bg-[#1ed760] transition-all z-[100] group active:scale-95"
      >
        <Wand2 size={32} className="group-hover:rotate-12 transition-transform" />
        <span className="absolute right-full mr-4 bg-black/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Create Custom Vibe
        </span>
      </button>

      {/* Create Vibe Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[400] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity"
            onClick={() => setIsCreateModalOpen(false)}
          />

          <div className="relative bg-[#181818] border-t md:border border-white/10 w-full max-w-2xl rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 max-h-[92vh] flex flex-col">
            <div className="p-6 md:p-12 overflow-y-auto custom-scrollbar no-scrollbar flex-1 pb-32 md:pb-12">
              <div className="flex justify-between items-center mb-6 md:mb-10 sticky top-0 bg-[#181818] z-20 py-2">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
                    <Sparkles className="text-[#1DB954]" /> Create your Vibe
                  </h2>
                  <p className="text-gray-500 text-xs md:text-sm mt-1">Design your unique sonic landscape</p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-colors"
                >
                  <X size={28} />
                </button>
              </div>

              <div className="space-y-10">
                {/* Source Selection Toggle */}
                <div className="flex bg-white/5 p-1 rounded-2xl w-full border border-white/5">
                  <button
                    onClick={() => setVibeForm({ ...vibeForm, source: 'library' })}
                    className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest transition-all ${vibeForm.source === 'library'
                      ? 'bg-[#1DB954] text-black shadow-lg shadow-[#1DB954]/20'
                      : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    <Library size={18} /> My Library
                  </button>
                  <button
                    onClick={() => setVibeForm({ ...vibeForm, source: 'global' })}
                    className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest transition-all ${vibeForm.source === 'global'
                      ? 'bg-[#1DB954] text-black shadow-lg shadow-[#1DB954]/20'
                      : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    <Globe size={18} /> Global Discovery
                  </button>
                </div>

                {/* Recently Added Toggle (Library Only) */}
                {vibeForm.source === 'library' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#1DB954]">
                      <div className="w-2 h-2 rounded-full bg-[#1DB954]" /> Time Focus
                    </label>
                    <div className="flex bg-white/5 p-1 rounded-2xl w-full border border-white/5">
                      <button
                        onClick={() => setVibeForm({ ...vibeForm, useRecentlyAdded: false })}
                        className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${!vibeForm.useRecentlyAdded
                          ? 'bg-white/10 text-white border border-white/10'
                          : 'text-gray-500 hover:text-white'
                          }`}
                      >
                        <Library size={14} /> Full Library
                      </button>
                      <button
                        onClick={() => setVibeForm({ ...vibeForm, useRecentlyAdded: true })}
                        className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${vibeForm.useRecentlyAdded
                          ? 'bg-[#1DB954] text-black shadow-lg shadow-[#1DB954]/20'
                          : 'text-gray-400 hover:text-white'
                          }`}
                      >
                        <History size={14} /> Recently Added
                      </button>
                    </div>
                  </div>
                )}

                {/* Strategy Selection (Library Only) */}
                {vibeForm.source === 'library' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#1DB954]">
                      <div className="w-2 h-2 rounded-full bg-[#1DB954]" /> Sorting Strategy
                    </label>
                    <div className="flex bg-white/5 p-1 rounded-2xl w-full border border-white/5">
                      <button
                        onClick={() => setVibeForm({ ...vibeForm, strategy: 'best_match' })}
                        className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${vibeForm.strategy === 'best_match'
                          ? 'bg-white/10 text-white border border-white/10'
                          : 'text-gray-500 hover:text-white'
                          }`}
                      >
                        <Trophy size={14} /> Best Match
                      </button>
                      <button
                        onClick={() => setVibeForm({ ...vibeForm, strategy: 'buried_treasures' })}
                        className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${vibeForm.strategy === 'buried_treasures'
                          ? 'bg-[#1DB954] text-black shadow-lg shadow-[#1DB954]/20'
                          : 'text-gray-400 hover:text-white'
                          }`}
                      >
                        <Compass size={14} /> Buried Treasures
                      </button>
                    </div>
                  </div>
                )}

                {/* Sektion 1: The Anchor */}
                <div className="space-y-4 relative">
                  <label className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-[#1DB954]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#1DB954]" /> The Anchor
                    </div>
                    <span className={`${vibeForm.selectedSeeds.length >= 5 ? 'text-red-500' : 'text-gray-500'}`}>
                      {vibeForm.selectedSeeds.length}/5 Seeds
                    </span>
                  </label>

                  {/* Selection Chips */}
                  {vibeForm.selectedSeeds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {vibeForm.selectedSeeds.map(seed => (
                        <div
                          key={seed.id}
                          className="bg-white/10 backdrop-blur-md border border-white/10 pl-1.5 pr-3 py-1.5 rounded-full flex items-center gap-2 group/chip transition-all hover:bg-white/20 animate-in fade-in slide-in-from-left-2"
                        >
                          {seed.image ? (
                            <img src={seed.image} alt={seed.name} className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                              <Search size={10} />
                            </div>
                          )}
                          <div className="text-xs font-bold text-white max-w-[120px] truncate">{seed.name}</div>
                          <button
                            onClick={() => handleRemoveSeed(seed.id)}
                            className="p-1 hover:bg-white/20 rounded-full text-gray-400 hover:text-white transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="relative group">
                    {/* Quick Select: Recent Songs */}
                    {!modalSearchQuery && vibeForm.selectedSeeds.length < 5 && library.length > 0 && (
                      <div className="mb-6 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[#1DB954]/60">Pick from your latest adds</label>
                          <div className="h-[1px] flex-1 bg-white/5 ml-4" />
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                          {library.slice(0, 15).map((track: SpotifyTrack) => {
                            const isSelected = vibeForm.selectedSeeds.some(s => s.id === track.id);
                            return (
                              <button
                                key={track.id}
                                onClick={() => handleSelectSeed({
                                  id: track.id,
                                  name: track.name,
                                  type: 'track',
                                  artist: track.artists[0]?.name,
                                  image: track.album.images[2]?.url || track.album.images[0]?.url,
                                  subtitle: `Track • ${track.artists[0]?.name}`
                                })}
                                disabled={isSelected}
                                className={`flex-shrink-0 w-24 flex flex-col items-center text-center transition-all ${isSelected ? 'opacity-30 grayscale' : 'hover:scale-110 active:scale-95'}`}
                              >
                                <div className="relative group/recent">
                                  <img
                                    src={track.album.images[1]?.url || track.album.images[0]?.url}
                                    alt={track.name}
                                    className="w-16 h-16 rounded-xl object-cover mb-2 shadow-2xl transition-all group-hover/recent:rounded-[1.5rem]"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/recent:opacity-100 flex items-center justify-center rounded-xl transition-opacity">
                                    <Plus size={20} className="text-white" />
                                  </div>
                                </div>
                                <div className="text-[10px] font-bold text-white line-clamp-1 w-full">{track.name}</div>
                                <div className="text-[8px] text-gray-500 line-clamp-1 w-full">{track.artists[0].name}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#1DB954] transition-colors">
                      {isModalSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                    </div>
                    <input
                      type="text"
                      value={modalSearchQuery}
                      onChange={(e) => setModalSearchQuery(e.target.value)}
                      disabled={vibeForm.selectedSeeds.length >= 5}
                      placeholder={vibeForm.selectedSeeds.length >= 5 ? "Max seeds reached" : "Search for Artists or Tracks..."}
                      className="w-full bg-white/5 border border-white/5 focus:border-[#1DB954] rounded-2xl py-3.5 md:py-4 pl-12 pr-5 text-white outline-none transition-all placeholder:text-gray-600 text-sm md:text-base"
                    />

                    {/* Search Results Dropdown */}
                    {modalSearchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[#1f1f1f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-2 space-y-1">
                          {modalSearchResults.map((result) => (
                            <button
                              key={result.id}
                              onClick={() => handleSelectSeed(result)}
                              className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group/res"
                            >
                              <div className="relative shrink-0">
                                {result.image ? (
                                  <img src={result.image} alt={result.name} className="w-12 h-12 rounded-lg object-cover shadow-lg" />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center">
                                    <Search size={20} className="text-gray-600" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-[#1DB954]/20 opacity-0 group-hover/res:opacity-100 transition-opacity rounded-lg" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-white font-bold truncate group-hover/res:text-[#1DB954] transition-colors">{result.name}</div>
                                <div className="text-gray-500 text-xs uppercase tracking-wider font-black">{result.subtitle}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sektion 2: The Atmosphere */}
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#1DB954]">
                    <div className="w-2 h-2 rounded-full bg-[#1DB954]" /> The Atmosphere
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {atmosphereTags.map(tag => (
                      <button
                        key={tag.label}
                        onClick={() => handleToggleTag(tag.label)}
                        className={`px-4 py-2.5 md:px-5 md:py-3 rounded-full text-sm md:text-base font-bold transition-all flex items-center gap-2 border ${vibeForm.atmosphere.includes(tag.label)
                          ? 'bg-[#1DB954] text-black border-[#1DB954] scale-105 shadow-lg shadow-[#1DB954]/20'
                          : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
                          }`}
                      >
                        <span>{tag.emoji}</span> {tag.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sektion 3: Sonic Sliders */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-[#1DB954]">
                      <label className="flex items-center gap-2">
                        <Waves size={14} /> Energy
                      </label>
                      <span className="text-white bg-white/10 px-2 py-0.5 rounded">{vibeForm.energy}%</span>
                    </div>
                    <div className="relative group">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={vibeForm.energy}
                        onChange={(e) => setVibeForm({ ...vibeForm, energy: parseInt(e.target.value) })}
                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#1DB954] transition-all"
                      />
                      <div className="flex justify-between mt-2 text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                        <span>Low Key</span>
                        <span>Balanced</span>
                        <span>High Voltage</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-[#1DB954]">
                      <label className="flex items-center gap-2">
                        <History size={14} /> Discovery
                      </label>
                      <span className="text-white bg-white/10 px-2 py-0.5 rounded">{vibeForm.discovery}%</span>
                    </div>
                    <div className="relative group">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={vibeForm.discovery}
                        onChange={(e) => setVibeForm({ ...vibeForm, discovery: parseInt(e.target.value) })}
                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#1DB954] transition-all"
                      />
                      <div className="flex justify-between mt-2 text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                        <span>Only Hits</span>
                        <span>Balanced</span>
                        <span>Deep Cuts</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 left-0 right-0 p-6 md:p-0 bg-gradient-to-t from-[#181818] via-[#181818] to-transparent md:static md:bg-none z-30 pt-10">
                  <button
                    onClick={generateCustomVibe}
                    className="w-full bg-[#1DB954] md:bg-white text-black font-black py-4 md:py-5 rounded-2xl text-lg md:text-xl hover:scale-[1.02] shadow-xl shadow-black/50 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    Generate Vibe Mix
                    <Wand2 size={24} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Create Vibe Modal (Keep Existing) */}
      {/* ... previous content remained ... */}

      {/* Taste DNA Insight Modal */}
      <UserInsightsModal
        isOpen={isDNAModalOpen}
        onClose={() => setIsDNAModalOpen(false)}
        library={library}
        token={token}
      />
    </MainLayout>
  );
}