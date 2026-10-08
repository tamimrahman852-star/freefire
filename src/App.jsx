import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { 
  Trophy, ShieldCheck, Crosshair, Users, Key, Gamepad2, PlusCircle, 
  CheckCircle, Clock, AlertCircle, Settings, Award, BookOpen, Flame, Check, Lock, 
  RefreshCw, Copy, Trash2, X, Search, Filter, AlertTriangle, UserCheck,
  Play, Tv, Sparkles, Phone, DollarSign, Eye
} from 'lucide-react';

const IMAGES = {
  heroBanner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop',
  bermuda: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop',
  purgatory: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=600&auto=format&fit=crop',
  kalahari: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop',
  alpine: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=600&auto=format&fit=crop',
  nexterra: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop',
};

const MOCK_TOURNAMENTS = [
  {
    id: 'ff-101',
    title: 'BOOYAH GRAND CHAMPIONSHIP S1',
    map: 'Bermuda',
    map_img: IMAGES.bermuda,
    mode: 'SQUAD',
    entry_fee: 100,
    prize_pool: 2500,
    per_kill: 25,
    total_slots: 48,
    display_time: 'Today at 08:00 PM',
    status: 'UPCOMING',
    stream_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    room_id: '8827391',
    room_pass: '1234'
  },
  {
    id: 'ff-102',
    title: 'SOLO SURVIVOR SHOWDOWN',
    map: 'Purgatory',
    map_img: IMAGES.purgatory,
    mode: 'SOLO',
    entry_fee: 0,
    prize_pool: 600,
    per_kill: 10,
    total_slots: 48,
    display_time: 'Tomorrow at 04:00 PM',
    status: 'UPCOMING',
    stream_url: '',
    room_id: '',
    room_pass: ''
  },
  {
    id: 'ff-103',
    title: 'CLASH SQUAD 4v4 WARFARE',
    map: 'Kalahari',
    map_img: IMAGES.kalahari,
    mode: 'CS 4v4',
    entry_fee: 200,
    prize_pool: 3500,
    per_kill: 50,
    total_slots: 16,
    display_time: 'Tomorrow at 09:00 PM',
    status: 'LIVE',
    stream_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    room_id: '9920144',
    room_pass: '7788'
  }
];

const INITIAL_LEADERBOARD = [
  { squad_name: 'VIP ELITE', matches_played: 5, booyah_count: 3, total_kills: 42, placement_points: 36, total_points: 78 },
  { squad_name: 'NEXUS GAMING', matches_played: 5, booyah_count: 1, total_kills: 35, placement_points: 23, total_points: 58 },
  { squad_name: 'BD ESPORTS', matches_played: 5, booyah_count: 1, total_kills: 28, placement_points: 21, total_points: 49 },
  { squad_name: 'CYBER WARRIORS', matches_played: 4, booyah_count: 0, total_kills: 22, placement_points: 18, total_points: 40 },
];

