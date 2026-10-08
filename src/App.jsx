```react
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, ShieldCheck, Crosshair, Users, Key, Gamepad2, PlusCircle, 
  CheckCircle, Clock, AlertCircle, Settings, Award, BookOpen, Flame, Check, Lock, RefreshCw,
  Copy, Search, Filter, Send, Smartphone, MessageSquare, ExternalLink, FileText, Trash2, Edit3,
  Eye, X, ChevronRight, Zap, Radio, CheckCircle2, XCircle, Info, Layers, HelpCircle, LogOut
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_SQL_SCHEMA = `-- ========================================================
-- OFFICIAL BOOYAH ARENA ESPORTS - SUPABASE DATABASE SCHEMA
-- ========================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create TOURNAMENTS Table
CREATE TABLE IF NOT EXISTS public.tournaments (
  id VARCHAR PRIMARY KEY DEFAULT 'ff-' || extract(epoch from now())::bigint,
  title VARCHAR NOT NULL,
  map VARCHAR NOT NULL DEFAULT 'Bermuda',
  map_img TEXT,
  mode VARCHAR NOT NULL DEFAULT 'SQUAD',
  entry_fee NUMERIC DEFAULT 0,
  prize_pool NUMERIC DEFAULT 0,
  per_kill NUMERIC DEFAULT 0,
  total_slots INT DEFAULT 48,
  display_time VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'UPCOMING', -- UPCOMING, LIVE, COMPLETED, CANCELLED
  room_id VARCHAR DEFAULT '',
  room_pass VARCHAR DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create REGISTRATIONS Table
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id VARCHAR REFERENCES public.tournaments(id) ON DELETE CASCADE,
  squad_name VARCHAR NOT NULL,
  leader_ign VARCHAR NOT NULL,
  leader_uid VARCHAR NOT NULL,
  player2_uid VARCHAR,
  player3_uid VARCHAR,
  player4_uid VARCHAR,
  sub_uid VARCHAR,
  whatsapp VARCHAR NOT NULL,
  payment_method VARCHAR DEFAULT 'Bkash',
  trx_id VARCHAR,
  payment_screenshot TEXT,
  status VARCHAR DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create LEADERBOARD Table
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  squad_name VARCHAR UNIQUE NOT NULL,
  matches_played INT DEFAULT 0,
  booyah_count INT DEFAULT 0,
  total_kills INT DEFAULT 0,
  placement_points INT DEFAULT 0,
  total_points INT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create NOTICES Table
CREATE TABLE IF NOT EXISTS public.notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert Default Ticker Notice
INSERT INTO public.notices (text, is_active) 
VALUES ('🔥 Welcome to Booyah Arena! Daily Free Fire Tournaments with instant Bkash/Nagad Payouts! Register your Squad now!', true)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Permissive Policies for Public Esports Access
CREATE POLICY "Public Read Tournaments" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Public Insert Registrations" ON public.registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Registrations" ON public.registrations FOR SELECT USING (true);
CREATE POLICY "Public Read Leaderboard" ON public.leaderboard FOR SELECT USING (true);
CREATE POLICY "Public Read Notices" ON public.notices FOR SELECT USING (true);

-- Admin Full Access Policies
CREATE POLICY "Admin Full Access Tournaments" ON public.tournaments FOR ALL USING (true);
CREATE POLICY "Admin Full Access Registrations" ON public.registrations FOR ALL USING (true);
CREATE POLICY "Admin Full Access Leaderboard" ON public.leaderboard FOR ALL USING (true);
CREATE POLICY "Admin Full Access Notices" ON public.notices FOR ALL USING (true);
`;

const IMAGES = {
  heroBanner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop',
  bermuda: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop',
  purgatory: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=600&auto=format&fit=crop',
  kalahari: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop',
  alpine: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=600&auto=format&fit=crop',
  nexterra: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop'
};

const OFFICIAL_POINT_SYSTEM = [
  { rank: '1st (Booyah)', points: 12 },
  { rank: '2nd Place', points: 9 },
  { rank: '3rd Place', points: 8 },
  { rank: '4th Place', points: 7 },
  { rank: '5th Place', points: 6 },
  { rank: '6th Place', points: 5 },
  { rank: '7th Place', points: 4 },
  { rank: '8th Place', points: 3 },
  { rank: '9th Place', points: 2 },
  { rank: '10th Place', points: 1 },
  { rank: '11th - 12th', points: 0 },
  { rank: 'Per Kill', points: '1 Point' }
];

const INITIAL_MOCK_TOURNAMENTS = [
  {
    id: 'ff-101',
    title: 'SEASON 14 BATTLEGROUND CHAMPIONSHIP',
    map: 'Bermuda',
    map_img: IMAGES.bermuda,
    mode: 'SQUAD',
    entry_fee: 100,
    prize_pool: 2500,
    per_kill: 20,
    total_slots: 12,
    display_time: 'Today @ 09:00 PM',
    status: 'UPCOMING',
    room_id: '8849201',
    room_pass: '7732',
    registered_teams: [
      { id: 'reg-1', squad_name: 'VIP ELITE', leader_ign: 'VIP_BOSS', leader_uid: '284910482', whatsapp: '01700000000', status: 'APPROVED', trx_id: 'TRX9920148' },
      { id: 'reg-2', squad_name: 'NEXUS GAMING', leader_ign: 'NEX_CAPTAIN', leader_uid: '992014820', whatsapp: '01800000000', status: 'APPROVED', trx_id: 'TRX8839201' }
    ]
  },
  {
    id: 'ff-102',
    title: 'PURGATORY RUMBLE - NIGHT CUP',
    map: 'Purgatory',
    map_img: IMAGES.purgatory,
    mode: 'SOLO',
    entry_fee: 0,
    prize_pool: 500,
    per_kill: 10,
    total_slots: 48,
    display_time: 'Tomorrow @ 07:00 PM',
    status: 'UPCOMING',
    room_id: '',
    room_pass: '',
    registered_teams: []
  },
  {
    id: 'ff-103',
    title: 'KALAHARI SURVIVAL DUO CLASH',
    map: 'Kalahari',
    map_img: IMAGES.kalahari,
    mode: 'DUO',
    entry_fee: 50,
    prize_pool: 1200,
    per_kill: 15,
    total_slots: 24,
    display_time: 'Tomorrow @ 10:00 PM',
    status: 'UPCOMING',
    room_id: '',
    room_pass: '',
    registered_teams: []
  }
];

const INITIAL_LEADERBOARD = [
  { id: '1', squad_name: 'VIP ELITE', matches_played: 6, booyah_count: 3, total_kills: 48, placement_points: 54, total_points: 102 },
  { id: '2', squad_name: 'NEXUS GAMING', matches_played: 6, booyah_count: 2, total_kills: 39, placement_points: 42, total_points: 81 },
  { id: '3', squad_name: 'BD ESPORTS', matches_played: 6, booyah_count: 1, total_kills: 31, placement_points: 36, total_points: 67 },
  { id: '4', squad_name: 'NOOB SQUAD', matches_played: 6, booyah_count: 0, total_kills: 22, placement_points: 24, total_points: 46 }
];

const DEFAULT_SUPABASE_URL = 'https://xyzcompany.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

let supabaseClient = null;
try {
  supabaseClient = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY);
} catch (e) {
  console.warn('Supabase initialization fallback activated.');
}

export default function App() {
  // Navigation & UI State
  const [activeTab, setActiveTab] = useState('tournaments'); // tournaments, myMatches, leaderboard, rules, admin
  const [adminSubTab, setAdminSubTab] = useState('matches'); // matches, verification, broadcast, results, notices, sql
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  // Supabase Configuration State
  const [customSupabaseUrl, setCustomSupabaseUrl] = useState('');
  const [customSupabaseKey, setCustomSupabaseKey] = useState('');
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // Core Data State
  const [tournaments, setTournaments] = useState(INITIAL_MOCK_TOURNAMENTS);
  const [leaderboard, setLeaderboard] = useState(INITIAL_LEADERBOARD);
  const [tickerNotice, setTickerNotice] = useState('🔥 Welcome to Booyah Arena! Daily Free Fire Tournaments with instant Bkash/Nagad Payouts! Register your Squad now!');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState('ALL');
  const [selectedMap, setSelectedMap] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal & Registration States
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [regModalOpen, setRegModalOpen] = useState(false);
  const [regStep, setRegStep] = useState(1);
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
    trxId: '',
    paymentScreenshot: ''
  });

  // Admin Security & Forms
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const ADMIN_PIN = '1234';

  const [newMatch, setNewMatch] = useState({
    title: '',
    map: 'Bermuda',
    mode: 'SQUAD',
    entryFee: 50,
    prizePool: 1000,
    perKill: 15,
    totalSlots: 12,
    displayTime: ''
  });

  const [editMatch, setEditMatch] = useState(null);

  // Standings Calculator State
  const [calcPlacement, setCalcPlacement] = useState(1);
  const [calcKills, setCalcKills] = useState(5);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fetchAllData = async () => {
    if (!isSupabaseConnected || !supabaseClient) return;
    setLoading(true);

    try {
      // Fetch Tournaments
      const { data: tourData, error: tourErr } = await supabaseClient
        .from('tournaments')
        .select('*, registrations(*)');

      if (!tourErr && tourData) {
        const formatted = tourData.map(t => ({
          ...t,
          registered_teams: t.registrations || []
        }));
        setTournaments(formatted);
      }

      // Fetch Leaderboard
      const { data: leadData, error: leadErr } = await supabaseClient
        .from('leaderboard')
        .select('*')
        .order('total_points', { ascending: false });

      if (!leadErr && leadData) {
        setLeaderboard(leadData);
      }

      // Fetch Ticker Notice
      const { data: noticeData, error: noticeErr } = await supabaseClient
        .from('notices')
        .select('text')
        .eq('is_active', true)
        .limit(1);

      if (!noticeErr && noticeData && noticeData.length > 0) {
        setTickerNotice(noticeData[0].text);
      }
    } catch (err) {
      console.error('Supabase sync error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [isSupabaseConnected]);

  const handleConnectSupabase = (e) => {
    e.preventDefault();
    if (!customSupabaseUrl || !customSupabaseKey) {
      showToast('Please fill both Supabase URL and Anon Key', 'error');
      return;
    }
    try {
      supabaseClient = createClient(customSupabaseUrl, customSupabaseKey);
      setIsSupabaseConnected(true);
      showToast('Connected to Supabase Cloud Backend!', 'success');
      fetchAllData();
    } catch (err) {
      showToast('Failed to connect to Supabase: ' + err.message, 'error');
    }
  };

  const filteredTournaments = useMemo(() => {
    return tournaments.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.map.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMode = selectedMode === 'ALL' || t.mode === selectedMode;
      const matchesMap = selectedMap === 'ALL' || t.map === selectedMap;
      const matchesStatus = selectedStatus === 'ALL' || t.status === selectedStatus;
      return matchesSearch && matchesMode && matchesMap && matchesStatus;
    });
  }, [tournaments, searchQuery, selectedMode, selectedMap, selectedStatus]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMatch) return;

    if (!regForm.squadName || !regForm.leaderIgn || !regForm.leaderUid || !regForm.whatsapp) {
      showToast('Please complete all required fields!', 'error');
      return;
    }

    if (selectedMatch.entry_fee > 0 && !regForm.trxId) {
      showToast('Please enter your Bkash/Nagad Transaction ID (TrxID)', 'error');
      return;
    }

    const newRegistration = {
      id: 'reg-' + Date.now(),
      tournament_id: selectedMatch.id,
      squad_name: regForm.squadName,
      leader_ign: regForm.leaderIgn,
      leader_uid: regForm.leaderUid,
      player2_uid: regForm.player2Uid,
      player3_uid: regForm.player3Uid,
      player4_uid: regForm.player4Uid,
      sub_uid: regForm.subUid,
      whatsapp: regForm.whatsapp,
      payment_method: regForm.paymentMethod,
      trx_id: regForm.trxId || 'N/A (FREE MATCH)',
      payment_screenshot: regForm.paymentScreenshot,
      status: selectedMatch.entry_fee === 0 ? 'APPROVED' : 'PENDING'
    };

    if (isSupabaseConnected && supabaseClient) {
      const { error } = await supabaseClient.from('registrations').insert([{
        tournament_id: selectedMatch.id,
        squad_name: regForm.squadName,
        leader_ign: regForm.leaderIgn,
        leader_uid: regForm.leaderUid,
        player2_uid: regForm.player2Uid,
        player3_uid: regForm.player3Uid,
        player4_uid: regForm.player4Uid,
        sub_uid: regForm.subUid,
        whatsapp: regForm.whatsapp,
        payment_method: regForm.paymentMethod,
        trx_id: regForm.trxId || 'N/A (FREE MATCH)',
        payment_screenshot: regForm.paymentScreenshot,
        status: selectedMatch.entry_fee === 0 ? 'APPROVED' : 'PENDING'
      }]);

      if (error) {
        showToast('Database Error: ' + error.message, 'error');
        return;
      }
    }

    // Local State Fallback Update
    setTournaments(prev => prev.map(t => {
      if (t.id === selectedMatch.id) {
        return {
          ...t,
          registered_teams: [...(t.registered_teams || []), newRegistration]
        };
      }
      return t;
    }));

    showToast(selectedMatch.entry_fee === 0 ? 'Slot Booked Successfully!' : 'Registration submitted! Awaiting Admin verification.', 'success');
    setRegModalOpen(false);
    setRegStep(1);
    setRegForm({
      squadName: '', leaderIgn: '', leaderUid: '', player2Uid: '', player3Uid: '',
      player4Uid: '', subUid: '', whatsapp: '', paymentMethod: 'Bkash', trxId: '', paymentScreenshot: ''
    });
  };

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    const mapImg = newMatch.map === 'Purgatory' ? IMAGES.purgatory :
                   newMatch.map === 'Kalahari' ? IMAGES.kalahari :
                   newMatch.map === 'Alpine' ? IMAGES.alpine :
                   newMatch.map === 'Nexterra' ? IMAGES.nexterra : IMAGES.bermuda;

    const matchPayload = {
      id: 'ff-' + Date.now(),
      title: newMatch.title.toUpperCase(),
      map: newMatch.map,
      map_img: mapImg,
      mode: newMatch.mode,
      entry_fee: Number(newMatch.entryFee),
      prize_pool: Number(newMatch.prizePool),
      per_kill: Number(newMatch.perKill),
      total_slots: Number(newMatch.totalSlots),
      display_time: newMatch.displayTime,
      status: 'UPCOMING',
      room_id: '',
      room_pass: '',
      registered_teams: []
    };

    if (isSupabaseConnected && supabaseClient) {
      const { error } = await supabaseClient.from('tournaments').insert([{
        title: matchPayload.title,
        map: matchPayload.map,
        map_img: matchPayload.map_img,
        mode: matchPayload.mode,
        entry_fee: matchPayload.entry_fee,
        prize_pool: matchPayload.prize_pool,
        per_kill: matchPayload.per_kill,
        total_slots: matchPayload.total_slots,
        display_time: matchPayload.display_time,
        status: 'UPCOMING'
      }]);

      if (error) {
        showToast('Supabase Match Creation Error: ' + error.message, 'error');
        return;
      }
    }

    setTournaments([matchPayload, ...tournaments]);
    showToast('Match Published Successfully!', 'success');
    setNewMatch({ title: '', map: 'Bermuda', mode: 'SQUAD', entryFee: 50, prizePool: 1000, perKill: 15, totalSlots: 12, displayTime: '' });
  };

  const handleUpdateRoomCredentials = async (tId, roomId, roomPass) => {
    if (isSupabaseConnected && supabaseClient) {
      const { error } = await supabaseClient.from('tournaments')
        .update({ room_id: roomId, room_pass: roomPass })
        .eq('id', tId);

      if (error) {
        showToast('Failed to update Room credentials in Supabase', 'error');
        return;
      }
    }

    setTournaments(prev => prev.map(t => {
      if (t.id === tId) {
        return { ...t, room_id: roomId, room_pass: roomPass };
      }
      return t;
    }));

    showToast('Room Credentials Broadcasted Successfully!', 'success');
  };

  const handleUpdateRegStatus = async (tournamentId, regId, status) => {
    if (isSupabaseConnected && supabaseClient) {
      const { error } = await supabaseClient.from('registrations')
        .update({ status })
        .eq('id', regId);

      if (error) {
        showToast('Failed to update status in Supabase', 'error');
        return;
      }
    }

    setTournaments(prev => prev.map(t => {
      if (t.id === tournamentId) {
        const updatedTeams = (t.registered_teams || []).map(team => {
          if (team.id === regId) return { ...team, status };
          return team;
        });
        return { ...t, registered_teams: updatedTeams };
      }
      return t;
    }));

    showToast(`Registration Status set to ${status}!`, 'info');
  };

  const handleAddLeaderboardResult = (e) => {
    e.preventDefault();
    const form = e.target;
    const squad = form.squad.value;
    const kills = Number(form.kills.value);
    const placementPts = Number(form.placementPts.value);
    const isBooyah = form.booyah.checked;

    const totalPts = kills + placementPts;

    const existingIndex = leaderboard.findIndex(l => l.squad_name.toLowerCase() === squad.toLowerCase());
    if (existingIndex >= 0) {
      const updated = [...leaderboard];
      updated[existingIndex] = {
        ...updated[existingIndex],
        matches_played: updated[existingIndex].matches_played + 1,
        booyah_count: updated[existingIndex].booyah_count + (isBooyah ? 1 : 0),
        total_kills: updated[existingIndex].total_kills + kills,
        placement_points: updated[existingIndex].placement_points + placementPts,
        total_points: updated[existingIndex].total_points + totalPts
      };
      updated.sort((a, b) => b.total_points - a.total_points);
      setLeaderboard(updated);
    } else {
      const newEntry = {
        id: 'lead-' + Date.now(),
        squad_name: squad,
        matches_played: 1,
        booyah_count: isBooyah ? 1 : 0,
        total_kills: kills,
        placement_points: placementPts,
        total_points: totalPts
      };
      const updated = [...leaderboard, newEntry].sort((a, b) => b.total_points - a.total_points);
      setLeaderboard(updated);
    }

    showToast('Match Standings Recorded!', 'success');
    form.reset();
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`, 'info');
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPinInput === ADMIN_PIN) {
      setIsAdminLoggedIn(true);
      setAdminPinInput('');
      showToast('Admin Access Granted!', 'success');
    } else {
      showToast('Invalid Security PIN Code!', 'error');
    }
  };

  const calculatedPoints = useMemo(() => {
    const pInfo = OFFICIAL_POINT_SYSTEM.find((_, index) => index + 1 === Number(calcPlacement));
    const placementPts = pInfo && typeof pInfo.points === 'number' ? pInfo.points : 0;
    return placementPts + Number(calcKills);
  }, [calcPlacement, calcKills]);

  return (
    <div className="min-h-screen bg-[#07090E] text-gray-100 font-sans pb-24 md:pb-12 selection:bg-amber-500 selection:text-black">
      
      {/* 🔔 TOAST NOTIFICATION CONTAINER */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md border border-amber-500/30 transition-all duration-300 animate-bounce bg-[#0E121B] text-amber-400">
          <Zap className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs md:text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* 🚀 TOP NAVIGATION HEADER */}
      <header className="bg-[#0E121B]/95 border-b border-amber-500/20 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('tournaments')}>
            <div className="bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-300 text-black p-2 rounded-xl font-black text-xl tracking-tighter shadow-lg shadow-amber-500/20 border border-amber-300">
              FF
            </div>
            <div>
              <span className="text-xl md:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200 block leading-none">
                BOOYAH ARENA
              </span>
              <span className="text-[9px] text-gray-400 tracking-widest uppercase font-bold block mt-0.5">
                Official Esports Platform
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5">
            {[
              { id: 'tournaments', label: 'Match Lobby', icon: Gamepad2 },
              { id: 'myMatches', label: 'My Slots & Room', icon: Key },
              { id: 'leaderboard', label: 'Standings', icon: Trophy },
              { id: 'rules', label: 'Rules & Support', icon: BookOpen },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25 font-black' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}

            <button
              onClick={() => setActiveTab('admin')}
              className={`ml-2 px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 border ${
                activeTab === 'admin' 
                  ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/30 font-black' 
                  : 'border-red-500/30 text-red-400 hover:bg-red-500/10'
              }`}
            >
              <Settings className="w-4 h-4" /> Control Panel
            </button>
          </nav>

          {/* Cloud Sync Status Indicator */}
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchAllData}
              title="Sync Realtime Data"
              className="p-2 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-amber-400 border border-gray-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <div className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase border flex items-center gap-1.5 ${
              isSupabaseConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              {isSupabaseConnected ? 'Cloud Active' : 'Demo Mode'}
            </div>
          </div>
        </div>
      </header>

      {/* 📢 LIVE TICKER ANNOUNCEMENT BAR */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 py-2 px-4 overflow-hidden relative">
        <div className="max-w-7xl mx-auto flex items-center gap-3 text-xs">
          <span className="bg-amber-500 text-black px-2 py-0.5 rounded font-black text-[10px] tracking-wider uppercase shrink-0 flex items-center gap-1">
            <Radio className="w-3 h-3 animate-pulse text-red-700" /> NOTICE
          </span>
          <p className="text-amber-200/90 font-medium truncate">
            {tickerNotice}
          </p>
        </div>
      </div>

      {/* 💥 HERO BANNER SECTION */}
      <div className="relative border-b border-amber-500/20 overflow-hidden bg-black">
        <div className="absolute inset-0 bg-gradient-to-r from-[#07090E] via-[#07090E]/85 to-transparent z-10"></div>
        <img src={IMAGES.heroBanner} alt="FF Championship" className="w-full h-52 md:h-72 object-cover object-center opacity-30 scale-105" />
        
        <div className="absolute inset-0 z-20 flex items-center max-w-7xl mx-auto px-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold uppercase mb-3 backdrop-blur-md">
              <Flame className="w-4 h-4 text-amber-400 animate-bounce" /> Official Free Fire Championship Portal
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-wide leading-tight uppercase drop-shadow-md">
              DOMINATE THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">BATTLEGROUND</span>
            </h1>
            <p className="text-gray-300 text-xs md:text-sm mt-2 max-w-xl font-medium hidden sm:block">
              Register squad slots, submit payment verification, fetch instant Room ID & Password, and compete for verified daily cash prize pools!
            </p>
          </div>
        </div>
      </div>

      {/* 📌 MAIN BODY CONTENT */}
      <main className="max-w-7xl mx-auto px-4 mt-8">

        {/* 🎮 TAB 1: MATCH LOBBY & FILTER SYSTEM */}
        {activeTab === 'tournaments' && (
          <div className="space-y-6">
            
            {/* Filter and Search Bar */}
            <div className="bg-[#0E121B] p-4 rounded-2xl border border-gray-800 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4 shadow-xl">
              
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search matches by name or map..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#07090E] border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              {/* Category Selectors */}
              <div className="flex flex-wrap items-center gap-2">
                
                {/* Mode Filter */}
                <select
                  value={selectedMode}
                  onChange={(e) => setSelectedMode(e.target.value)}
                  className="bg-[#07090E] border border-gray-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">All Modes</option>
                  <option value="SOLO">SOLO</option>
                  <option value="DUO">DUO</option>
                  <option value="SQUAD">SQUAD</option>
                </select>

                {/* Map Filter */}
                <select
                  value={selectedMap}
                  onChange={(e) => setSelectedMap(e.target.value)}
                  className="bg-[#07090E] border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300 font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">All Maps</option>
                  <option value="Bermuda">Bermuda</option>
                  <option value="Purgatory">Purgatory</option>
                  <option value="Kalahari">Kalahari</option>
                  <option value="Alpine">Alpine</option>
                  <option value="Nexterra">Nexterra</option>
                </select>

                {/* Status Filter */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-[#07090E] border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300 font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="UPCOMING">Upcoming</option>
                  <option value="LIVE">Live Now</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            {/* Matches Grid */}
            {filteredTournaments.length === 0 ? (
              <div className="bg-[#0E121B] p-12 rounded-2xl border border-gray-800 text-center space-y-3">
                <Gamepad2 className="w-12 h-12 text-gray-600 mx-auto" />
                <p className="text-gray-400 font-medium text-sm">No matches found matching your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTournaments.map((t) => {
                  const joinedCount = t.registered_teams ? t.registered_teams.length : 0;
                  const isFull = joinedCount >= t.total_slots;

                  return (
                    <div key={t.id} className="bg-[#0E121B] border border-gray-800/80 rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-between shadow-2xl group">
                      
                      {/* Card Header & Image */}
                      <div className="relative h-40 overflow-hidden">
                        <img src={t.map_img || IMAGES.bermuda} alt={t.map} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0E121B] via-[#0E121B]/40 to-transparent"></div>
                        
                        <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
                          <span className="bg-amber-500 text-black font-black text-xs px-2.5 py-1 rounded uppercase tracking-wider shadow">
                            {t.mode}
                          </span>
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase flex items-center gap-1 border backdrop-blur-md ${
                            t.status === 'LIVE' 
                              ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' 
                              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          }`}>
                            <Check className="w-3 h-3" /> {t.status}
                          </span>
                        </div>

                        <div className="absolute bottom-2 left-3 right-3">
                          <h3 className="text-lg font-black text-white tracking-wide uppercase drop-shadow-md truncate">
                            {t.title}
                          </h3>
                        </div>
                      </div>

                      {/* Prize & Details Grid */}
                      <div className="p-4 grid grid-cols-2 gap-2 text-xs border-b border-gray-800/80">
                        <div className="bg-[#07090E]/80 p-2.5 rounded-xl border border-gray-800 flex items-center gap-2.5">
                          <Trophy className="text-amber-400 w-5 h-5 shrink-0" />
                          <div>
                            <p className="text-gray-400 text-[9px] uppercase font-bold">Prize Pool</p>
                            <p className="font-black text-amber-400 text-base leading-none">৳ {t.prize_pool}</p>
                          </div>
                        </div>

                        <div className="bg-[#07090E]/80 p-2.5 rounded-xl border border-gray-800 flex items-center gap-2.5">
                          <Crosshair className="text-red-400 w-5 h-5 shrink-0" />
                          <div>
                            <p className="text-gray-400 text-[9px] uppercase font-bold">Per Kill</p>
                            <p className="font-black text-white text-base leading-none">৳ {t.per_kill}</p>
                          </div>
                        </div>

                        <div className="bg-[#07090E]/80 p-2.5 rounded-xl border border-gray-800 flex items-center gap-2.5">
                          <ShieldCheck className="text-emerald-400 w-5 h-5 shrink-0" />
                          <div>
                            <p className="text-gray-400 text-[9px] uppercase font-bold">Entry Fee</p>
                            <p className="font-black text-emerald-400 text-base leading-none">{t.entry_fee === 0 ? 'FREE' : `৳ ${t.entry_fee}`}</p>
                          </div>
                        </div>

                        <div className="bg-[#07090E]/80 p-2.5 rounded-xl border border-gray-800 flex items-center gap-2.5">
                          <Users className="text-blue-400 w-5 h-5 shrink-0" />
                          <div>
                            <p className="text-gray-400 text-[9px] uppercase font-bold">Map</p>
                            <p className="font-black text-gray-200 text-base leading-none">{t.map}</p>
                          </div>
                        </div>
                      </div>

                      {/* Slot Counter & Join Action */}
                      <div className="p-4 bg-[#0A0D14]">
                        <div className="flex justify-between text-xs mb-1.5 font-bold">
                          <span className="text-gray-400">Slots Filled</span>
                          <span className="text-amber-400">{joinedCount} / {t.total_slots} Teams</span>
                        </div>
                        
                        <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden mb-4 border border-gray-700/50">
                          <div 
                            className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, (joinedCount / t.total_slots) * 100)}%` }}
                          ></div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-gray-400 flex items-center gap-1 font-semibold truncate">
                            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" /> {t.display_time}
                          </span>
                          
                          <button
                            onClick={() => { setSelectedMatch(t); setRegModalOpen(true); }}
                            disabled={isFull || t.status === 'COMPLETED'}
                            className={`px-4 py-2 rounded-xl font-black uppercase text-xs transition tracking-wider ${
                              isFull || t.status === 'COMPLETED'
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700' 
                                : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black hover:from-amber-400 hover:to-yellow-300 shadow-lg shadow-amber-500/20'
                            }`}
                          >
                            {t.status === 'COMPLETED' ? 'FINISHED' : isFull ? 'SLOTS FULL' : 'JOIN MATCH'}
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

        {/* 🔑 TAB 2: MY SLOTS & ROOM CREDENTIALS PORTAL */}
        {activeTab === 'myMatches' && (
          <div className="space-y-6">
            <div className="border-b border-gray-800 pb-4">
              <h2 className="text-2xl font-black tracking-wider flex items-center gap-2 text-white">
                <Key className="text-amber-500" /> REGISTERED SLOTS & ROOM CREDENTIALS
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                View your registered squad slots and fetch official Room ID & Password 15 minutes before match start.
              </p>
            </div>

            <div className="space-y-4">
              {tournaments.filter(t => t.registered_teams && t.registered_teams.length > 0).length === 0 ? (
                <div className="bg-[#0E121B] p-12 rounded-2xl border border-gray-800 text-center space-y-3">
                  <ShieldCheck className="w-12 h-12 text-gray-600 mx-auto" />
                  <p className="text-gray-400 text-sm">No registered squad slots found on this device. Join a tournament from the Match Lobby!</p>
                </div>
              ) : (
                tournaments.map(t => {
                  return (t.registered_teams || []).map(tm => (
                    <div key={tm.id} className="bg-[#0E121B] border border-gray-800 rounded-2xl p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-xl">
                      
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-black text-amber-400 text-xl">{t.title}</span>
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                            tm.status === 'APPROVED' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                              : tm.status === 'REJECTED'
                              ? 'bg-red-500/10 text-red-400 border-red-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}>
                            {tm.status}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-300 space-y-1">
                          <p><span className="text-gray-500 font-semibold">Squad:</span> <span className="text-white font-bold">{tm.squad_name}</span> | <span className="text-gray-500 font-semibold">Leader IGN:</span> <span className="text-amber-300 font-bold">{tm.leader_ign}</span></p>
                          <p><span className="text-gray-500 font-semibold">Leader UID:</span> {tm.leader_uid} | <span className="text-gray-500 font-semibold">Time:</span> {t.display_time}</p>
                          <p><span className="text-gray-500 font-semibold">TrxID:</span> <span className="font-mono text-gray-300">{tm.trx_id}</span></p>
                        </div>
                      </div>

                      {/* Room ID Box */}
                      <div className="bg-[#07090E] border border-amber-500/30 rounded-xl p-4 w-full lg:w-auto min-w-[320px]">
                        {tm.status === 'APPROVED' ? (
                          t.room_id ? (
                            <div className="space-y-2">
                              <p className="text-xs text-amber-400 font-black flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> ROOM CREDENTIALS DISPATCHED
                              </p>
                              
                              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#0E121B] p-2.5 rounded-lg border border-gray-800">
                                <div className="space-y-0.5">
                                  <span className="text-gray-500 text-[9px] block uppercase font-bold">ROOM ID</span>
                                  <span className="text-amber-400 font-black text-base">{t.room_id}</span>
                                  <button onClick={() => copyToClipboard(t.room_id, 'Room ID')} className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 mt-1">
                                    <Copy className="w-3 h-3" /> Copy ID
                                  </button>
                                </div>

                                <div className="space-y-0.5">
                                  <span className="text-gray-500 text-[9px] block uppercase font-bold">PASSWORD</span>
                                  <span className="text-amber-400 font-black text-base">{t.room_pass}</span>
                                  <button onClick={() => copyToClipboard(t.room_pass, 'Room Password')} className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 mt-1">
                                    <Copy className="w-3 h-3" /> Copy Pass
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 flex items-center gap-2 py-2 font-medium">
                              <Clock className="w-4 h-4 text-amber-500 animate-spin" /> Room ID & Pass will be updated 15 minutes before match start.
                            </p>
                          )
                        ) : tm.status === 'REJECTED' ? (
                          <p className="text-xs text-red-400 flex items-center gap-2 py-2 font-bold">
                            <XCircle className="w-4 h-4 shrink-0" /> Registration Rejected. Please contact support via WhatsApp.
                          </p>
                        ) : (
                          <p className="text-xs text-amber-400/90 flex items-center gap-2 py-2 font-medium">
                            <AlertCircle className="w-4 h-4 shrink-0" /> Payment verification in progress by Admin. Check back shortly.
                          </p>
                        )}
                      </div>

                    </div>
                  ));
                })
              )}
            </div>
          </div>
        )}

        {/* 🏆 TAB 3: STANDINGS & LEADERBOARDS */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            
            <div className="border-b border-gray-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-wider flex items-center gap-2 text-white">
                  <Trophy className="text-amber-500" /> OFFICIAL LEADERBOARD & STANDINGS
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Live team rankings based on official Free Fire Tournament Point System.
                </p>
              </div>

              {/* Point System Badge */}
              <div className="bg-[#0E121B] border border-amber-500/30 p-2.5 rounded-xl text-xs flex items-center gap-3">
                <Flame className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold text-amber-400 block text-[10px] uppercase">Point Matrix</span>
                  <span className="text-gray-300 font-semibold">12 Pts Booyah + 1 Pt per Kill</span>
                </div>
              </div>
            </div>

            {/* Standings Table */}
            <div className="bg-[#0E121B] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#07090E] text-amber-400 uppercase font-black border-b border-gray-800">
                    <tr>
                      <th className="p-4">Rank</th>
                      <th className="p-4">Squad Name</th>
                      <th className="p-4 text-center">Matches</th>
                      <th className="p-4 text-center">Booyah</th>
                      <th className="p-4 text-center">Kills</th>
                      <th className="p-4 text-center">Placement Pts</th>
                      <th className="p-4 text-right">Total Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 font-semibold">
                    {leaderboard.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-white/5 transition">
                        <td className="p-4">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                            idx === 0 ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/30' :
                            idx === 1 ? 'bg-gray-300 text-black' :
                            idx === 2 ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-400'
                          }`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="p-4 font-black text-white text-sm">
                          {item.squad_name}
                        </td>
                        <td className="p-4 text-center text-gray-300">{item.matches_played}</td>
                        <td className="p-4 text-center text-amber-400 font-bold">{item.booyah_count}</td>
                        <td className="p-4 text-center text-red-400 font-bold">{item.total_kills}</td>
                        <td className="p-4 text-center text-gray-300">{item.placement_points}</td>
                        <td className="p-4 text-right font-black text-amber-400 text-base">
                          {item.total_points} PTS
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Standings & Kill Calculator Tool */}
            <div className="bg-[#0E121B] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-black text-amber-400 flex items-center gap-2 uppercase">
                <Award className="w-5 h-5 text-amber-400" /> Interactive Point Calculator
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-gray-400 font-bold mb-1.5 uppercase text-[10px]">Expected Rank / Placement</label>
                  <select
                    value={calcPlacement}
                    onChange={(e) => setCalcPlacement(e.target.value)}
                    className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-3 text-white font-bold focus:outline-none focus:border-amber-500"
                  >
                    {OFFICIAL_POINT_SYSTEM.slice(0, 11).map((p, i) => (
                      <option key={i} value={i + 1}>{p.rank} ({p.points} Pts)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 font-bold mb-1.5 uppercase text-[10px]">Expected Total Kills</label>
                  <input
                    type="number"
                    min="0"
                    value={calcKills}
                    onChange={(e) => setCalcKills(e.target.value)}
                    className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-3 text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="bg-[#07090E] border border-amber-500/30 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Calculated Result</span>
                    <span className="text-amber-400 font-black text-2xl">{calculatedPoints} PTS</span>
                  </div>
                  <Trophy className="w-8 h-8 text-amber-400 opacity-50" />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 📜 TAB 4: RULES & SUPPORT */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            
            <div className="border-b border-gray-800 pb-4">
              <h2 className="text-2xl font-black tracking-wider flex items-center gap-2 text-white">
                <BookOpen className="text-amber-500" /> TOURNAMENT RULES & SUPPORT
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Official rules, anti-cheat policy, and 24/7 organizer contact details.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Rules Accordion / Cards */}
              <div className="space-y-4">
                <div className="bg-[#0E121B] border border-gray-800 p-5 rounded-2xl space-y-2">
                  <h3 className="font-black text-amber-400 text-sm flex items-center gap-2 uppercase">
                    <ShieldCheck className="w-4 h-4" /> 1. General & Match Timing Rules
                  </h3>
                  <ul className="text-xs text-gray-300 space-y-1.5 list-disc pl-4 font-medium">
                    <li>Room ID and Password will be posted on the <span className="text-amber-400">My Slots</span> tab 15 minutes before start.</li>
                    <li>All players must join the room within 10 minutes of room creation.</li>
                    <li>Matches will start strictly at the scheduled time. No waiting for late players.</li>
                  </ul>
                </div>

                <div className="bg-[#0E121B] border border-gray-800 p-5 rounded-2xl space-y-2">
                  <h3 className="font-black text-amber-400 text-sm flex items-center gap-2 uppercase">
                    <AlertCircle className="w-4 h-4" /> 2. Fair Play & Anti-Cheat Regulations
                  </h3>
                  <ul className="text-xs text-gray-300 space-y-1.5 list-disc pl-4 font-medium">
                    <li>Hacking, panel usage, script, or recoil mods lead to permanent instant ban.</li>
                    <li>Emulators (PC) are strictly forbidden unless specified in match title.</li>
                    <li>Teaming up with enemy squads will result in disqualification and loss of entry fee.</li>
                  </ul>
                </div>

                <div className="bg-[#0E121B] border border-gray-800 p-5 rounded-2xl space-y-2">
                  <h3 className="font-black text-amber-400 text-sm flex items-center gap-2 uppercase">
                    <Award className="w-4 h-4" /> 3. Payout & Prize Distribution
                  </h3>
                  <ul className="text-xs text-gray-300 space-y-1.5 list-disc pl-4 font-medium">
                    <li>Prize money will be sent via Bkash / Nagad within 2 hours of match end.</li>
                    <li>Winners must submit match screenshot/video if requested by admins.</li>
                  </ul>
                </div>
              </div>

              {/* Point System & Direct Support Panel */}
              <div className="space-y-6">
                
                {/* Official Point Matrix */}
                <div className="bg-[#0E121B] border border-gray-800 p-5 rounded-2xl space-y-3">
                  <h3 className="font-black text-amber-400 text-sm uppercase">Official Point Table</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {OFFICIAL_POINT_SYSTEM.map((p, idx) => (
                      <div key={idx} className="bg-[#07090E] p-2 rounded-lg border border-gray-800 flex justify-between font-semibold">
                        <span className="text-gray-400">{p.rank}</span>
                        <span className="text-amber-400 font-black">{p.points}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Direct Support Contact Buttons */}
                <div className="bg-[#0E121B] border border-amber-500/30 p-6 rounded-2xl space-y-4 shadow-xl">
                  <h3 className="font-black text-white text-base flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-amber-400" /> LIVE ORGANIZER SUPPORT
                  </h3>
                  <p className="text-xs text-gray-400">
                    Having trouble with payment verification or room access? Contact our 24/7 Tournament Help Desk directly.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a
                      href="https://wa.me/8801700000000?text=Hello%20Admin,%20I%20need%20help%20with%20Free%20Fire%20Tournament"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition"
                    >
                      <Smartphone className="w-4 h-4" /> WhatsApp Support
                    </a>

                    <a
                      href="https://t.me/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 hover:bg-blue-500 text-white font-black px-4 py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition"
                    >
                      <Send className="w-4 h-4" /> Telegram Channel
                    </a>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* 🛡️ TAB 5: SUPER ADMIN CONTROL CENTER */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            
            {!isAdminLoggedIn ? (
              /* ADMIN PIN ACCESS GUARD */
              <div className="max-w-md mx-auto my-12 bg-[#0E121B] border border-amber-500/30 rounded-2xl p-8 shadow-2xl text-center space-y-6">
                <div className="w-16 h-16 bg-red-600/20 text-red-400 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto">
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-wider">SUPER ADMIN ACCESS</h2>
                  <p className="text-xs text-gray-400 mt-1">Enter Security PIN Code to open admin tournament controls.</p>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <input
                    type="password"
                    placeholder="Enter Admin PIN (Default: 1234)"
                    value={adminPinInput}
                    onChange={(e) => setAdminPinInput(e.target.value)}
                    className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-3 text-center text-xl font-bold tracking-widest text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-red-600 to-amber-600 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider hover:opacity-90 transition shadow-lg"
                  >
                    VERIFY SECURITY PIN
                  </button>
                </form>
              </div>
            ) : (
              /* ADMIN DASHBOARD PANELS */
              <div className="space-y-6">
                
                {/* Admin Header Bar */}
                <div className="bg-[#0E121B] border border-red-500/30 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-red-600/20 text-red-400 rounded-xl border border-red-500/30 font-black">
                      ADM
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white uppercase tracking-wider">SUPER ADMIN CONTROL CENTER</h2>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Authenticated Control Session Active
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsAdminLoggedIn(false)}
                    className="px-3.5 py-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 font-bold text-xs hover:bg-red-600 hover:text-white transition flex items-center gap-2 self-start md:self-auto"
                  >
                    <LogOut className="w-4 h-4" /> Lock Panel
                  </button>
                </div>

                {/* Sub Navigation */}
                <div className="flex flex-wrap gap-2 border-b border-gray-800 pb-3">
                  {[
                    { id: 'matches', label: 'Create & Manage Matches', icon: Gamepad2 },
                    { id: 'verification', label: 'Payment Verifications', icon: CheckCircle },
                    { id: 'broadcast', label: 'Room Broadcaster', icon: Key },
                    { id: 'results', label: 'Record Results', icon: Trophy },
                    { id: 'notices', label: 'Banner & Notice', icon: Radio },
                    { id: 'sql', label: 'Supabase SQL Setup', icon: FileText },
                  ].map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => setAdminSubTab(sub.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition flex items-center gap-2 ${
                        adminSubTab === sub.id
                          ? 'bg-amber-500 text-black font-black'
                          : 'bg-[#0E121B] text-gray-400 hover:text-white border border-gray-800'
                      }`}
                    >
                      <sub.icon className="w-4 h-4" /> {sub.label}
                    </button>
                  ))}
                </div>

                {/* SUB TAB 1: CREATE MATCH ENGINE */}
                {adminSubTab === 'matches' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Create Match Form */}
                    <div className="lg:col-span-1 bg-[#0E121B] border border-gray-800 rounded-2xl p-5 space-y-4">
                      <h3 className="font-black text-amber-400 text-sm uppercase flex items-center gap-2">
                        <PlusCircle className="w-4 h-4" /> Publish New Tournament
                      </h3>

                      <form onSubmit={handleCreateMatch} className="space-y-3 text-xs">
                        <div>
                          <label className="block text-gray-400 font-bold mb-1 uppercase text-[10px]">Match Title</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. SQUAD NIGHT CLASH - CUP 05"
                            value={newMatch.title}
                            onChange={(e) => setNewMatch({ ...newMatch, title: e.target.value })}
                            className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-gray-400 font-bold mb-1 uppercase text-[10px]">Map</label>
                            <select
                              value={newMatch.map}
                              onChange={(e) => setNewMatch({ ...newMatch, map: e.target.value })}
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
                            <label className="block text-gray-400 font-bold mb-1 uppercase text-[10px]">Mode</label>
                            <select
                              value={newMatch.mode}
                              onChange={(e) => setNewMatch({ ...newMatch, mode: e.target.value })}
                              className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                            >
                              <option value="SOLO">SOLO</option>
                              <option value="DUO">DUO</option>
                              <option value="SQUAD">SQUAD</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-gray-400 font-bold mb-1 uppercase text-[10px]">Entry Fee (৳)</label>
                            <input
                              type="number"
                              value={newMatch.entryFee}
                              onChange={(e) => setNewMatch({ ...newMatch, entryFee: e.target.value })}
                              className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div>
                            <label className="block text-gray-400 font-bold mb-1 uppercase text-[10px]">Prize Pool (৳)</label>
                            <input
                              type="number"
                              value={newMatch.prizePool}
                              onChange={(e) => setNewMatch({ ...newMatch, prizePool: e.target.value })}
                              className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-gray-400 font-bold mb-1 uppercase text-[10px]">Per Kill (৳)</label>
                            <input
                              type="number"
                              value={newMatch.perKill}
                              onChange={(e) => setNewMatch({ ...newMatch, perKill: e.target.value })}
                              className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div>
                            <label className="block text-gray-400 font-bold mb-1 uppercase text-[10px]">Total Slots</label>
                            <input
                              type="number"
                              value={newMatch.totalSlots}
                              onChange={(e) => setNewMatch({ ...newMatch, totalSlots: e.target.value })}
                              className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-gray-400 font-bold mb-1 uppercase text-[10px]">Display Schedule Time</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Today @ 10:30 PM"
                            value={newMatch.displayTime}
                            onChange={(e) => setNewMatch({ ...newMatch, displayTime: e.target.value })}
                            className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-3 rounded-xl uppercase tracking-wider transition shadow-lg"
                        >
                          PUBLISH MATCH NOW
                        </button>
                      </form>
                    </div>

                    {/* Published Matches Management Table */}
                    <div className="lg:col-span-2 bg-[#0E121B] border border-gray-800 rounded-2xl p-5 space-y-4">
                      <h3 className="font-black text-white text-sm uppercase">Active Published Matches</h3>

                      <div className="space-y-3">
                        {tournaments.map(t => (
                          <div key={t.id} className="bg-[#07090E] border border-gray-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-amber-400 text-sm">{t.title}</span>
                                <span className="text-[9px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded uppercase font-bold">{t.status}</span>
                              </div>
                              <p className="text-[11px] text-gray-400 mt-1">
                                Map: {t.map} | Fee: ৳{t.entry_fee} | Prize: ৳{t.prize_pool} | Time: {t.display_time}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  const newStatus = t.status === 'UPCOMING' ? 'LIVE' : t.status === 'LIVE' ? 'COMPLETED' : 'UPCOMING';
                                  setTournaments(prev => prev.map(m => m.id === t.id ? { ...m, status: newStatus } : m));
                                  showToast(`Match status changed to ${newStatus}`, 'info');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold text-[10px] uppercase border border-gray-700"
                              >
                                Toggle Status
                              </button>

                              <button
                                onClick={() => {
                                  setTournaments(prev => prev.filter(m => m.id !== t.id));
                                  showToast('Match Deleted!', 'info');
                                }}
                                className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* SUB TAB 2: PAYMENT VERIFICATIONS */}
                {adminSubTab === 'verification' && (
                  <div className="bg-[#0E121B] border border-gray-800 rounded-2xl p-5 space-y-4">
                    <h3 className="font-black text-amber-400 text-sm uppercase flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Registered Squads & TrxID Verification
                    </h3>

                    <div className="space-y-4">
                      {tournaments.flatMap(t => (t.registered_teams || []).map(tm => ({ ...tm, tournamentTitle: t.title, tournamentId: t.id }))).length === 0 ? (
                        <p className="text-gray-500 text-xs text-center py-8">No registration requests found.</p>
                      ) : (
                        tournaments.flatMap(t => (t.registered_teams || []).map(tm => ({ ...tm, tournamentTitle: t.title, tournamentId: t.id }))).map(tm => (
                          <div key={tm.id} className="bg-[#07090E] border border-gray-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-white">{tm.squad_name}</span>
                                <span className="text-[10px] text-amber-400 font-bold">({tm.tournamentTitle})</span>
                                <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                                  tm.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                               }`}>
                                  {tm.status}
                                </span>
                              </div>
                              <p className="text-gray-400">Leader: <span className="text-gray-200 font-bold">{tm.leader_ign}</span> (UID: {tm.leader_uid})</p>
                              <p className="text-gray-400">TrxID: <span className="font-mono text-amber-400 font-bold">{tm.trx_id}</span> via {tm.payment_method}</p>
                              <p className="text-gray-400">WhatsApp: <span className="text-emerald-400 font-bold">{tm.whatsapp}</span></p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdateRegStatus(tm.tournamentId, tm.id, 'APPROVED')}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase shadow transition"
                              >
                                APPROVE
                              </button>
                              <button
                                onClick={() => handleUpdateRegStatus(tm.tournamentId, tm.id, 'REJECTED')}
                                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase shadow transition"
                              >
                                REJECT
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* SUB TAB 3: ROOM CREDENTIALS BROADCASTER */}
                {adminSubTab === 'broadcast' && (
                  <div className="bg-[#0E121B] border border-gray-800 rounded-2xl p-5 space-y-4">
                    <h3 className="font-black text-amber-400 text-sm uppercase flex items-center gap-2">
                      <Key className="w-4 h-4" /> Live Room ID & Password Broadcaster
                    </h3>

                    <div className="space-y-4">
                      {tournaments.map(t => (
                        <div key={t.id} className="bg-[#07090E] border border-gray-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h4 className="font-black text-white text-sm">{t.title}</h4>
                            <p className="text-xs text-gray-400 mt-0.5">Map: {t.map} | Time: {t.display_time}</p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="text"
                              placeholder="Room ID"
                              defaultValue={t.room_id}
                              id={`room-id-${t.id}`}
                              className="bg-[#0E121B] border border-gray-800 rounded-lg p-2 text-xs text-amber-400 font-bold w-32 focus:outline-none focus:border-amber-500"
                            />
                            <input
                              type="text"
                              placeholder="Password"
                              defaultValue={t.room_pass}
                              id={`room-pass-${t.id}`}
                              className="bg-[#0E121B] border border-gray-800 rounded-lg p-2 text-xs text-amber-400 font-bold w-28 focus:outline-none focus:border-amber-500"
                            />
                            <button
                              onClick={() => {
                                const idVal = document.getElementById(`room-id-${t.id}`).value;
                                const passVal = document.getElementById(`room-pass-${t.id}`).value;
                                handleUpdateRoomCredentials(t.id, idVal, passVal);
                              }}
                              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase shadow transition"
                            >
                              BROADCAST
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SUB TAB 4: RECORD RESULTS */}
                {adminSubTab === 'results' && (
                  <div className="bg-[#0E121B] border border-gray-800 rounded-2xl p-5 space-y-4">
                    <h3 className="font-black text-amber-400 text-sm uppercase flex items-center gap-2">
                      <Trophy className="w-4 h-4" /> Record Match Points & Leaderboard Standings
                    </h3>

                    <form onSubmit={handleAddLeaderboardResult} className="space-y-4 max-w-lg text-xs">
                      <div>
                        <label className="block text-gray-400 font-bold mb-1 uppercase text-[10px]">Squad Name</label>
                        <input
                          type="text"
                          name="squad"
                          required
                          placeholder="e.g. VIP ELITE"
                          className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-3 text-white font-bold focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-gray-400 font-bold mb-1 uppercase text-[10px]">Total Kills</label>
                          <input
                            type="number"
                            name="kills"
                            required
                            defaultValue="5"
                            className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-3 text-white font-bold focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-400 font-bold mb-1 uppercase text-[10px]">Placement Points</label>
                          <input
                            type="number"
                            name="placementPts"
                            required
                            defaultValue="12"
                            className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-3 text-white font-bold focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input type="checkbox" id="booyah" name="booyah" className="w-4 h-4 accent-amber-500" />
                        <label htmlFor="booyah" className="text-white font-bold cursor-pointer uppercase text-xs">Squad achieved Booyah! (1st Rank)</label>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-3 rounded-xl uppercase tracking-wider transition shadow-lg"
                      >
                        UPDATE GLOBAL LEADERBOARD
                      </button>
                    </form>
                  </div>
                )}

                {/* SUB TAB 5: BANNER & TICKER NOTICES */}
                {adminSubTab === 'notices' && (
                  <div className="bg-[#0E121B] border border-gray-800 rounded-2xl p-5 space-y-4">
                    <h3 className="font-black text-amber-400 text-sm uppercase flex items-center gap-2">
                      <Radio className="w-4 h-4" /> Live Announcement Ticker Notice
                    </h3>

                    <div className="space-y-3">
                      <textarea
                        rows="3"
                        value={tickerNotice}
                        onChange={(e) => setTickerNotice(e.target.value)}
                        className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-3 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={() => showToast('Ticker Announcement Updated!', 'success')}
                        className="px-6 py-2.5 rounded-xl bg-amber-500 text-black font-black text-xs uppercase shadow hover:bg-amber-400 transition"
                      >
                        SAVE TICKER ANNOUNCEMENT
                      </button>
                    </div>
                  </div>
                )}

                {/* SUB TAB 6: SUPABASE SQL EDITOR SCRIPT */}
                {adminSubTab === 'sql' && (
                  <div className="bg-[#0E121B] border border-gray-800 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-black text-amber-400 text-sm uppercase flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Supabase SQL Setup Script
                      </h3>
                      <button
                        onClick={() => copyToClipboard(SUPABASE_SQL_SCHEMA, 'SQL Schema Script')}
                        className="px-4 py-2 rounded-xl bg-amber-500 text-black font-black text-xs uppercase flex items-center gap-2 hover:bg-amber-400 transition"
                      >
                        <Copy className="w-4 h-4" /> Copy SQL Script
                      </button>
                    </div>

                    <p className="text-xs text-gray-400">
                      Copy and paste this script directly into your Supabase Dashboard SQL Editor to initialize all tables, RLS policies, and default values!
                    </p>

                    <pre className="bg-[#07090E] p-4 rounded-xl text-[11px] font-mono text-emerald-400 border border-gray-800 overflow-x-auto max-h-96 leading-relaxed">
                      {SUPABASE_SQL_SCHEMA}
                    </pre>

                    {/* Supabase Custom Credentials Form */}
                    <div className="pt-4 border-t border-gray-800 space-y-3">
                      <h4 className="text-xs font-black text-white uppercase">Connect Custom Supabase Credentials</h4>
                      <form onSubmit={handleConnectSupabase} className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <input
                          type="text"
                          placeholder="Supabase Project URL"
                          value={customSupabaseUrl}
                          onChange={(e) => setCustomSupabaseUrl(e.target.value)}
                          className="bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                        />
                        <input
                          type="password"
                          placeholder="Supabase Anon Key"
                          value={customSupabaseKey}
                          onChange={(e) => setCustomSupabaseKey(e.target.value)}
                          className="bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="submit"
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl p-2.5 uppercase transition"
                        >
                          CONNECT LIVE CLOUD
                        </button>
                      </form>
                    </div>

                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </main>

      {/* 📝 REGISTRATION & PAYMENT MODAL */}
      {regModalOpen && selectedMatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E121B] border border-amber-500/40 w-full max-w-lg rounded-2xl p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            
            <button
              onClick={() => setRegModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-gray-800 pb-3">
              <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded uppercase border border-amber-500/30">
                {selectedMatch.mode} MATCH REGISTRATION
              </span>
              <h3 className="text-xl font-black text-white uppercase mt-1">{selectedMatch.title}</h3>
              <p className="text-xs text-gray-400">Entry Fee: <span className="text-emerald-400 font-bold">{selectedMatch.entry_fee === 0 ? 'FREE' : `৳ ${selectedMatch.entry_fee}`}</span> | Map: {selectedMatch.map}</p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              
              {/* Step 1: Squad & Player UIDs */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 font-bold mb-1 uppercase text-[10px]">Squad / Team Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. VIP ELITE"
                      value={regForm.squadName}
                      onChange={(e) => setRegForm({ ...regForm, squadName: e.target.value })}
                      className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1 uppercase text-[10px]">Leader In-Game Name (IGN) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. VIP_BOSS"
                      value={regForm.leaderIgn}
                      onChange={(e) => setRegForm({ ...regForm, leaderIgn: e.target.value })}
                      className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 font-bold mb-1 uppercase text-[10px]">Leader Free Fire UID *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 284910482"
                      value={regForm.leaderUid}
                      onChange={(e) => setRegForm({ ...regForm, leaderUid: e.target.value })}
                      className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1 uppercase text-[10px]">Player 2 UID</label>
                    <input
                      type="text"
                      placeholder="e.g. 883920148"
                      value={regForm.player2Uid}
                      onChange={(e) => setRegForm({ ...regForm, player2Uid: e.target.value })}
                      className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 font-bold mb-1 uppercase text-[10px]">Player 3 UID</label>
                    <input
                      type="text"
                      placeholder="e.g. 992014820"
                      value={regForm.player3Uid}
                      onChange={(e) => setRegForm({ ...regForm, player3Uid: e.target.value })}
                      className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1 uppercase text-[10px]">Player 4 UID</label>
                    <input
                      type="text"
                      placeholder="e.g. 110293848"
                      value={regForm.player4Uid}
                      onChange={(e) => setRegForm({ ...regForm, player4Uid: e.target.value })}
                      className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 font-bold mb-1 uppercase text-[10px]">WhatsApp Contact Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="01700000000"
                    value={regForm.whatsapp}
                    onChange={(e) => setRegForm({ ...regForm, whatsapp: e.target.value })}
                    className="w-full bg-[#07090E] border border-gray-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>
              </div>

              {/* Step 2: Payment Gateway (If Paid Match) */}
              {selectedMatch.entry_fee > 0 && (
                <div className="bg-[#07090E] p-4 rounded-xl border border-amber-500/30 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-amber-400 uppercase text-xs">Payment Instructions</span>
                    <span className="text-emerald-400 font-black text-sm">৳ {selectedMatch.entry_fee} Send Money</span>
                  </div>

                  <p className="text-[11px] text-gray-300 leading-relaxed font-medium">
                    Send <b>৳ {selectedMatch.entry_fee}</b> via Personal Bkash or Nagad to <span className="text-amber-400 font-mono font-bold">01700000000</span> and enter your TrxID below.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 font-bold mb-1 uppercase text-[10px]">Payment Method</label>
                      <select
                        value={regForm.paymentMethod}
                        onChange={(e) => setRegForm({ ...regForm, paymentMethod: e.target.value })}
                        className="w-full bg-[#0E121B] border border-gray-800 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-amber-500"
                      >
                        <option value="Bkash">Bkash Personal</option>
                        <option value="Nagad">Nagad Personal</option>
                        <option value="Rocket">Rocket</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-400 font-bold mb-1 uppercase text-[10px]">Transaction ID (TrxID) *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. TRX9920148"
                        value={regForm.trxId}
                        onChange={(e) => setRegForm({ ...regForm, trxId: e.target.value })}
                        className="w-full bg-[#0E121B] border border-gray-800 rounded-xl p-2.5 text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black py-3 rounded-xl uppercase tracking-wider hover:from-amber-400 hover:to-yellow-300 transition shadow-lg shadow-amber-500/20"
              >
                CONFIRM & SUBMIT REGISTRATION
              </button>

            </form>

          </div>
        </div>
      )}

      {/* 📱 MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0E121B]/95 border-t border-amber-500/20 backdrop-blur-md z-40 px-2 py-2 flex justify-around items-center">
        {[
          { id: 'tournaments', label: 'Lobby', icon: Gamepad2 },
          { id: 'myMatches', label: 'My Slots', icon: Key },
          { id: 'leaderboard', label: 'Standings', icon: Trophy },
          { id: 'rules', label: 'Rules', icon: BookOpen },
          { id: 'admin', label: 'Admin', icon: Settings },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-bold uppercase transition ${
              activeTab === tab.id ? 'text-amber-400 font-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-amber-400' : 'text-gray-400'}`} />
            {tab.label}
          </button>
        ))}
      </div>

    </div>
  );
}

```
