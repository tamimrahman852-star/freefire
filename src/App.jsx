import React, { useState, useEffect } from 'react';
import { 
  Trophy, ShieldCheck, Crosshair, Users, Key, Gamepad2, PlusCircle, 
  CheckCircle, Clock, AlertCircle, Settings, Award, BookOpen, TV, Flame, Check
} from 'lucide-react';

// --- REALISTIC FREE FIRE BANNER & MAP ASSETS ---
const IMAGES = {
  heroBanner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop',
  bermuda: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop',
  purgatory: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=600&auto=format&fit=crop',
  kalahari: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop',
};

// --- DEMO TOURNAMENTS DATA ---
const INITIAL_TOURNAMENTS = [
  {
    id: 'ff-301',
    title: 'FFWS OFFICIAL SQUAD CHAMPIONSHIP',
    map: 'Bermuda',
    mapImg: IMAGES.bermuda,
    mode: 'SQUAD',
    entryFee: 100,
    prizePool: 2000,
    perKill: 25,
    totalSlots: 12,
    startTime: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days later
    displayTime: 'Tomorrow at 08:00 PM',
    status: 'UPCOMING',
    roomId: '992014',
    roomPass: '7788',
    joinedTeams: [
      { id: 't1', squadName: 'VIP ELITE', leaderUid: '102938475', whatsapp: '01700000000', trxId: 'TRX99234', status: 'APPROVED' },
      { id: 't2', squadName: 'NEXUS GAMING', leaderUid: '883920192', whatsapp: '01800000000', trxId: 'TRX11029', status: 'APPROVED' }
    ]
  },
  {
    id: 'ff-302',
    title: 'BERMUDA SOLO SURVIVAL BATTLE',
    map: 'Purgatory',
    mapImg: IMAGES.purgatory,
    mode: 'SOLO',
    entryFee: 0,
    prizePool: 500,
    perKill: 10,
    totalSlots: 48,
    startTime: new Date(Date.now() + 43200000).toISOString(),
    displayTime: 'Today at 09:00 PM',
    status: 'UPCOMING',
    roomId: '',
    roomPass: '',
    joinedTeams: []
  }
];

// --- DEMO LEADERBOARD DATA ---
const INITIAL_LEADERBOARD = [
  { rank: 1, team: 'VIP ELITE', matches: 5, booyah: 3, kills: 42, points: 78 },
  { rank: 2, team: 'NEXUS GAMING', matches: 5, booyah: 1, kills: 35, points: 58 },
  { rank: 3, team: 'BD ESPORTS', matches: 5, booyah: 1, kills: 28, points: 49 },
  { rank: 4, team: 'NOOB SQUAD', matches: 5, booyah: 0, kills: 19, points: 31 },
];

