import React, { useState, useEffect } from 'react';
import { 
  Trophy, ShieldCheck, Crosshair, Users, Key, Wallet, 
  Gamepad2, PlusCircle, CheckCircle, Clock, AlertCircle, User, Settings
} from 'lucide-react';

// --- DEMO INITIAL DATA ---
const INITIAL_TOURNAMENTS = [
  {
    id: 'ff-101',
    title: 'BERMUDA CHAMPIONSHIP SQUAD',
    map: 'Bermuda',
    mode: 'SQUAD',
    entryFee: 100,
    prizePool: 1000,
    perKill: 20,
    totalSlots: 12,
    time: 'Today at 08:00 PM',
    status: 'UPCOMING',
    roomId: '8839201',
    roomPass: '1234',
    joinedTeams: [
      {
        id: 'team-1',
        squadName: 'ALPHA BD',
        leaderUid: '1029384756',
        player2Uid: '5647382910',
        player3Uid: '9988776655',
        player4Uid: '1122334455',
        whatsapp: '01700000000',
        trxId: 'TRX9823472',
        status: 'APPROVED'
      }
    ]
  },
  {
    id: 'ff-102',
    title: 'PURGATORY SOLO CLASH',
    map: 'Purgatory',
    mode: 'SOLO',
    entryFee: 0,
    prizePool: 300,
    perKill: 10,
    totalSlots: 48,
    time: 'Tomorrow at 09:00 PM',
    status: 'UPCOMING',
    roomId: '',
    roomPass: '',
    joinedTeams: []
  }
];

