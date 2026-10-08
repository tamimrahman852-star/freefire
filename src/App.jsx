import React, { useState, useEffect } from 'react';
import { 
  Trophy, ShieldCheck, Crosshair, Users, Key, Gamepad2, PlusCircle, 
  CheckCircle, Clock, AlertCircle, Settings, Award, BookOpen, Flame, Check, Lock, RefreshCw
} from 'lucide-react';
import { supabase } from './supabaseClient';

const IMAGES = {
  heroBanner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop',
  bermuda: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop',
  purgatory: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=600&auto=format&fit=crop',
  kalahari: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop',
};

const INITIAL_LEADERBOARD = [
  { rank: 1, team: 'VIP ELITE', matches: 5, booyah: 3, kills: 42, points: 78 },
  { rank: 2, team: 'NEXUS GAMING', matches: 5, booyah: 1, kills: 35, points: 58 },
  { rank: 3, team: 'BD ESPORTS', matches: 5, booyah: 1, kills: 28, points: 49 },
  { rank: 4, team: 'NOOB SQUAD', matches: 5, booyah: 0, kills: 19, points: 31 },
];

export default function App() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tournaments');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Admin Security States
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const ADMIN_PIN = '1234'; // 🔑 সিক্রেট অ্যাডমিন পিন

  // Forms
  const [form, setForm] = useState({ squadName: '', leaderUid: '', player2Uid: '', player3Uid: '', player4Uid: '', whatsapp: '', trxId: '' });
  const [newMatch, setNewMatch] = useState({ title: '', map: 'Bermuda', mode: 'SQUAD', entryFee: 50, prizePool: 1000, perKill: 15, totalSlots: 12, displayTime: '' });

  useEffect(() => {
    fetchTournaments();
  }, []);

  // 🔄 Supabase থেকে আসল ডাটা ফেচ করা
  const fetchTournaments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tournaments')
      .select('*, registered_teams(*)');

    if (error) {
      console.error('Error fetching data:', error);
    } else {
      setTournaments(data || []);
    }
    setLoading(false);
  };

  // 📝 স্লট বুকিং এবং ডাটাবেসে সেভ করা
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!selectedMatch) return;

    const { error } = await supabase
      .from('registered_teams')
      .insert([
        {
          tournament_id: selectedMatch.id,
          squad_name: form.squadName,
          leader_uid: form.leaderUid,
          player2_uid: form.player2Uid,
          player3_uid: form.player3Uid,
          player4_uid: form.player4Uid,
          whatsapp: form.whatsapp,
          trx_id: form.trxId,
          status: selectedMatch.entryFee === 0 ? 'APPROVED' : 'PENDING'
        }
      ]);

    if (error) {
      alert('Error registering slot: ' + error.message);
    } else {
      alert(selectedMatch.entryFee === 0 ? 'Slot booked successfully!' : 'Registration submitted! Payment verifying by admin.');
      setModalOpen(false);
      setForm({ squadName: '', leaderUid: '', player2Uid: '', player3Uid: '', player4Uid: '', whatsapp: '', trxId: '' });
      fetchTournaments();
    }
  };

  // 🔑 অ্যাডমিন: রুম আইডি ও পাসওয়ার্ড আপডেট
  const updateRoom = async (tId, roomId, roomPass) => {
    const { error } = await supabase
      .from('tournaments')
      .update({ room_id: roomId, room_pass: roomPass })
      .eq('id', tId);

    if (error) alert('Failed to update Room credentials');
    else fetchTournaments();
  };

  // 🟢 অ্যাডমিন: টিমের পেমেন্ট একসেপ্ট/রিজেক্ট করা
  const updateStatus = async (teamId, status) => {
    const { error } = await supabase
      .from('registered_teams')
      .update({ status })
      .eq('id', teamId);

    if (error) alert('Failed to update status');
    else fetchTournaments();
  };

  // ➕ অ্যাডমিন: নতুন ম্যাচ ডাটাবেসে পাবলিশ করা
  const handleCreateMatch = async (e) => {
    e.preventDefault();
    const mapImg = newMatch.map === 'Purgatory' ? IMAGES.purgatory : newMatch.map === 'Kalahari' ? IMAGES.kalahari : IMAGES.bermuda;
    const newId = 'ff-' + Date.now();

    const { error } = await supabase
      .from('tournaments')
      .insert([
        {
          id: newId,
          title: newMatch.title,
          map: newMatch.map,
          map_img: mapImg,
          mode: newMatch.mode,
          entry_fee: newMatch.entryFee,
          prize_pool: newMatch.prizePool,
          per_kill: newMatch.perKill,
          total_slots: newMatch.totalSlots,
          display_time: newMatch.displayTime,
          status: 'UPCOMING',
          room_id: '',
          room_pass: ''
        }
      ]);

    if (error) {
      alert('Error publishing match: ' + error.message);
    } else {
      alert('Match Published Successfully to Supabase Backend!');
      setNewMatch({ title: '', map: 'Bermuda', mode: 'SQUAD', entryFee: 50, prizePool: 1000, perKill: 15, totalSlots: 12, displayTime: '' });
      fetchTournaments();
    }
  };

  // 🔐 অ্যাডমিন লগইন ভেরিফিকেশন
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPinInput === ADMIN_PIN) {
      setIsAdminLoggedIn(true);
      setAdminPinInput('');
    } else {
      alert('Incorrect PIN Code! Access Denied.');
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-gray-100 pb-24 md:pb-12 font-sans">
      
      {/* 🚀 TOP NAVBAR */}
      <header className="bg-[#0E121B]/90 border-b border-amber-500/20 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('tournaments')}>
            <div className="bg-gradient-to-tr from-amber-600 to-yellow-400 text-black p-2 rounded-lg font-extrabold text-xl font-teko leading-none shadow-lg shadow-amber-500/20">
              FF
            </div>
            <div>
              <span className="font-teko text-2xl font-bold tracking-wider text-amber-400 block leading-none">BOOYAH ARENA</span>
              <span className="text-[9px] text-gray-400 tracking-widest uppercase font-semibold block">Official Esports Portal</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {[
              { id: 'tournaments', label: 'Matches', icon: Gamepad2 },
              { id: 'myMatches', label: 'My Slots', icon: Key },
              { id: 'leaderboard', label: 'Standings', icon: Award },
              { id: 'rules', label: 'Rules', icon: BookOpen },
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
                activeTab === 'admin' ? 'bg-red-600 text-white border-red-500' : 'border-red-500/30 text-red-400 hover:bg-red-500/10'
              }`}
            >
              <Settings className="w-4 h-4" /> Admin
            </button>
          </nav>
        </div>
      </header>

      {/* 💥 HERO BANNER SECTION */}
      <div className="relative border-b border-amber-500/20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#07090E] via-[#07090E]/80 to-transparent z-10"></div>
        <img src={IMAGES.heroBanner} alt="FF Tournament" className="w-full h-56 md:h-80 object-cover object-center opacity-40 scale-105" />
        
        <div className="absolute inset-0 z-20 flex items-center max-w-7xl mx-auto px-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold uppercase mb-3 backdrop-blur-md">
              <Flame className="w-4 h-4 text-amber-400 animate-bounce" /> Free Fire Championship Season
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold font-teko text-white tracking-wide leading-tight uppercase drop-shadow-md">
              DOMINATE THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200">BATTLEGROUND</span>
            </h1>
            <p className="text-gray-300 text-xs md:text-sm mt-1 max-w-lg hidden sm:block">
              Book squad slots, submit payment, get verified Room ID & Pass, and win daily cash prize pools!
            </p>
          </div>
        </div>
      </div>

      {/* 📌 MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 mt-8">

        {/* 🎮 TAB 1: MATCHES LIST */}
        {activeTab === 'tournaments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h2 className="text-2xl font-bold font-teko tracking-wider flex items-center gap-2 text-white">
                <Gamepad2 className="text-amber-500" /> UPCOMING TOURNAMENTS
              </h2>
              <button onClick={fetchTournaments} className="text-xs text-amber-400 flex items-center gap-1 hover:underline">
                <RefreshCw className="w-3 h-3" /> Refresh Data
              </button>
            </div>

            {loading ? (
              <div className="text-center py-20 text-amber-400 font-bold animate-pulse">Loading Matches from Supabase Backend...</div>
            ) : tournaments.length === 0 ? (
              <div className="text-center py-20 text-gray-500">No active tournaments available. Create one from Admin Panel.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tournaments.map((t) => {
                  const joinedCount = t.registered_teams ? t.registered_teams.length : 0;
                  const isFull = joinedCount >= t.total_slots;

                  return (
                    <div key={t.id} className="bg-[#0E121B] border border-gray-800 rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-between shadow-xl">
                      
                      <div className="relative h-36 overflow-hidden">
                        <img src={t.map_img || IMAGES.bermuda} alt={t.map} className="w-full h-full object-cover transition duration-500 hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0E121B] via-[#0E121B]/40 to-transparent"></div>
                        
                        <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
                          <span className="bg-amber-500 text-black font-teko font-bold text-lg px-3 py-0.5 rounded uppercase tracking-wider">
                            {t.mode}
                          </span>
                          <span className="bg-black/70 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> VERIFIED MATCH
                          </span>
                        </div>

                        <div className="absolute bottom-2 left-3">
                          <h3 className="font-teko text-2xl font-bold text-white tracking-wide uppercase drop-shadow-md">{t.title}</h3>
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
                            <p className="font-bold text-emerald-400 font-teko text-xl leading-none">{t.entry_fee === 0 ? 'FREE' : `৳ ${t.entry_fee}`}</p>
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
                          <span className="text-gray-400">Slots Filled</span>
                          <span className="text-amber-400">{joinedCount} / {t.total_slots} Squads</span>
                        </div>
                        <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden mb-4">
                          <div 
                            className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full transition-all duration-500" 
                            style={{ width: `${(joinedCount / t.total_slots) * 100}%` }}
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

        {/* 🔑 TAB 2: MY MATCHES & ROOM ID */}
        {activeTab === 'myMatches' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold font-teko tracking-wider flex items-center gap-2 text-white border-b border-gray-800 pb-3">
              <Key className="text-amber-500" /> MY REGISTERED SLOTS & ROOM CREDENTIALS
            </h2>

            <div className="space-y-4">
              {tournaments.filter(t => t.registered_teams && t.registered_teams.length > 0).length === 0 ? (
                <div className="bg-[#0E121B] p-8 rounded-2xl border border-gray-800 text-center">
                  <p className="text-gray-400 text-sm">No slots registered yet on this device. Join a match to view Room credentials.</p>
                </div>
              ) : (
                tournaments.map(t => {
                  return (t.registered_teams || []).map(tm => (
                    <div key={tm.id} className="bg-[#0E121B] border border-gray-800 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-amber-400 font-teko text-2xl">{t.title}</span>
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                            tm.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}>
                            {tm.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Squad: <span className="text-white font-bold">{tm.squad_name}</span> | Time: {t.display_time}</p>
                      </div>

                      <div className="bg-[#07090E] border border-amber-500/30 rounded-xl p-4 w-full md:w-auto min-w-[280px]">
                        {tm.status === 'APPROVED' ? (
                          t.room_id ? (
                            <div>
                              <p className="text-xs text-amber-400 font-bold mb-2 flex items-center gap-1.5">
                                <CheckCircle className="w-4 h-4 text-emerald-400" /> ROOM CREDENTIALS READY
                              </p>
                              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#0E121B] p-2 rounded border border-gray-800">
                                <div><span className="text-gray-500 block text-[10px]">ROOM ID</span><span className="text-amber-400 font-bold text-base">{t.room_id}</span></div>
                                <div><span className="text-gray-500 block text-[10px]">PASSWORD</span><span className="text-amber-400 font-bold text-base">{t.room_pass}</span></div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 flex items-center gap-2 py-1">
                              <Clock className="w-4 h-4 text-amber-500 animate-spin" /> Room ID will appear 15 mins before match start.
                            </p>
                          )
                        ) : (
                          <p className="text-xs text-amber-400/90 flex items-center gap-2 py-1">
                            <AlertCircle className="w-4 h-4" /> Pending TrxID verification by admin.
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

        {/* 🏆 TAB 3: STANDINGS & LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold font-teko tracking-wider flex items-center gap-2 text-white border-b border-gray-800 pb-3">
              <Award className="text-amber-500" /> TOURNAMENT STANDINGS & OVERALL POINTS
            </h2>

            <div className="bg-[#0E121B] border border-gray-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0A0D14] text-gray-400 font-teko text-lg uppercase border-b border-gray-800">
                    <tr>
                      <th className="p-4">Rank</th>
                      <th className="p-4">Squad Name</th>
                      <th className="p-4 text-center">Matches</th>
                      <th className="p-4 text-center">Booyah</th>
                      <th className="p-4 text-center">Total Kills</th>
                      <th className="p-4 text-right">Total Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60 font-semibold">
                    {INITIAL_LEADERBOARD.map((row) => (
                      <tr key={row.rank} className="hover:bg-white/5 transition">
                        <td className="p-4">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm ${
                            row.rank === 1 ? 'bg-amber-500 text-black' : row.rank === 2 ? 'bg-gray-300 text-black' : row.rank === 3 ? 'bg-amber-800 text-white' : 'bg-gray-800 text-gray-400'
                          }`}>
                            #{row.rank}
                          </span>
                        </td>
                        <td className="p-4 text-white text-sm font-bold">{row.team}</td>
                        <td className="p-4 text-center text-gray-300">{row.matches}</td>
                        <td className="p-4 text-center text-amber-400 font-bold">{row.booyah}</td>
                        <td className="p-4 text-center text-red-400 font-bold">{row.kills}</td>
                        <td className="p-4 text-right text-amber-400 font-teko text-2xl font-bold">{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 📜 TAB 4: RULES */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold font-teko tracking-wider flex items-center gap-2 text-white border-b border-gray-800 pb-3">
              <BookOpen className="text-amber-500" /> OFFICIAL TOURNAMENT RULES
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#0E121B] border border-gray-800 rounded-2xl p-6 space-y-4">
                <h3 className="font-teko text-2xl text-amber-400 font-bold border-b border-gray-800 pb-2">GENERAL MATCH RULES</h3>
                <ul className="space-y-3 text-xs text-gray-300 list-disc list-inside leading-relaxed">
                  <li>All players must join the custom room before 5 minutes of official match start time.</li>
                  <li>Hacking, scripting, or emulator tricks will result in an immediate permanent ban.</li>
                  <li>Squad leaders are responsible for sharing the Room ID and Password with teammates.</li>
                </ul>
              </div>

              <div className="bg-[#0E121B] border border-gray-800 rounded-2xl p-6 space-y-4">
                <h3 className="font-teko text-2xl text-amber-400 font-bold border-b border-gray-800 pb-2">POINT SYSTEM</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 bg-[#07090E] rounded border border-gray-800">
                    <span className="text-gray-400">#1 Booyah Placement</span>
                    <span className="text-amber-400 font-bold">12 Points</span>
                  </div>
                  <div className="flex justify-between p-2 bg-[#07090E] rounded border border-gray-800">
                    <span className="text-gray-400">#2 Rank Placement</span>
                    <span className="text-amber-400 font-bold">9 Points</span>
                  </div>
                  <div className="flex justify-between p-2 bg-[#07090E] rounded border border-gray-800">
                    <span className="text-gray-400">Each Verified Kill</span>
                    <span className="text-red-400 font-bold">1 Point</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ⚙️ TAB 5: ADMIN PANEL (LOCKED BY PIN) */}
        {activeTab === 'admin' && (
          <div className="space-y-8">
            {!isAdminLoggedIn ? (
              /* Lock Screen */
              <div className="max-w-md mx-auto bg-[#0E121B] border border-red-500/30 rounded-2xl p-8 text-center shadow-2xl">
                <Lock className="w-12 h-12 text-red-500 mx-auto mb-4 animate-bounce" />
                <h2 className="text-3xl font-bold font-teko text-white tracking-wider">ADMIN ACCESS LOCKED</h2>
                <p className="text-xs text-gray-400 mb-6">Enter secret 4-digit Security PIN code to access backend controls.</p>

                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <input 
                    type="password" 
                    maxLength={4}
                    placeholder="ENTER PIN (1234)" 
                    className="w-full bg-[#07090E] border border-gray-700 rounded-xl p-3 text-center text-xl font-mono text-amber-400 outline-none focus:border-red-500"
                    value={adminPinInput}
                    onChange={(e) => setAdminPinInput(e.target.value)}
                  />
                  <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl uppercase tracking-wider text-xs">
                    Unlock Admin Panel
                  </button>
                </form>
              </div>
            ) : (
              /* Admin Controls */
              <div className="space-y-8">
                <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                  <h2 className="text-3xl font-bold font-teko text-red-500 tracking-wider">ADMIN BACKEND CONTROL CENTER</h2>
                  <button onClick={() => setIsAdminLoggedIn(false)} className="text-xs bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg font-bold">
                    Lock Panel
                  </button>
                </div>

                {/* Create Match Form */}
                <div className="bg-[#0E121B] border border-gray-800 rounded-2xl p-6">
                  <h3 className="text-2xl font-bold font-teko text-amber-400 mb-4 flex items-center gap-2">
                    <PlusCircle className="w-5 h-5" /> CREATE NEW TOURNAMENT MATCH
                  </h3>
                  <form onSubmit={handleCreateMatch} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <label className="text-gray-400">Match Title</label>
                      <input required type="text" className="w-full bg-[#07090E] border border-gray-700 rounded-xl p-2.5 text-white mt-1" value={newMatch.title} onChange={e => setNewMatch({...newMatch, title: e.target.value})} placeholder="e.g. DAILY BOOYAH SQUAD" />
                    </div>
                    <div>
                      <label className="text-gray-400">Map</label>
                      <select className="w-full bg-[#07090E] border border-gray-700 rounded-xl p-2.5 text-white mt-1" value={newMatch.map} onChange={e => setNewMatch({...newMatch, map: e.target.value})}>
                        <option value="Bermuda">Bermuda</option>
                        <option value="Purgatory">Purgatory</option>
                        <option value="Kalahari">Kalahari</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-400">Entry Fee (৳)</label>
                      <input type="number" className="w-full bg-[#07090E] border border-gray-700 rounded-xl p-2.5 text-white mt-1" value={newMatch.entryFee} onChange={e => setNewMatch({...newMatch, entryFee: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="text-gray-400">Prize Pool (৳)</label>
                      <input type="number" className="w-full bg-[#07090E] border border-gray-700 rounded-xl p-2.5 text-white mt-1" value={newMatch.prizePool} onChange={e => setNewMatch({...newMatch, prizePool: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="text-gray-400">Display Time</label>
                      <input required type="text" className="w-full bg-[#07090E] border border-gray-700 rounded-xl p-2.5 text-white mt-1" value={newMatch.displayTime} onChange={e => setNewMatch({...newMatch, displayTime: e.target.value})} placeholder="Today at 10:00 PM" />
                    </div>
                    <div className="md:col-span-3 flex items-end">
                      <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-3 rounded-xl text-white transition uppercase tracking-wider">
                        Publish Match to Database
                      </button>
                    </div>
                  </form>
                </div>

                {/* Manage Approvals */}
                <div className="bg-[#0E121B] border border-gray-800 rounded-2xl p-6">
                  <h3 className="text-2xl font-bold font-teko text-amber-400 mb-4">MANAGE ROOM CREDENTIALS & PAYMENT APPROVALS</h3>
                  <div className="space-y-6">
                    {tournaments.map(t => (
                      <div key={t.id} className="border border-gray-800 bg-[#07090E] p-5 rounded-xl">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-3 mb-3">
                          <div>
                            <span className="font-bold text-xl text-white font-teko">{t.title}</span>
                            <p className="text-xs text-gray-400">{(t.registered_teams || []).length} Squads Registered</p>
                          </div>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder="Room ID" 
                              className="bg-[#121620] border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white" 
                              defaultValue={t.room_id || ''}
                              onBlur={(e) => updateRoom(t.id, e.target.value, t.room_pass)}
                            />
                            <input 
                              type="text" 
                              placeholder="Password" 
                              className="bg-[#121620] border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white" 
                              defaultValue={t.room_pass || ''}
                              onBlur={(e) => updateRoom(t.id, t.room_id, e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          {(t.registered_teams || []).length === 0 ? (
                            <p className="text-xs text-gray-500">No teams registered for this match yet.</p>
                          ) : (
                            t.registered_teams.map(tm => (
                              <div key={tm.id} className="bg-[#121620] p-3 rounded-lg flex justify-between items-center text-xs border border-gray-800">
                                <div>
                                  <p className="font-bold text-white">{tm.squad_name} <span className="text-gray-400 font-normal">(Leader UID: {tm.leader_uid})</span></p>
                                  <p className="text-gray-400">TrxID: <span className="text-amber-400 font-mono font-bold">{tm.trx_id || 'N/A'}</span> | WhatsApp: {tm.whatsapp}</p>
                                </div>
                                <div className="flex gap-2 items-center">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${tm.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                    {tm.status}
                                  </span>
                                  {tm.status !== 'APPROVED' && (
                                    <button onClick={() => updateStatus(tm.id, 'APPROVED')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg font-bold">
                                      Approve
                                    </button>
                                  )}
                                  {tm.status !== 'REJECTED' && (
                                    <button onClick={() => updateStatus(tm.id, 'REJECTED')} className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-lg font-bold">
                                      Reject
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* 📱 MOBILE NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0E121B]/95 border-t border-amber-500/20 backdrop-blur-lg z-50 px-4 py-2 flex justify-around items-center">
        {[
          { id: 'tournaments', label: 'Matches', icon: Gamepad2 },
          { id: 'myMatches', label: 'My Slots', icon: Key },
          { id: 'leaderboard', label: 'Standings', icon: Award },
          { id: 'rules', label: 'Rules', icon: BookOpen },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 ${activeTab === tab.id ? 'text-amber-400' : 'text-gray-500'}`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 📝 REGISTRATION MODAL */}
      {modalOpen && selectedMatch && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="bg-[#0E121B] border border-amber-500/40 rounded-2xl p-6 w-full max-w-md text-white relative shadow-2xl">
            <h2 className="text-2xl font-bold font-teko text-amber-400 mb-1">REGISTER SQUAD SLOT</h2>
            <p className="text-xs text-gray-400 mb-4">{selectedMatch.title} | Entry: ৳{selectedMatch.entry_fee}</p>

            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="text-gray-400">Squad Name</label>
                <input required type="text" placeholder="e.g. VIP ESPORTS" className="w-full bg-[#07090E] border border-gray-700 rounded-xl p-2.5 text-white mt-1 outline-none focus:border-amber-500" value={form.squadName} onChange={e => setForm({...form, squadName: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-400">Leader FF UID</label>
                  <input required type="text" placeholder="UID 1" className="w-full bg-[#07090E] border border-gray-700 rounded-xl p-2.5 text-white mt-1" value={form.leaderUid} onChange={e => setForm({...form, leaderUid: e.target.value})} />
                </div>
                <div>
                  <label className="text-gray-400">Player 2 UID</label>
                  <input required type="text" placeholder="UID 2" className="w-full bg-[#07090E] border border-gray-700 rounded-xl p-2.5 text-white mt-1" value={form.player2Uid} onChange={e => setForm({...form, player2Uid: e.target.value})} />
                </div>
                <div>
                  <label className="text-gray-400">Player 3 UID</label>
                  <input type="text" placeholder="UID 3" className="w-full bg-[#07090E] border border-gray-700 rounded-xl p-2.5 text-white mt-1" value={form.player3Uid} onChange={e => setForm({...form, player3Uid: e.target.value})} />
                </div>
                <div>
                  <label className="text-gray-400">Player 4 UID</label>
                  <input type="text" placeholder="UID 4" className="w-full bg-[#07090E] border border-gray-700 rounded-xl p-2.5 text-white mt-1" value={form.player4Uid} onChange={e => setForm({...form, player4Uid: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="text-gray-400">WhatsApp Number</label>
                <input required type="text" placeholder="017xxxxxxxx" className="w-full bg-[#07090E] border border-gray-700 rounded-xl p-2.5 text-white mt-1" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} />
              </div>

              {selectedMatch.entry_fee > 0 && (
                <div className="bg-[#07090E] border border-amber-500/30 p-3 rounded-xl space-y-2 mt-2">
                  <p className="text-amber-400 font-bold">Payment Details:</p>
                  <p className="text-gray-300">Send ৳{selectedMatch.entry_fee} Send Money to bKash / Nagad (Personal):</p>
                  <p className="text-amber-400 font-mono font-bold text-base bg-[#121620] p-2 rounded text-center border border-amber-500/40">
                    01762324527
                  </p>
                  <div>
                    <label className="text-gray-400">TrxID / Transaction ID</label>
                    <input required type="text" placeholder="e.g. TRX893247" className="w-full bg-[#121620] border border-gray-700 rounded-xl p-2 text-white mt-1" value={form.trxId} onChange={e => setForm({...form, trxId: e.target.value})} />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black rounded-xl font-bold uppercase tracking-wider">Confirm Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