export default function App() {
  const [tournaments, setTournaments] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tournaments');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [streamModalMatch, setStreamModalMatch] = useState(null);
  const [toast, setToast] = useState(null);

  // Filters State
  const [filterMode, setFilterMode] = useState('ALL');
  const [filterMap, setFilterMap] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Admin Security States
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const ADMIN_PIN = '1234';

  // Point Calculator State
  const [calcKills, setCalcKills] = useState(0);
  const [calcRank, setCalcRank] = useState(1);

  // Squad Registration Form State
  const [regForm, setRegForm] = useState({
    squadName: '',
    leaderIgn: '',
    leaderUid: '',
    player2Uid: '',
    player3Uid: '',
    player4Uid: '',
    subUid: '',
    whatsapp: '',
    paymentMethod: 'Bkash',
    trxId: ''
  });

  // Admin Form States
  const [newMatch, setNewMatch] = useState({
    title: '',
    map: 'Bermuda',
    mode: 'SQUAD',
    entryFee: 50,
    prizePool: 1000,
    perKill: 15,
    totalSlots: 48,
    displayTime: '',
    streamUrl: ''
  });

  const [leaderForm, setLeaderForm] = useState({
    squadName: '',
    matchesPlayed: 1,
    booyahCount: 0,
    totalKills: 0,
    placementPoints: 0
  });

  const [noticeInput, setNoticeInput] = useState('');
  const [roomInputs, setRoomInputs] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tourneyRes, regRes, leadRes, noticeRes] = await Promise.all([
        supabase.from('tournaments').select('*').order('created_at', { ascending: false }),
        supabase.from('registrations').select('*').order('created_at', { ascending: false }),
        supabase.from('leaderboard').select('*').order('total_points', { ascending: false }),
        supabase.from('notices').select('*').eq('is_active', true).order('created_at', { ascending: false })
      ]);

      if (tourneyRes.error || !tourneyRes.data || tourneyRes.data.length === 0) {
        setTournaments(MOCK_TOURNAMENTS);
      } else {
        setTournaments(tourneyRes.data);
      }

      if (!regRes.error && regRes.data) {
        setRegistrations(regRes.data);
      }

      if (leadRes.error || !leadRes.data || leadRes.data.length === 0) {
        setLeaderboard(INITIAL_LEADERBOARD);
      } else {
        setLeaderboard(leadRes.data);
      }

      if (noticeRes.error || !noticeRes.data || noticeRes.data.length === 0) {
        setNotices([{ text: '🔥 Welcome to Booyah Arena! Daily Free Fire Tournaments with Instant Bkash/Nagad Cashouts!' }]);
      } else {
        setNotices(noticeRes.data);
      }
    } catch (err) {
      console.error('Data Fetch Error:', err);
      setTournaments(MOCK_TOURNAMENTS);
      setLeaderboard(INITIAL_LEADERBOARD);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!selectedMatch) return;

    const isFree = Number(selectedMatch.entry_fee) === 0;
    const newReg = {
      tournament_id: selectedMatch.id,
      squad_name: regForm.squadName,
      leader_ign: regForm.leaderIgn,
      leader_uid: regForm.leaderUid,
      player2_uid: regForm.player2Uid || null,
      player3_uid: regForm.player3Uid || null,
      player4_uid: regForm.player4Uid || null,
      sub_uid: regForm.subUid || null,
      whatsapp: regForm.whatsapp,
      payment_method: regForm.paymentMethod,
      trx_id: isFree ? 'FREE_ENTRY' : regForm.trxId,
      status: isFree ? 'APPROVED' : 'PENDING'
    };

    try {
      const { error } = await supabase.from('registrations').insert([newReg]);
      if (error) {
        console.error('Insert error:', error);
        setRegistrations(prev => [newReg, ...prev]);
      }
      showToast(
        isFree 
          ? 'Slot booked successfully!' 
          : 'Registration submitted! Awaiting Admin payment verification.'
      );
      setModalOpen(false);
      setRegForm({
        squadName: '', leaderIgn: '', leaderUid: '', player2Uid: '', 
        player3Uid: '', player4Uid: '', subUid: '', whatsapp: '', paymentMethod: 'Bkash', trxId: ''
      });
      fetchData();
    } catch (err) {
      showToast('Registration submitted locally', 'info');
      setModalOpen(false);
    }
  };

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    let mapImg = IMAGES.bermuda;
    if (newMatch.map === 'Purgatory') mapImg = IMAGES.purgatory;
    if (newMatch.map === 'Kalahari') mapImg = IMAGES.kalahari;
    if (newMatch.map === 'Alpine') mapImg = IMAGES.alpine;
    if (newMatch.map === 'Nexterra') mapImg = IMAGES.nexterra;

    const matchPayload = {
      id: 'ff-' + Date.now(),
      title: newMatch.title,
      map: newMatch.map,
      map_img: mapImg,
      mode: newMatch.mode,
      entry_fee: Number(newMatch.entryFee),
      prize_pool: Number(newMatch.prizePool),
      per_kill: Number(newMatch.perKill),
      total_slots: Number(newMatch.totalSlots),
      display_time: newMatch.displayTime,
      status: 'UPCOMING',
      stream_url: newMatch.streamUrl || '',
      room_id: '',
      room_pass: ''
    };

    const { error } = await supabase.from('tournaments').insert([matchPayload]);
    if (error) {
      setTournaments(prev => [matchPayload, ...prev]);
    }
    showToast('Match Published Successfully!');
    setNewMatch({ title: '', map: 'Bermuda', mode: 'SQUAD', entryFee: 50, prizePool: 1000, perKill: 15, totalSlots: 48, displayTime: '', streamUrl: '' });
    fetchData();
  };

  const updateRoomCredentials = async (tId) => {
    const inputs = roomInputs[tId] || {};
    const { error } = await supabase
      .from('tournaments')
      .update({ room_id: inputs.roomId || '', room_pass: inputs.roomPass || '' })
      .eq('id', tId);

    if (error) {
      setTournaments(prev => prev.map(t => t.id === tId ? { ...t, room_id: inputs.roomId, room_pass: inputs.roomPass } : t));
    }
    showToast('Room credentials broadcasted to players!');
    fetchData();
  };

  const updateRegStatus = async (regId, status) => {
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ status })
        .eq('id', regId);

      if (error) {
        setRegistrations(prev => prev.map(r => r.id === regId ? { ...r, status } : r));
      }
      const statusMsg = 'Registration marked as ' + status;
      showToast(statusMsg);
      fetchData();
    } catch (err) {
      showToast('Status updated locally');
    }
  };

  const handleAddLeaderboard = async (e) => {
    e.preventDefault();
    const totalPts = Number(leaderForm.placementPoints) + Number(leaderForm.totalKills);
    const payload = {
      squad_name: leaderForm.squadName,
      matches_played: Number(leaderForm.matchesPlayed),
      booyah_count: Number(leaderForm.booyahCount),
      total_kills: Number(leaderForm.totalKills),
      placement_points: Number(leaderForm.placementPoints),
      total_points: totalPts
    };

    const { error } = await supabase.from('leaderboard').upsert([payload], { onConflict: 'squad_name' });
    if (error) {
      setLeaderboard(prev => [...prev.filter(x => x.squad_name !== payload.squad_name), payload]);
    }
    showToast('Leaderboard score updated!');
    setLeaderForm({ squadName: '', matchesPlayed: 1, booyahCount: 0, totalKills: 0, placementPoints: 0 });
    fetchData();
  };

  const handleDeleteMatch = async (tId) => {
    if (!confirm('Are you sure you want to delete this tournament?')) return;
    const { error } = await supabase.from('tournaments').delete().eq('id', tId);
    if (error) {
      setTournaments(prev => prev.filter(t => t.id !== tId));
    }
    showToast('Tournament removed', 'error');
    fetchData();
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPinInput === ADMIN_PIN) {
      setIsAdminLoggedIn(true);
      setAdminPinInput('');
      showToast('Super Admin access granted!');
    } else {
      showToast('Invalid Admin Security PIN!', 'error');
    }
  };

  const handleAddNotice = async (e) => {
    e.preventDefault();
    if (!noticeInput.trim()) return;
    const { error } = await supabase.from('notices').insert([{ text: noticeInput, is_active: true }]);
    if (error) {
      setNotices(prev => [{ text: noticeInput }, ...prev]);
    }
    setNoticeInput('');
    showToast('Ticker notice broadcasted!');
    fetchData();
  };

  const filteredTournaments = useMemo(() => {
    return tournaments.filter(t => {
      const matchMode = filterMode === 'ALL' || t.mode === filterMode;
      const matchMap = filterMap === 'ALL' || t.map === filterMap;
      const matchSearch = (t.title || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchMode && matchMap && matchSearch;
    });
  }, [tournaments, filterMode, filterMap, searchQuery]);

  const calcPoints = useMemo(() => {
    const placementPointsMap = { 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1 };
    const rankPts = placementPointsMap[calcRank] || 0;
    const killPts = Number(calcKills) * 1;
    return { rankPts, killPts, total: rankPts + killPts };
  }, [calcKills, calcRank]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-gray-100 pb-24 md:pb-12 font-sans selection:bg-amber-500 selection:text-black">
      
      {/* 🔔 TOAST NOTIFICATION */}
{toast && (
  <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl border font-bold text-sm shadow-2xl flex items-center gap-3 backdrop-blur-md animate-bounce ${
    toast.type === 'error' ? 'bg-red-950/90 border-red-500 text-red-300' : 
    toast.type === 'info' ? 'bg-blue-950/90 border-blue-500 text-blue-300' : 'bg-emerald-950/90 border-emerald-500 text-emerald-300'
  }`}>
    {toast.message}
  </div>
)}
  

      {/* 📢 ANNOUNCEMENT TICKER */}
      {notices.length > 0 && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 py-2 px-4 text-xs font-semibold text-amber-300 flex items-center gap-2 overflow-hidden">
          <span className="bg-amber-500 text-black px-2 py-0.5 rounded font-black text-[10px] uppercase shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> OFFICIAL NEWS
          </span>
          <div className="whitespace-nowrap overflow-x-auto no-scrollbar flex items-center gap-8 text-amber-200">
            {notices.map((n, idx) => <span key={idx} className="mr-8 inline-block">• {n.text}</span>)}
          </div>
        </div>
      )}

      {/* 🚀 NAVBAR */}
      <header className="bg-[#0E121B]/90 border-b border-amber-500/20 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('tournaments')}>
            <div className="bg-gradient-to-tr from-amber-600 to-yellow-400 text-black p-2 rounded-xl font-extrabold text-xl font-teko leading-none shadow-lg shadow-amber-500/20 flex items-center justify-center">
              FF
            </div>
            <div>
              <span className="font-teko text-2xl font-bold tracking-wider text-amber-400 block leading-none">BOOYAH ARENA</span>
              <span className="text-[9px] text-gray-400 tracking-widest uppercase font-semibold block">Official Esports Platform</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {[
              { id: 'tournaments', label: 'Matches', icon: Gamepad2 },
              { id: 'myMatches', label: 'My Slots', icon: Key },
              { id: 'streams', label: 'Watch Live', icon: Tv },
              { id: 'leaderboard', label: 'Standings', icon: Award },
              { id: 'rules', label: 'Rules & Calc', icon: BookOpen },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}

            <button
              onClick={() => setActiveTab('admin')}
              className={`ml-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition flex items-center gap-2 border ${
                activeTab === 'admin' ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/20' : 'border-red-500/30 text-red-400 hover:bg-red-500/10'
              }`}
            >
              <Settings className="w-4 h-4" /> Admin
            </button>
          </nav>
        </div>
      </header>

      {/* 💥 HERO HEADER BANNER */}
      <div className="relative border-b border-amber-500/20 overflow-hidden bg-[#0A0D14]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#07090E] via-[#07090E]/80 to-transparent z-10"></div>
        <img src={IMAGES.heroBanner} alt="Free Fire Esports" className="w-full h-56 md:h-72 object-cover object-center opacity-30 scale-105" />
        
        <div className="absolute inset-0 z-20 flex items-center max-w-7xl mx-auto px-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold uppercase mb-3 backdrop-blur-md">
              <Flame className="w-4 h-4 text-amber-400 animate-bounce" /> Free Fire Championship Arena
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold font-teko text-white tracking-wide leading-tight uppercase drop-shadow-md">
              DOMINATE THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200">BATTLEGROUND</span>
            </h1>
            <p className="text-gray-300 text-xs md:text-sm mt-1 max-w-lg hidden sm:block">
              Register squad slots, submit Bkash/Nagad TrxID, receive instant Room ID & Password credentials before match start time, and cash out daily cash prizes!
            </p>
            <div className="flex items-center gap-3 mt-4">
              <button onClick={() => setActiveTab('tournaments')} className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition shadow-lg shadow-amber-500/20">
                <Gamepad2 className="w-4 h-4" /> Browse Matches
              </button>
              <button onClick={() => setActiveTab('rules')} className="px-5 py-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-200 border border-gray-700 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition">
                <BookOpen className="w-4 h-4 text-amber-400" /> Point Rules
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 📌 MAIN BODY CONTENT */}
      <main className="max-w-7xl mx-auto px-4 mt-8">

        {/* 🎮 TAB 1: MATCH LISTINGS */}
        {activeTab === 'tournaments' && (
          <div className="space-y-6">
            
            {/* Filter and Search Bar */}
            <div className="bg-[#0E121B] border border-gray-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search matches..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#07090E] border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Filter className="w-3.5 h-3.5 text-amber-400" /> Mode:
                </div>
                {['ALL', 'SOLO', 'DUO', 'SQUAD', 'CS 4v4'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setFilterMode(mode)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      filterMode === mode ? 'bg-amber-500 text-black' : 'bg-[#07090E] text-gray-400 border border-gray-800 hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}

                <select
                  value={filterMap}
                  onChange={e => setFilterMap(e.target.value)}
                  className="bg-[#07090E] border border-gray-800 text-xs text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">All Maps</option>
                  <option value="Bermuda">Bermuda</option>
                  <option value="Purgatory">Purgatory</option>
                  <option value="Kalahari">Kalahari</option>
                  <option value="Alpine">Alpine</option>
                  <option value="Nexterra">Nexterra</option>
                </select>

                <button onClick={fetchData} className="p-2 bg-[#07090E] border border-gray-800 rounded-lg text-amber-400 hover:bg-gray-800 transition">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-20 text-amber-400 font-bold animate-pulse flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" /> Loading Arena Matches...
              </div>
            ) : filteredTournaments.length === 0 ? (
              <div className="text-center py-20 text-gray-500 bg-[#0E121B] rounded-2xl border border-gray-800">
                No active matches found matching criteria.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTournaments.map((t) => {
                  const registeredForThis = registrations.filter(r => r.tournament_id === t.id && r.status === 'APPROVED');
                  const joinedCount = registeredForThis.length;
                  const isFull = joinedCount >= t.total_slots;

                  return (
                    <div key={t.id} className="bg-[#0E121B] border border-gray-800 rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-between shadow-xl group">
                      
                      <div className="relative h-44 overflow-hidden">
                        <img src={t.map_img || IMAGES.bermuda} alt={t.map} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0E121B] via-[#0E121B]/50 to-transparent"></div>
                        
                        <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
                          <span className="bg-amber-500 text-black font-teko font-bold text-lg px-3 py-0.5 rounded uppercase tracking-wider">
                            {t.mode}
                          </span>
                          
                          {t.status === 'LIVE' ? (
                            <span className="bg-red-600 text-white border border-red-500 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 animate-pulse">
                              <Tv className="w-3.5 h-3.5" /> LIVE NOW
                            </span>
                          ) : (
                            <span className="bg-black/70 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" /> VERIFIED TOURNAMENT
                            </span>
                          )}
                        </div>

                        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                          <h3 className="font-teko text-2xl font-bold text-white tracking-wide uppercase drop-shadow-md">{t.title}</h3>
                          {t.stream_url && (
                            <button
                              onClick={() => setStreamModalMatch(t)}
                              className="px-2.5 py-1 bg-red-600/90 hover:bg-red-600 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 backdrop-blur-md transition"
                            >
                              <Play className="w-3 h-3 fill-current" /> WATCH STREAM
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="p-4 grid grid-cols-2 gap-3 text-sm border-b border-gray-800/80">
                        <div className="bg-[#07090E]/60 p-2.5 rounded-xl border border-gray-800/50 flex items-center gap-3">
                          <Trophy className="text-amber-400 w-6 h-6 shrink-0" />
                          <div>
                            <p className="text-gray-400 text-[10px] uppercase font-bold">Prize Pool</p>
                            <p className="font-bold text-amber-400 font-teko text-xl leading-none">৳ {t.prize_pool}</p>
                          </div>
                        </div>

                        <div className="bg-[#07090E]/60 p-2.5 rounded-xl border border-gray-800/50 flex items-center gap-3">
                          <Crosshair className="text-red-400 w-6 h-6 shrink-0" />
                          <div>
                            <p className="text-gray-400 text-[10px] uppercase font-bold">Per Kill</p>
                            <p className="font-bold text-white font-teko text-xl leading-none">৳ {t.per_kill}</p>
                          </div>
                        </div>

                        <div className="bg-[#07090E]/60 p-2.5 rounded-xl border border-gray-800/50 flex items-center gap-3">
                          <ShieldCheck className="text-emerald-400 w-6 h-6 shrink-0" />
                          <div>
                            <p className="text-gray-400 text-[10px] uppercase font-bold">Entry Fee</p>
                            <p className="font-bold text-emerald-400 font-teko text-xl leading-none">{Number(t.entry_fee) === 0 ? 'FREE' : '৳ ' + t.entry_fee}</p>
                          </div>
                        </div>

                        <div className="bg-[#07090E]/60 p-2.5 rounded-xl border border-gray-800/50 flex items-center gap-3">
                          <Users className="text-blue-400 w-6 h-6 shrink-0" />
                          <div>
                            <p className="text-gray-400 text-[10px] uppercase font-bold">Map</p>
                            <p className="font-bold text-gray-200 font-teko text-xl leading-none">{t.map}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-[#0A0D14]">
                        <div className="flex justify-between text-xs mb-1.5 font-semibold">
                          <span className="text-gray-400">Slots Joined</span>
                          <span className="text-amber-400">{joinedCount} / {t.total_slots} Filled</span>
                        </div>
                        <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden mb-4">
                          <div 
                            className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full transition-all duration-500" 
                            style={{ width: Math.min(100, (joinedCount / t.total_slots) * 100) + '%' }}
                          ></div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400 flex items-center gap-1.5 font-medium">
                            <Clock className="w-4 h-4 text-amber-500" /> {t.display_time}
                          </span>
                          <button
                            onClick={() => { setSelectedMatch(t); setModalOpen(true); }}
                            disabled={isFull}
                            className={`px-6 py-2.5 rounded-xl font-bold uppercase text-xs transition tracking-wider ${
                              isFull 
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black hover:from-amber-400 hover:to-yellow-300 shadow-lg shadow-amber-500/20'
                            }`}
                          >
                            {isFull ? 'SLOTS FULL' : 'JOIN MATCH'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 🔑 TAB 2: MY SLOTS & ROOM CREDENTIALS */}
        {activeTab === 'myMatches' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold font-teko tracking-wider flex items-center gap-2 text-white border-b border-gray-800 pb-3">
              <Key className="text-amber-500" /> MY REGISTERED SLOTS & ROOM CREDENTIALS
            </h2>

            {registrations.length === 0 ? (
              <div className="bg-[#0E121B] p-8 rounded-2xl border border-gray-800 text-center space-y-3">
                <p className="text-gray-400 text-sm">No registered match slots found yet. Select an upcoming match to register!</p>
                <button onClick={() => setActiveTab('tournaments')} className="px-5 py-2 bg-amber-500 text-black font-bold text-xs rounded-xl uppercase">
                  Browse Active Matches
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {registrations.map((reg) => {
                  const match = tournaments.find(t => t.id === reg.tournament_id) || {};
                  return (
                    <div key={reg.id || Math.random()} className="bg-[#0E121B] border border-gray-800 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-amber-400 font-teko text-2xl">{match.title || 'Tournament'}</span>
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                            reg.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 
                            reg.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 
                            'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}>
                            {reg.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 mt-1">
                          Squad: <span className="text-white font-bold">{reg.squad_name}</span> | Leader: <span className="text-amber-300">{reg.leader_ign}</span> ({reg.leader_uid})
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Method: {reg.payment_method} | TrxID: <span className="font-mono text-gray-200">{reg.trx_id || 'N/A'}</span> | WhatsApp: {reg.whatsapp}</p>
                      </div>

                      <div className="bg-[#07090E] border border-amber-500/30 rounded-xl p-4 w-full md:w-auto min-w-[300px]">
                        {reg.status === 'APPROVED' ? (
                          match.room_id ? (
                            <div>
                              <p className="text-xs text-amber-400 font-bold mb-2 flex items-center justify-between">
                                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-400" /> ROOM CREDENTIALS READY</span>
                              </p>
                              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#0E121B] p-2.5 rounded border border-gray-800">
                                <div>
                                  <span className="text-gray-500 block text-[10px]">ROOM ID</span>
                                  <span className="text-amber-400 font-bold text-base">{match.room_id}</span>
                                  <button onClick={() => copyToClipboard(match.room_id)} className="text-[10px] text-gray-400 flex items-center gap-1 hover:text-white mt-1">
                                    <Copy className="w-3 h-3" /> Copy
                                  </button>
                                </div>
                                <div>
                                  <span className="text-gray-500 block text-[10px]">PASSWORD</span>
                                  <span className="text-amber-400 font-bold text-base">{match.room_pass}</span>
                                  <button onClick={() => copyToClipboard(match.room_pass)} className="text-[10px] text-gray-400 flex items-center gap-1 hover:text-white mt-1">
                                    <Copy className="w-3 h-3" /> Copy
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 flex items-center gap-2 py-1">
                              <Clock className="w-4 h-4 text-amber-500 animate-spin" /> Credentials unlock 15 minutes before match time.
                            </p>
                          )
                        ) : reg.status === 'REJECTED' ? (
                          <p className="text-xs text-red-400 flex items-center gap-2 py-1">
                            <AlertTriangle className="w-4 h-4" /> Registration rejected. Contact support via WhatsApp.
                          </p>
                        ) : (
                          <p className="text-xs text-amber-400/90 flex items-center gap-2 py-1">
                            <AlertCircle className="w-4 h-4" /> TrxID payment pending verification by Super Admin.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 📺 TAB 3: WATCH LIVE STREAMS & HIGHLIGHTS */}
        {activeTab === 'streams' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold font-teko tracking-wider flex items-center gap-2 text-white border-b border-gray-800 pb-3">
              <Tv className="text-amber-500" /> LIVE MATCH STREAMS & HIGHLIGHTS
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tournaments.filter(t => t.stream_url).map(t => (
                <div key={t.id} className="bg-[#0E121B] border border-gray-800 rounded-2xl overflow-hidden p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold font-teko text-xl text-amber-400">{t.title}</span>
                    <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded font-bold">{t.status}</span>
                  </div>
                  <div className="aspect-video w-full rounded-xl overflow-hidden border border-gray-800 bg-black">
                    <iframe
                      src={t.stream_url}
                      title={t.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              ))}
              {tournaments.filter(t => t.stream_url).length === 0 && (
                <div className="col-span-2 bg-[#0E121B] p-12 text-center text-gray-500 rounded-2xl border border-gray-800">
                  No live streams active at this moment. Check back during tournament start times!
                </div>
              )}
            </div>
          </div>
        )}

        {/* 🏆 TAB 4: STANDINGS / LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold font-teko tracking-wider flex items-center gap-2 text-white border-b border-gray-800 pb-3">
              <Award className="text-amber-500" /> TOURNAMENT STANDINGS & OVERALL LEADERBOARD
            </h2>

            <div className="bg-[#0E121B] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#07090E] text-amber-400 font-bold uppercase border-b border-gray-800">
                    <tr>
                      <th className="p-4 text-center">Rank</th>
                      <th className="p-4">Squad Name</th>
                      <th className="p-4 text-center">Matches</th>
                      <th className="p-4 text-center">Booyah</th>
                      <th className="p-4 text-center">Kills</th>
                      <th className="p-4 text-center">Placement Pts</th>
                      <th className="p-4 text-center">Total Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60 font-medium">
                    {leaderboard.map((item, idx) => (
                      <tr key={idx} className="hover:bg-amber-500/5 transition">
                        <td className="p-4 text-center font-bold font-teko text-lg">
                          {idx === 0 ? <span className="text-yellow-400">🥇 #1</span> :
                           idx === 1 ? <span className="text-gray-300">🥈 #2</span> :
                           idx === 2 ? <span className="text-amber-600">🥉 #3</span> : '#' + (idx + 1)}
                        </td>
                        <td className="p-4 font-bold text-white text-sm">{item.squad_name}</td>
                        <td className="p-4 text-center text-gray-400">{item.matches_played}</td>
                        <td className="p-4 text-center text-emerald-400 font-bold">{item.booyah_count}</td>
                        <td className="p-4 text-center text-red-400 font-bold">{item.total_kills}</td>
                        <td className="p-4 text-center text-gray-300">{item.placement_points}</td>
                        <td className="p-4 text-center font-teko text-xl font-bold text-amber-400">{item.total_points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 📖 TAB 5: RULES & POINT CALCULATOR */}
        {activeTab === 'rules' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Rules Section */}
            <div className="bg-[#0E121B] border border-gray-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-xl font-bold font-teko text-amber-400 flex items-center gap-2 border-b border-gray-800 pb-2">
                <BookOpen className="w-5 h-5 text-amber-400" /> OFFICIAL TOURNAMENT RULES
              </h3>
              <ul className="space-y-3 text-xs text-gray-300 leading-relaxed list-disc list-inside">
                <li>Players must join using their exact registered In-Game Name (IGN) and Game UID.</li>
                <li>Emulators are strictly forbidden unless specified as 'EMULATOR ALLOWED' in match title.</li>
                <li>Hacking, scripting, or using third-party tools will lead to immediate squad disqualification & lifetime ban.</li>
                <li>Room ID and Password will unlock in "My Slots" 15 minutes before match start time.</li>
                <li>Prize winnings will be transferred directly to Bkash/Nagad within 24 hours of match completion.</li>
              </ul>
            </div>

            {/* Point Calculator */}
            <div className="bg-[#0E121B] border border-gray-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-xl font-bold font-teko text-amber-400 flex items-center gap-2 border-b border-gray-800 pb-2">
                <Award className="w-5 h-5 text-amber-400" /> FF OFFICIAL POINT CALCULATOR
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Placement Rank:</label>
                  <select
                    value={calcRank}
                    onChange={e => setCalcRank(Number(e.target.value))}
                    className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}># {i + 1} Rank ({i === 0 ? '12 pts' : i === 1 ? '9 pts' : i === 2 ? '8 pts' : Math.max(1, 8 - i) + ' pts'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Total Team Kills:</label>
                  <input
                    type="number"
                    min="0"
                    value={calcKills}
                    onChange={e => setCalcKills(e.target.value)}
                    className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="bg-[#07090E] p-4 rounded-xl border border-amber-500/30 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[10px] text-gray-500 block">PLACEMENT</span>
                    <span className="text-amber-400 font-teko text-2xl font-bold">{calcPoints.rankPts}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">KILLS</span>
                    <span className="text-red-400 font-teko text-2xl font-bold">{calcPoints.killPts}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">TOTAL SCORE</span>
                    <span className="text-emerald-400 font-teko text-2xl font-bold">{calcPoints.total}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🛡️ TAB 6: SUPER ADMIN CONTROL PANEL */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            {!isAdminLoggedIn ? (
              <div className="max-w-md mx-auto bg-[#0E121B] border border-red-500/30 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
                <Lock className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
                <h3 className="text-2xl font-bold font-teko text-white tracking-wider">SUPER ADMIN ACCESS</h3>
                <p className="text-xs text-gray-400">Enter Admin Security PIN to manage tournaments, approve payments, and broadcast Room credentials.</p>
                <form onSubmit={handleAdminLogin} className="space-y-3">
                  <input
                    type="password"
                    placeholder="Enter Security PIN (Default: 1234)"
                    value={adminPinInput}
                    onChange={e => setAdminPinInput(e.target.value)}
                    className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-3 text-center text-amber-400 font-mono tracking-widest text-lg focus:outline-none focus:border-red-500"
                  />
                  <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-red-600/30">
                    Unlock Admin Panel
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-8">
                
                {/* Admin Header */}
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <h2 className="text-2xl font-bold font-teko tracking-wider flex items-center gap-2 text-red-500">
                    <Settings className="text-red-500" /> SUPER ADMIN CONTROL PANEL
                  </h2>
                  <button onClick={() => setIsAdminLoggedIn(false)} className="text-xs text-gray-400 hover:text-white bg-gray-800 px-3 py-1.5 rounded-lg">
                    Lock Panel
                  </button>
                </div>

                {/* Ticker Announcement Manager */}
                <div className="bg-[#0E121B] border border-gray-800 rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-bold text-amber-400 uppercase">Publish Header Notice Ticker</h3>
                  <form onSubmit={handleAddNotice} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter ticker notice text..."
                      value={noticeInput}
                      onChange={e => setNoticeInput(e.target.value)}
                      className="flex-1 bg-[#07090E] border border-gray-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    <button type="submit" className="bg-amber-500 text-black font-bold px-4 py-2 rounded-xl text-xs uppercase hover:bg-amber-400 transition">
                      Broadcast
                    </button>
                  </form>
                </div>

                {/* Tournament Match Creator */}
                <div className="bg-[#0E121B] border border-gray-800 rounded-2xl p-6 space-y-4">
                  <h3 className="text-lg font-bold font-teko text-amber-400 flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-amber-400" /> CREATE NEW MATCH
                  </h3>

                  <form onSubmit={handleCreateMatch} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="text-gray-400 mb-1 block">Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. SQUAD NIGHT WAR"
                        value={newMatch.title}
                        onChange={e => setNewMatch({ ...newMatch, title: e.target.value })}
                        className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-gray-400 mb-1 block">Map</label>
                      <select
                        value={newMatch.map}
                        onChange={e => setNewMatch({ ...newMatch, map: e.target.value })}
                        className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="Bermuda">Bermuda</option>
                        <option value="Purgatory">Purgatory</option>
                        <option value="Kalahari">Kalahari</option>
                        <option value="Alpine">Alpine</option>
                        <option value="Nexterra">Nexterra</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-gray-400 mb-1 block">Mode</label>
                      <select
                        value={newMatch.mode}
                        onChange={e => setNewMatch({ ...newMatch, mode: e.target.value })}
                        className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="SOLO">SOLO</option>
                        <option value="DUO">DUO</option>
                        <option value="SQUAD">SQUAD</option>
                        <option value="CS 4v4">CS 4v4</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-gray-400 mb-1 block">Entry Fee (BDT)</label>
                      <input
                        type="number"
                        value={newMatch.entryFee}
                        onChange={e => setNewMatch({ ...newMatch, entryFee: e.target.value })}
                        className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-gray-400 mb-1 block">Prize Pool (BDT)</label>
                      <input
                        type="number"
                        value={newMatch.prizePool}
                        onChange={e => setNewMatch({ ...newMatch, prizePool: e.target.value })}
                        className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-gray-400 mb-1 block">Per Kill Reward (BDT)</label>
                      <input
                        type="number"
                        value={newMatch.perKill}
                        onChange={e => setNewMatch({ ...newMatch, perKill: e.target.value })}
                        className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-gray-400 mb-1 block">Total Slots</label>
                      <input
                        type="number"
                        value={newMatch.totalSlots}
                        onChange={e => setNewMatch({ ...newMatch, totalSlots: e.target.value })}
                        className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-gray-400 mb-1 block">Display Time String</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Tonight at 09:30 PM"
                        value={newMatch.displayTime}
                        onChange={e => setNewMatch({ ...newMatch, displayTime: e.target.value })}
                        className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-gray-400 mb-1 block">YouTube Live Stream Embed URL</label>
                      <input
                        type="text"
                        placeholder="https://www.youtube.com/embed/..."
                        value={newMatch.streamUrl}
                        onChange={e => setNewMatch({ ...newMatch, streamUrl: e.target.value })}
                        className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold py-3 rounded-xl uppercase tracking-wider hover:from-amber-400 hover:to-yellow-300 transition shadow-lg shadow-amber-500/20">
                        Publish Tournament Match
                      </button>
                    </div>
                  </form>
                </div>

                {/* Match Broadcast Controls */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold font-teko text-amber-400">MATCH ROOM CREDENTIALS BROADCASTER</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {tournaments.map(t => (
                      <div key={t.id} className="bg-[#0E121B] border border-gray-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-white text-base">{t.title}</p>
                          <p className="text-xs text-gray-400">{t.mode} | {t.map} | {t.display_time}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                          <input
                            type="text"
                            placeholder="Room ID"
                            defaultValue={t.room_id}
                            onChange={e => setRoomInputs({ ...roomInputs, [t.id]: { ...(roomInputs[t.id] || {}), roomId: e.target.value } })}
                            className="bg-[#07090E] border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-amber-400 font-mono focus:outline-none w-28"
                          />
                          <input
                            type="text"
                            placeholder="Pass"
                            defaultValue={t.room_pass}
                            onChange={e => setRoomInputs({ ...roomInputs, [t.id]: { ...(roomInputs[t.id] || {}), roomPass: e.target.value } })}
                            className="bg-[#07090E] border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-amber-400 font-mono focus:outline-none w-24"
                          />
                          <button
                            onClick={() => updateRoomCredentials(t.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs uppercase"
                          >
                            Broadcast
                          </button>
                          <button
                            onClick={() => handleDeleteMatch(t.id)}
                            className="p-1.5 bg-red-950 border border-red-500/30 text-red-400 hover:bg-red-900 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Leaderboard Management Form */}
                <div className="bg-[#0E121B] border border-gray-800 rounded-2xl p-6 space-y-4">
                  <h3 className="text-lg font-bold font-teko text-amber-400 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-amber-400" /> UPDATE LEADERBOARD STANDINGS
                  </h3>
                  <form onSubmit={handleAddLeaderboard} className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                    <input
                      type="text"
                      required
                      placeholder="Squad Name"
                      value={leaderForm.squadName}
                      onChange={e => setLeaderForm({ ...leaderForm, squadName: e.target.value })}
                      className="bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white"
                    />
                    <input
                      type="number"
                      placeholder="Matches Played"
                      value={leaderForm.matchesPlayed}
                      onChange={e => setLeaderForm({ ...leaderForm, matchesPlayed: e.target.value })}
                      className="bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white"
                    />
                    <input
                      type="number"
                      placeholder="Booyah Count"
                      value={leaderForm.booyahCount}
                      onChange={e => setLeaderForm({ ...leaderForm, booyahCount: e.target.value })}
                      className="bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white"
                    />
                    <input
                      type="number"
                      placeholder="Total Kills"
                      value={leaderForm.totalKills}
                      onChange={e => setLeaderForm({ ...leaderForm, totalKills: e.target.value })}
                      className="bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white"
                    />
                    <input
                      type="number"
                      placeholder="Placement Pts"
                      value={leaderForm.placementPoints}
                      onChange={e => setLeaderForm({ ...leaderForm, placementPoints: e.target.value })}
                      className="bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white"
                    />
                    <button type="submit" className="md:col-span-5 bg-amber-500 text-black font-bold py-2.5 rounded-xl uppercase">
                      Save / Update Standings
                    </button>
                  </form>
                </div>

                {/* Pending Payments Approvals */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold font-teko text-amber-400">REGISTRATION & PAYMENT APPROVALS</h3>
                  <div className="bg-[#0E121B] border border-gray-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#07090E] text-amber-400 font-bold uppercase border-b border-gray-800">
                          <tr>
                            <th className="p-3">Squad</th>
                            <th className="p-3">Leader</th>
                            <th className="p-3">WhatsApp</th>
                            <th className="p-3">Method</th>
                            <th className="p-3">Trx ID</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {registrations.map((r, i) => (
                            <tr key={r.id || i} className="hover:bg-white/5">
                              <td className="p-3 font-bold text-white">{r.squad_name}</td>
                              <td className="p-3 text-gray-300">{r.leader_ign} ({r.leader_uid})</td>
                              <td className="p-3 text-gray-400">{r.whatsapp}</td>
                              <td className="p-3 text-amber-400 font-bold">{r.payment_method}</td>
                              <td className="p-3 font-mono text-gray-300">{r.trx_id || 'N/A'}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  r.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : 
                                  r.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                                  'bg-amber-500/10 text-amber-400'
                                }`}>
                                  {r.status}
                                </span>
                              </td>
                              <td className="p-3 text-center space-x-2">
                                <button
                                  onClick={() => updateRegStatus(r.id, 'APPROVED')}
                                  className="px-2 py-1 bg-emerald-600 text-white font-bold rounded text-[10px] uppercase"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => updateRegStatus(r.id, 'REJECTED')}
                                  className="px-2 py-1 bg-red-600 text-white font-bold rounded text-[10px] uppercase"
                                >
                                  Reject
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

      </main>

      {/* 📝 REGISTRATION MODAL */}
      {modalOpen && selectedMatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E121B] border border-amber-500/30 rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-xl font-bold font-teko text-amber-400 uppercase">{selectedMatch.title}</h3>
                <p className="text-xs text-gray-400">Entry Fee: {Number(selectedMatch.entry_fee) === 0 ? 'FREE' : '৳ ' + selectedMatch.entry_fee}</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="text-gray-400 mb-1 block">Squad Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP ELITE"
                  value={regForm.squadName}
                  onChange={e => setRegForm({ ...regForm, squadName: e.target.value })}
                  className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 mb-1 block">Leader IGN *</label>
                  <input
                    type="text"
                    required
                    placeholder="In-Game Name"
                    value={regForm.leaderIgn}
                    onChange={e => setRegForm({ ...regForm, leaderIgn: e.target.value })}
                    className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 mb-1 block">Leader UID *</label>
                  <input
                    type="text"
                    required
                    placeholder="Game UID"
                    value={regForm.leaderUid}
                    onChange={e => setRegForm({ ...regForm, leaderUid: e.target.value })}
                    className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {(selectedMatch.mode === 'SQUAD' || selectedMatch.mode === 'DUO' || selectedMatch.mode === 'CS 4v4') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-400 mb-1 block">Player 2 UID</label>
                    <input
                      type="text"
                      placeholder="UID 2"
                      value={regForm.player2Uid}
                      onChange={e => setRegForm({ ...regForm, player2Uid: e.target.value })}
                      className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  {(selectedMatch.mode === 'SQUAD' || selectedMatch.mode === 'CS 4v4') && (
                    <div>
                      <label className="text-gray-400 mb-1 block">Player 3 UID</label>
                      <input
                        type="text"
                        placeholder="UID 3"
                        value={regForm.player3Uid}
                        onChange={e => setRegForm({ ...regForm, player3Uid: e.target.value })}
                        className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-gray-400 mb-1 block">WhatsApp Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="017XXXXXXXX"
                  value={regForm.whatsapp}
                  onChange={e => setRegForm({ ...regForm, whatsapp: e.target.value })}
                  className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {Number(selectedMatch.entry_fee) > 0 && (
                <div className="bg-[#07090E] p-3 rounded-xl border border-amber-500/20 space-y-2">
                  <p className="text-[11px] text-amber-400 font-bold">Payment Instructions (Send Money):</p>
                  <p className="text-[10px] text-gray-300">Bkash/Nagad/Rocket Personal: <span className="font-mono text-amber-300 font-bold">01700000000</span></p>
                  
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-gray-400 mb-1 block">Method</label>
                      <select
                        value={regForm.paymentMethod}
                        onChange={e => setRegForm({ ...regForm, paymentMethod: e.target.value })}
                        className="w-full bg-[#0E121B] border border-gray-800 rounded-lg p-2 text-white focus:outline-none"
                      >
                        <option value="Bkash">Bkash</option>
                        <option value="Nagad">Nagad</option>
                        <option value="Rocket">Rocket</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-400 mb-1 block">TrxID *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 9J283H12"
                        value={regForm.trxId}
                        onChange={e => setRegForm({ ...regForm, trxId: e.target.value })}
                        className="w-full bg-[#0E121B] border border-gray-800 rounded-lg p-2 text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold py-3 rounded-xl uppercase tracking-wider hover:from-amber-400 hover:to-yellow-300 transition shadow-lg shadow-amber-500/20">
                Confirm Registration
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 📺 STREAM MODAL */}
      {streamModalMatch && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0E121B] border border-amber-500/30 rounded-2xl max-w-3xl w-full p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <span className="font-bold font-teko text-xl text-amber-400">{streamModalMatch.title} - LIVE STREAM</span>
              <button onClick={() => setStreamModalMatch(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
              <iframe
                src={streamModalMatch.stream_url}
                title={streamModalMatch.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* 📱 MOBILE NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0E121B]/95 border-t border-amber-500/20 backdrop-blur-md z-40 px-2 py-2 flex justify-around items-center">
        {[
          { id: 'tournaments', label: 'Matches', icon: Gamepad2 },
          { id: 'myMatches', label: 'My Slots', icon: Key },
          { id: 'streams', label: 'Live', icon: Tv },
          { id: 'leaderboard', label: 'Standings', icon: Award },
          { id: 'rules', label: 'Rules', icon: BookOpen },
          { id: 'admin', label: 'Admin', icon: Settings },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 text-[9px] font-bold ${
              activeTab === tab.id ? 'text-amber-400' : 'text-gray-500'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

    </div>
  );
}

```