export default function App() {
  const [tournaments, setTournaments] = useState(() => {
    const saved = localStorage.getItem('ff_tournaments');
    return saved ? JSON.parse(saved) : INITIAL_TOURNAMENTS;
  });

  const [activeTab, setActiveTab] = useState('tournaments'); // tournaments, myMatches, admin
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    squadName: '',
    leaderUid: '',
    player2Uid: '',
    player3Uid: '',
    player4Uid: '',
    whatsapp: '',
    trxId: ''
  });

  // Admin New Tournament Form State
  const [newMatch, setNewMatch] = useState({
    title: '', map: 'Bermuda', mode: 'SQUAD', entryFee: 50, prizePool: 500, perKill: 10, totalSlots: 12, time: ''
  });

  // Save to LocalStorage for Demo persistence
  useEffect(() => {
    localStorage.setItem('ff_tournaments', JSON.stringify(tournaments));
  }, [tournaments]);

  // Handle Registration
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    const updatedTournaments = tournaments.map((t) => {
      if (t.id === selectedTournament.id) {
        const newTeam = {
          id: 'team-' + Date.now(),
          ...formData,
          status: t.entryFee === 0 ? 'APPROVED' : 'PENDING'
        };
        return {
          ...t,
          joinedTeams: [...t.joinedTeams, newTeam]
        };
      }
      return t;
    });

    setTournaments(updatedTournaments);
    setRegisterModalOpen(false);
    setFormData({ squadName: '', leaderUid: '', player2Uid: '', player3Uid: '', player4Uid: '', whatsapp: '', trxId: '' });
    alert(selectedTournament.entryFee === 0 ? 'Registration Successful!' : 'Registration submitted! Admin will verify your payment TrxID.');
  };

  // Admin Actions
  const updateRoomDetails = (tId, roomId, roomPass) => {
    setTournaments(tournaments.map(t => t.id === tId ? { ...t, roomId, roomPass } : t));
  };

  const updateTeamStatus = (tId, teamId, status) => {
    setTournaments(tournaments.map(t => {
      if (t.id === tId) {
        return {
          ...t,
          joinedTeams: t.joinedTeams.map(tm => tm.id === teamId ? { ...tm, status } : tm)
        };
      }
      return t;
    }));
  };

  const createTournament = (e) => {
    e.preventDefault();
    const created = {
      id: 'ff-' + Date.now(),
      ...newMatch,
      status: 'UPCOMING',
      roomId: '',
      roomPass: '',
      joinedTeams: []
    };
    setTournaments([created, ...tournaments]);
    setNewMatch({ title: '', map: 'Bermuda', mode: 'SQUAD', entryFee: 50, prizePool: 500, perKill: 10, totalSlots: 12, time: '' });
    alert('Tournament Created Successfully!');
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] text-gray-100 font-sans pb-12">
      {/* HEADER NAVBAR */}
      <header className="bg-[#121620] border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-amber-500 text-black p-1.5 rounded-lg font-bold text-xl tracking-tighter">FF</div>
            <span className="font-teko text-2xl font-bold tracking-wider text-amber-500">BOOYAH TOURNAMENTS</span>
          </div>

          <nav className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('tournaments')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${activeTab === 'tournaments' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
            >
              Tournaments
            </button>
            <button 
              onClick={() => setActiveTab('myMatches')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${activeTab === 'myMatches' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
            >
              My Matches
            </button>
            <button 
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border border-amber-500/30 flex items-center gap-1 transition ${activeTab === 'admin' ? 'bg-red-600 text-white border-transparent' : 'text-amber-400 hover:bg-amber-500/10'}`}
            >
              <Settings className="w-4 h-4" /> Admin Panel
            </button>
          </nav>
        </div>
      </header>

      {/* HERO BANNER */}
      <div className="bg-gradient-to-r from-red-900/40 via-amber-900/20 to-black border-b border-amber-500/20 py-8 mb-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold font-teko text-amber-400 tracking-wide uppercase mb-1">
            Official Free Fire Esports Arena
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
            Book your slots, compete with top teams, win daily cash prizes and view live Room ID/Password directly from your dashboard.
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4">
        {/* TOURNAMENTS LIST TAB */}
        {activeTab === 'tournaments' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold font-teko tracking-wider flex items-center gap-2 text-white">
                <Gamepad2 className="text-amber-500" /> ACTIVE TOURNAMENTS
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tournaments.map((t) => {
                const isFull = t.joinedTeams.length >= t.totalSlots;
                return (
                  <div key={t.id} className="bg-[#121620] border border-gray-800 rounded-xl overflow-hidden hover:border-amber-500/50 transition duration-300 shadow-xl">
                    <div className="bg-gradient-to-r from-red-600 to-amber-600 p-3 flex justify-between items-center">
                      <span className="font-bold text-black uppercase tracking-wider text-sm font-teko text-lg">{t.title}</span>
                      <span className="bg-black/80 text-amber-400 text-xs px-2.5 py-1 rounded-full font-bold">
                        {t.mode}
                      </span>
                    </div>

                    <div className="p-4 grid grid-cols-2 gap-4 text-sm border-b border-gray-800/60">
                      <div className="flex items-center gap-2.5">
                        <Trophy className="text-amber-400 w-5 h-5 shrink-0" />
                        <div>
                          <p className="text-gray-400 text-xs">Prize Pool</p>
                          <p className="font-bold text-amber-400">৳ {t.prizePool}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Crosshair className="text-red-400 w-5 h-5 shrink-0" />
                        <div>
                          <p className="text-gray-400 text-xs">Per Kill</p>
                          <p className="font-bold text-gray-200">৳ {t.perKill}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className="text-emerald-400 w-5 h-5 shrink-0" />
                        <div>
                          <p className="text-gray-400 text-xs">Entry Fee</p>
                          <p className="font-bold text-emerald-400">{t.entryFee === 0 ? 'FREE' : `৳ ${t.entryFee}`}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Users className="text-blue-400 w-5 h-5 shrink-0" />
                        <div>
                          <p className="text-gray-400 text-xs">Map</p>
                          <p className="font-bold text-gray-200">{t.map}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-[#0E1118]">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-400">Joined Slots</span>
                        <span className="font-bold text-amber-400">{t.joinedTeams.length} / {t.totalSlots} Teams</span>
                      </div>
                      <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden mb-4">
                        <div 
                          className="bg-amber-500 h-full transition-all duration-300" 
                          style={{ width: `${(t.joinedTeams.length / t.totalSlots) * 100}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {t.time}
                        </span>
                        <button
                          onClick={() => { setSelectedTournament(t); setRegisterModalOpen(true); }}
                          disabled={isFull}
                          className={`px-5 py-2 rounded-lg font-bold uppercase text-xs transition tracking-wider ${
                            isFull 
                              ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                              : 'bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-500/10'
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

        {/* MY MATCHES & ROOM CODE TAB */}
        {activeTab === 'myMatches' && (
          <div>
            <h2 className="text-2xl font-bold font-teko tracking-wider flex items-center gap-2 text-white mb-6">
              <Key className="text-amber-500" /> MY MATCHES & ROOM CREDENTIALS
            </h2>

            <div className="space-y-4">
              {tournaments.filter(t => t.joinedTeams.length > 0).length === 0 ? (
                <p className="text-gray-500 text-sm">You have not registered for any tournament yet.</p>
              ) : (
                tournaments.map(t => {
                  return t.joinedTeams.map(tm => (
                    <div key={tm.id} className="bg-[#121620] border border-gray-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-400 font-teko text-xl">{t.title}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            tm.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {tm.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Squad: <span className="text-white font-semibold">{tm.squadName}</span> | Time: {t.time}</p>
                      </div>

                      {/* Room Details View */}
                      <div className="bg-[#0A0C10] border border-amber-500/20 rounded-lg p-3 w-full md:w-auto min-w-[240px]">
                        {tm.status === 'APPROVED' ? (
                          t.roomId ? (
                            <div>
                              <p className="text-xs text-amber-400 font-bold mb-1 flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Room Credentials Ready!
                              </p>
                              <p className="text-xs text-gray-300">Room ID: <span className="font-mono text-amber-400 font-bold">{t.roomId}</span></p>
                              <p className="text-xs text-gray-300">Password: <span className="font-mono text-amber-400 font-bold">{t.roomPass}</span></p>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" /> Room ID will appear 15 mins before match.
                            </p>
                          )
                        ) : (
                          <p className="text-xs text-amber-400/80 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Pending Payment Verification
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

        {/* DEMO ADMIN PANEL TAB */}
        {activeTab === 'admin' && (
          <div className="space-y-8">
            {/* Create Tournament */}
            <div className="bg-[#121620] border border-gray-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold font-teko text-amber-400 mb-4 flex items-center gap-2">
                <PlusCircle className="w-5 h-5" /> CREATE NEW MATCH
              </h2>
              <form onSubmit={createTournament} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="text-gray-400">Match Title</label>
                  <input required type="text" className="w-full bg-[#0A0C10] border border-gray-700 rounded p-2 text-white mt-1" value={newMatch.title} onChange={e => setNewMatch({...newMatch, title: e.target.value})} placeholder="e.g. DAILY CLASH SQUAD" />
                </div>
                <div>
                  <label className="text-gray-400">Map</label>
                  <select className="w-full bg-[#0A0C10] border border-gray-700 rounded p-2 text-white mt-1" value={newMatch.map} onChange={e => setNewMatch({...newMatch, map: e.target.value})}>
                    <option value="Bermuda">Bermuda</option>
                    <option value="Purgatory">Purgatory</option>
                    <option value="Kalahari">Kalahari</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400">Entry Fee (৳)</label>
                  <input type="number" className="w-full bg-[#0A0C10] border border-gray-700 rounded p-2 text-white mt-1" value={newMatch.entryFee} onChange={e => setNewMatch({...newMatch, entryFee: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-gray-400">Prize Pool (৳)</label>
                  <input type="number" className="w-full bg-[#0A0C10] border border-gray-700 rounded p-2 text-white mt-1" value={newMatch.prizePool} onChange={e => setNewMatch({...newMatch, prizePool: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-gray-400">Time</label>
                  <input required type="text" className="w-full bg-[#0A0C10] border border-gray-700 rounded p-2 text-white mt-1" value={newMatch.time} onChange={e => setNewMatch({...newMatch, time: e.target.value})} placeholder="Today at 10:00 PM" />
                </div>
                <div className="md:col-span-3 flex items-end">
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-2.5 rounded text-white transition">
                    Publish Match
                  </button>
                </div>
              </form>
            </div>

            {/* Manage Matches & Room ID / Approvals */}
            <div className="bg-[#121620] border border-gray-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold font-teko text-amber-400 mb-4">MANAGE ROOM CODES & APPROVALS</h2>
              <div className="space-y-6">
                {tournaments.map(t => (
                  <div key={t.id} className="border border-gray-800 bg-[#0A0C10] p-4 rounded-xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-3 mb-3">
                      <div>
                        <span className="font-bold text-lg text-white font-teko">{t.title}</span>
                        <p className="text-xs text-gray-400">{t.joinedTeams.length} Teams Registered</p>
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Room ID" 
                          className="bg-[#121620] border border-gray-700 rounded px-2 py-1 text-xs text-white" 
                          value={t.roomId}
                          onChange={(e) => updateRoomDetails(t.id, e.target.value, t.roomPass)}
                        />
                        <input 
                          type="text" 
                          placeholder="Pass" 
                          className="bg-[#121620] border border-gray-700 rounded px-2 py-1 text-xs text-white" 
                          value={t.roomPass}
                          onChange={(e) => updateRoomDetails(t.id, t.roomId, e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Joined Teams */}
                    <div className="space-y-2">
                      {t.joinedTeams.length === 0 ? (
                        <p className="text-xs text-gray-500">No registrations yet.</p>
                      ) : (
                        t.joinedTeams.map(tm => (
                          <div key={tm.id} className="bg-[#121620] p-3 rounded flex justify-between items-center text-xs">
                            <div>
                              <p className="font-bold text-white">{tm.squadName} <span className="text-gray-400 font-normal">(Leader UID: {tm.leaderUid})</span></p>
                              <p className="text-gray-400">TrxID: <span className="text-amber-400 font-mono">{tm.trxId || 'N/A'}</span> | WhatsApp: {tm.whatsapp}</p>
                            </div>
                            <div className="flex gap-2">
                              {tm.status !== 'APPROVED' && (
                                <button onClick={() => updateTeamStatus(t.id, tm.id, 'APPROVED')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded font-bold">
                                  Approve
                                </button>
                              )}
                              {tm.status !== 'REJECTED' && (
                                <button onClick={() => updateTeamStatus(t.id, tm.id, 'REJECTED')} className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded font-bold">
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

      {/* REGISTRATION MODAL */}
      {registerModalOpen && selectedTournament && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-[#121620] border border-amber-500/40 rounded-2xl p-6 w-full max-w-md text-white relative shadow-2xl">
            <h2 className="text-2xl font-bold font-teko text-amber-400 mb-1">REGISTRATION FORM</h2>
            <p className="text-xs text-gray-400 mb-4">{selectedTournament.title} | Fee: ৳{selectedTournament.entryFee}</p>

            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-gray-400">Squad / Team Name</label>
                <input required type="text" placeholder="e.g. VIP ESPORTS" className="w-full bg-[#0A0C10] border border-gray-700 rounded p-2 text-white mt-1 focus:border-amber-500 outline-none" value={formData.squadName} onChange={e => setFormData({...formData, squadName: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-400">Leader FF UID</label>
                  <input required type="text" placeholder="UID 1" className="w-full bg-[#0A0C10] border border-gray-700 rounded p-2 text-white mt-1" value={formData.leaderUid} onChange={e => setFormData({...formData, leaderUid: e.target.value})} />
                </div>
                <div>
                  <label className="text-gray-400">Player 2 UID</label>
                  <input required type="text" placeholder="UID 2" className="w-full bg-[#0A0C10] border border-gray-700 rounded p-2 text-white mt-1" value={formData.player2Uid} onChange={e => setFormData({...formData, player2Uid: e.target.value})} />
                </div>
                <div>
                  <label className="text-gray-400">Player 3 UID</label>
                  <input type="text" placeholder="UID 3" className="w-full bg-[#0A0C10] border border-gray-700 rounded p-2 text-white mt-1" value={formData.player3Uid} onChange={e => setFormData({...formData, player3Uid: e.target.value})} />
                </div>
                <div>
                  <label className="text-gray-400">Player 4 UID</label>
                  <input type="text" placeholder="UID 4" className="w-full bg-[#0A0C10] border border-gray-700 rounded p-2 text-white mt-1" value={formData.player4Uid} onChange={e => setFormData({...formData, player4Uid: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="text-gray-400">WhatsApp Number</label>
                <input required type="text" placeholder="017xxxxxxxx" className="w-full bg-[#0A0C10] border border-gray-700 rounded p-2 text-white mt-1" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
              </div>

              {selectedTournament.entryFee > 0 && (
                <div className="bg-[#0A0C10] border border-amber-500/20 p-3 rounded space-y-2 mt-2">
                  <p className="text-amber-400 font-bold">Payment Instructions:</p>
                  <p className="text-gray-300">Send ৳{selectedTournament.entryFee} to bKash/Nagad Personal: <span className="text-amber-400 font-mono font-bold">01700000000</span></p>
                  <div>
                    <label className="text-gray-400">TrxID / Transaction ID</label>
                    <input required type="text" placeholder="e.g. TRX893247" className="w-full bg-[#121620] border border-gray-700 rounded p-2 text-white mt-1" value={formData.trxId} onChange={e => setFormData({...formData, trxId: e.target.value})} />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setRegisterModalOpen(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded font-bold uppercase">Submit Registration</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