export default function App() {
  const [tournaments, setTournaments] = useState(() => {
    const saved = localStorage.getItem('ff_pro_tournaments');
    return saved ? JSON.parse(saved) : INITIAL_TOURNAMENTS;
  });

  const [activeTab, setActiveTab] = useState('tournaments'); // tournaments, myMatches, leaderboard, rules, admin
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Registration Form State
  const [form, setForm] = useState({ squadName: '', leaderUid: '', player2Uid: '', player3Uid: '', player4Uid: '', whatsapp: '', trxId: '' });

  // Admin New Match State
  const [newMatch, setNewMatch] = useState({ title: '', map: 'Bermuda', mode: 'SQUAD', entryFee: 50, prizePool: 1000, perKill: 15, totalSlots: 12, displayTime: '' });

  useEffect(() => {
    localStorage.setItem('ff_pro_tournaments', JSON.stringify(tournaments));
  }, [tournaments]);

  // Handle Registration Submit
  const handleRegister = (e) => {
    e.preventDefault();
    const updated = tournaments.map(t => {
      if (t.id === selectedMatch.id) {
        const team = { id: 'team-' + Date.now(), ...form, status: t.entryFee === 0 ? 'APPROVED' : 'PENDING' };
        return { ...t, joinedTeams: [...t.joinedTeams, team] };
      }
      return t;
    });
    setTournaments(updated);
    setModalOpen(false);
    setForm({ squadName: '', leaderUid: '', player2Uid: '', player3Uid: '', player4Uid: '', whatsapp: '', trxId: '' });
    alert(selectedMatch.entryFee === 0 ? 'Slot booked successfully!' : 'Registration submitted! Verification in progress.');
  };

  // Admin Controls
  const updateRoom = (tId, roomId, roomPass) => {
    setTournaments(tournaments.map(t => t.id === tId ? { ...t, roomId, roomPass } : t));
  };

  const updateStatus = (tId, teamId, status) => {
    setTournaments(tournaments.map(t => {
      if (t.id === tId) {
        return { ...t, joinedTeams: t.joinedTeams.map(tm => tm.id === teamId ? { ...tm, status } : tm) };
      }
      return t;
    }));
  };

  const handleCreateMatch = (e) => {
    e.preventDefault();
    const created = {
      id: 'ff-' + Date.now(),
      ...newMatch,
      mapImg: newMatch.map === 'Purgatory' ? IMAGES.purgatory : newMatch.map === 'Kalahari' ? IMAGES.kalahari : IMAGES.bermuda,
      status: 'UPCOMING',
      roomId: '',
      roomPass: '',
      joinedTeams: []
    };
    setTournaments([created, ...tournaments]);
    setNewMatch({ title: '', map: 'Bermuda', mode: 'SQUAD', entryFee: 50, prizePool: 1000, perKill: 15, totalSlots: 12, displayTime: '' });
    alert('Match published successfully!');
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-gray-100 pb-24 md:pb-12">
      
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

          {/* Desktop Nav */}
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
              <Flame className="w-4 h-4 text-amber-400 animate-bounce" /> Free Fire Championship Season 2026
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold font-teko text-white tracking-wide leading-tight uppercase drop-shadow-md">
              DOMINATE THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200">BATTLEGROUND</span>
            </h1>
            <p className="text-gray-300 text-xs md:text-sm mt-1 max-w-lg hidden sm:block">
              Register your squad, claim your slot, get instant Room ID & Password, and compete for daily cash prize pools.
            </p>
          </div>
        </div>
      </div>

      {/* 📌 MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 mt-8">

        {/* 🎮 TAB 1: MATCHES LIST */}
        {activeTab === 'tournaments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h2 className="text-2xl font-bold font-teko tracking-wider flex items-center gap-2 text-white">
                <Gamepad2 className="text-amber-500" /> UPCOMING TOURNAMENTS
              </h2>
              <span className="text-xs text-gray-400 font-semibold">{tournaments.length} Matches Available</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tournaments.map((t) => {
                const isFull = t.joinedTeams.length >= t.totalSlots;
                return (
                  <div key={t.id} className="esports-card border border-gray-800 rounded-2xl overflow-hidden gold-glow-hover transition-all duration-300 flex flex-col justify-between">
                    
                    {/* Header Banner */}
                    <div className="relative h-36 overflow-hidden">
                      <img src={t.mapImg} alt={t.map} className="w-full h-full object-cover transition duration-500 hover:scale-110" />
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

                    {/* Stats Grid */}
                    <div className="p-4 grid grid-cols-2 gap-3 text-sm border-b border-gray-800/80">
                      <div className="bg-[#07090E]/60 p-2.5 rounded-xl border border-gray-800/50 flex items-center gap-3">
                        <Trophy className="text-amber-400 w-6 h-6 shrink-0" />
                        <div>
                          <p className="text-gray-400 text-[10px] uppercase font-bold">Prize Pool</p>
                          <p className="font-bold text-amber-400 font-teko text-xl leading-none">৳ {t.prizePool}</p>
                        </div>
                      </div>

                      <div className="bg-[#07090E]/60 p-2.5 rounded-xl border border-gray-800/50 flex items-center gap-3">
                        <Crosshair className="text-red-400 w-6 h-6 shrink-0" />
                        <div>
                          <p className="text-gray-400 text-[10px] uppercase font-bold">Per Kill</p>
                          <p className="font-bold text-white font-teko text-xl leading-none">৳ {t.perKill}</p>
                        </div>
                      </div>

                      <div className="bg-[#07090E]/60 p-2.5 rounded-xl border border-gray-800/50 flex items-center gap-3">
                        <ShieldCheck className="text-emerald-400 w-6 h-6 shrink-0" />
                        <div>
                          <p className="text-gray-400 text-[10px] uppercase font-bold">Entry Fee</p>
                          <p className="font-bold text-emerald-400 font-teko text-xl leading-none">{t.entryFee === 0 ? 'FREE' : `৳ ${t.entryFee}`}</p>
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

                    {/* Progress & Join Button */}
                    <div className="p-4 bg-[#0A0D14]">
                      <div className="flex justify-between text-xs mb-1.5 font-semibold">
                        <span className="text-gray-400">Slots Filled</span>
                        <span className="text-amber-400">{t.joinedTeams.length} / {t.totalSlots} Squads</span>
                      </div>
                      <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden mb-4">
                        <div 
                          className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full transition-all duration-500" 
                          style={{ width: `${(t.joinedTeams.length / t.totalSlots) * 100}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 flex items-center gap-1.5 font-medium">
                          <Clock className="w-4 h-4 text-amber-500" /> {t.displayTime}
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
          </div>
        )}

        {/* 🔑 TAB 2: MY MATCHES & ROOM ID */}
        {activeTab === 'myMatches' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold font-teko tracking-wider flex items-center gap-2 text-white border-b border-gray-800 pb-3">
              <Key className="text-amber-500" /> MY REGISTERED SLOTS & ROOM CREDENTIALS
            </h2>

            <div className="space-y-4">
              {tournaments.filter(t => t.joinedTeams.length > 0).length === 0 ? (
                <div className="esports-card p-8 rounded-2xl border border-gray-800 text-center">
                  <p className="text-gray-400 text-sm">You haven't joined any match yet. Book a slot from the Matches tab!</p>
                </div>
              ) : (
                tournaments.map(t => {
                  return t.joinedTeams.map(tm => (
                    <div key={tm.id} className="esports-card border border-gray-800 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 gold-glow">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-amber-400 font-teko text-2xl">{t.title}</span>
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                            tm.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}>
                            {tm.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Squad: <span className="text-white font-bold">{tm.squadName}</span> | Time: {t.displayTime}</p>
                      </div>

                      {/* Credentials Display */}
                      <div className="bg-[#07090E] border border-amber-500/30 rounded-xl p-4 w-full md:w-auto min-w-[280px]">
                        {tm.status === 'APPROVED' ? (
                          t.roomId ? (
                            <div>
                              <p className="text-xs text-amber-400 font-bold mb-2 flex items-center gap-1.5">
                                <CheckCircle className="w-4 h-4 text-emerald-400" /> ROOM CREDENTIALS READY
                              </p>
                              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#0E121B] p-2 rounded border border-gray-800">
                                <div><span className="text-gray-500 block text-[10px]">ROOM ID</span><span className="text-amber-400 font-bold text-base">{t.roomId}</span></div>
                                <div><span className="text-gray-500 block text-[10px]">PASSWORD</span><span className="text-amber-400 font-bold text-base">{t.roomPass}</span></div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 flex items-center gap-2 py-1">
                              <Clock className="w-4 h-4 text-amber-500 animate-spin" /> Room ID will appear 15 mins before match.
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

            <div className="esports-card border border-gray-800 rounded-2xl overflow-hidden">
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

        {/* 📜 TAB 4: RULES & REGULATIONS */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold font-teko tracking-wider flex items-center gap-2 text-white border-b border-gray-800 pb-3">
              <BookOpen className="text-amber-500" /> OFFICIAL TOURNAMENT RULES
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="esports-card border border-gray-800 rounded-2xl p-6 space-y-4">
                <h3 className="font-teko text-2xl text-amber-400 font-bold border-b border-gray-800 pb-2">GENERAL MATCH RULES</h3>
                <ul className="space-y-3 text-xs text-gray-300 list-disc list-inside leading-relaxed">
                  <li>All players must join the custom room before 5 minutes of official match start time.</li>
                  <li>Hacking, scripting, emulator tricks, or bug exploitation will result in an immediate permanent ban.</li>
                  <li>Squad leaders are responsible for sharing the Room ID and Password with teammates.</li>
                  <li>In case of server failure or mass disconnects, rematch decisions lie solely with tournament officials.</li>
                </ul>
              </div>

              <div className="esports-card border border-gray-800 rounded-2xl p-6 space-y-4">
                <h3 className="font-teko text-2xl text-amber-400 font-bold border-b border-gray-800 pb-2">POINT SYSTEM & PRIZES</h3>
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

        {/* ⚙️ TAB 5: DEMO ADMIN PANEL */}
        {activeTab === 'admin' && (
          <div className="space-y-8">
            {/* Create Match */}
            <div className="esports-card border border-gray-800 rounded-2xl p-6">
              <h2 className="text-2xl font-bold font-teko text-amber-400 mb-4 flex items-center gap-2">
                <PlusCircle className="w-5 h-5" /> CREATE NEW TOURNAMENT MATCH
              </h2>
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
                    Publish Match Now
                  </button>
                </div>
              </form>
            </div>

            {/* Room ID and Approvals */}
            <div className="esports-card border border-gray-800 rounded-2xl p-6">
              <h2 className="text-2xl font-bold font-teko text-amber-400 mb-4">MANAGE ROOM CREDENTIALS & PAYMENT APPROVALS</h2>
              <div className="space-y-6">
                {tournaments.map(t => (
                  <div key={t.id} className="border border-gray-800 bg-[#07090E] p-5 rounded-xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-3 mb-3">
                      <div>
                        <span className="font-bold text-xl text-white font-teko">{t.title}</span>
                        <p className="text-xs text-gray-400">{t.joinedTeams.length} Squads Registered</p>
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Room ID" 
                          className="bg-[#121620] border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white" 
                          value={t.roomId}
                          onChange={(e) => updateRoom(t.id, e.target.value, t.roomPass)}
                        />
                        <input 
                          type="text" 
                          placeholder="Password" 
                          className="bg-[#121620] border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white" 
                          value={t.roomPass}
                          onChange={(e) => updateRoom(t.id, t.roomId, e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      {t.joinedTeams.length === 0 ? (
                        <p className="text-xs text-gray-500">No teams have registered for this match yet.</p>
                      ) : (
                        t.joinedTeams.map(tm => (
                          <div key={tm.id} className="bg-[#121620] p-3 rounded-lg flex justify-between items-center text-xs border border-gray-800/80">
                            <div>
                              <p className="font-bold text-white">{tm.squadName} <span className="text-gray-400 font-normal">(Leader UID: {tm.leaderUid})</span></p>
                              <p className="text-gray-400">TrxID: <span className="text-amber-400 font-mono font-bold">{tm.trxId || 'N/A'}</span> | WhatsApp: {tm.whatsapp}</p>
                            </div>
                            <div className="flex gap-2">
                              {tm.status !== 'APPROVED' && (
                                <button onClick={() => updateStatus(t.id, tm.id, 'APPROVED')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg font-bold">
                                  Approve
                                </button>
                              )}
                              {tm.status !== 'REJECTED' && (
                                <button onClick={() => updateStatus(t.id, tm.id, 'REJECTED')} className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-lg font-bold">
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

      </main>

      {/* 📱 MOBILE BOTTOM NAVIGATION BAR (App Style) */}
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
          <div className="esports-card border border-amber-500/40 rounded-2xl p-6 w-full max-w-md text-white relative shadow-2xl">
            <h2 className="text-2xl font-bold font-teko text-amber-400 mb-1">REGISTER SQUAD SLOT</h2>
            <p className="text-xs text-gray-400 mb-4">{selectedMatch.title} | Entry: ৳{selectedMatch.entryFee}</p>

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

              {selectedMatch.entryFee > 0 && (
                <div className="bg-[#07090E] border border-amber-500/30 p-3 rounded-xl space-y-2 mt-2">
                  <p className="text-amber-400 font-bold">Payment Details:</p>
                  <p className="text-gray-300">Send ৳{selectedMatch.entryFee} to bKash/Nagad (Personal): <span className="text-amber-400 font-mono font-bold">01700000000</span></p>
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
