import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  // Language & UI States
  const [lang, setLang] = useState('BN'); // BN or EN
  const [activeTab, setActiveTab] = useState('tournaments');
  const [adminAuth, setAdminAuth] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState('');

  // Main Data States
  const [tournaments, setTournaments] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [notices, setNotices] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [mvpStats, setMvpStats] = useState([]);
  const [prizeClaims, setPrizeClaims] = useState([]);
  const [brackets, setBrackets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchWhatsapp, setSearchWhatsapp] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('GROUP_A');

  // Modals & Forms
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [prizeClaimModal, setPrizeClaimModal] = useState(false);

  const [regForm, setRegForm] = useState({
    squad_name: '', leader_ign: '', leader_uid: '', leader_role: 'IGL',
    player2_uid: '', player3_uid: '', player4_uid: '',
    sub1_uid: '', sub2_uid: '', whatsapp: '', payment_method: 'Bkash', trx_id: ''
  });

  const [claimForm, setClaimForm] = useState({
    squad_name: '', leader_uid: '', account_type: 'Bkash', account_number: '', prize_amount: ''
  });

  const [ticketForm, setTicketForm] = useState({ squad_name: '', issue: '', proof_link: '' });

  const [newTournament, setNewTournament] = useState({
    title: '', map: 'Bermuda', mode: 'SQUAD', entry_fee: 0, prize_pool: 0, per_kill: 0, total_slots: 48,
    display_time: '', live_stream_url: '', rulebook_url: '', status: 'UPCOMING'
  });

  const [newBracket, setNewBracket] = useState({
    tournament_id: '', round_name: 'Quarter Final', team1_name: '', team2_name: '', winner_name: '', match_status: 'UPCOMING'
  });

  // Fetch All Arena Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, rRes, lRes, nRes, tkRes, mRes, pRes, bRes] = await Promise.all([
        supabase.from('tournaments').select('*').order('created_at', { ascending: false }),
        supabase.from('registrations').select('*').order('created_at', { ascending: false }),
        supabase.from('leaderboard').select('*').order('total_points', { ascending: false }),
        supabase.from('notices').select('*').order('created_at', { ascending: false }),
        supabase.from('tickets').select('*').order('created_at', { ascending: false }),
        supabase.from('mvp_stats').select('*').order('total_kills', { ascending: false }),
        supabase.from('prize_claims').select('*').order('created_at', { ascending: false }),
        supabase.from('brackets').select('*').order('created_at', { ascending: false })
      ]);

      if (tRes.data) setTournaments(tRes.data);
      if (rRes.data) setRegistrations(rRes.data);
      if (lRes.data) setLeaderboard(lRes.data);
      if (nRes.data) setNotices(nRes.data);
      if (tkRes.data) setTickets(tkRes.data);
      if (mRes.data) setMvpStats(mRes.data);
      if (pRes.data) setPrizeClaims(pRes.data);
      if (bRes.data) setBrackets(bRes.data);
    } catch (err) {
      console.error("Data Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Submit Handlers
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTournament) return;

    const payload = {
      tournament_id: selectedTournament.id,
      squad_name: regForm.squad_name,
      leader_ign: regForm.leader_ign,
      leader_uid: `${regForm.leader_uid} (${regForm.leader_role})`,
      player2_uid: regForm.player2_uid || null,
      player3_uid: regForm.player3_uid || null,
      player4_uid: regForm.player4_uid || null,
      sub_uid: `Sub1: ${regForm.sub1_uid || 'N/A'}, Sub2: ${regForm.sub2_uid || 'N/A'}`,
      whatsapp: regForm.whatsapp,
      payment_method: regForm.payment_method,
      trx_id: regForm.trx_id,
      status: 'PENDING'
    };

    const { error } = await supabase.from('registrations').insert([payload]);
    if (error) alert('Registration Error: ' + error.message);
    else {
      alert(lang === 'BN' ? 'স্কোয়াড রেজিস্ট্রেশন সফল হয়েছে!' : 'Squad Registered Successfully!');
      setSelectedTournament(null);
      fetchData();
    }
  };

  const activeNotice = notices.find((n) => n.is_active);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Header & Navigation */}
      <header className="border-b border-amber-500/20 bg-slate-900/95 backdrop-blur sticky top-0 z-40 px-4 py-3 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-2">
          <span className="bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded text-lg italic shadow-lg shadow-amber-500/30">FF</span>
          <h1 className="text-base md:text-lg font-black tracking-wider bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent uppercase">
            Booyah Arena Esports
          </h1>
        </div>

        {/* Dynamic Nav Menu */}
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {['tournaments', 'brackets', 'stream', 'groups', 'mvp', 'rules', 'leaderboard', 'my-registrations', 'claims', 'support', 'admin'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-105'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}

          {/* Language Toggle Button */}
          <button
            onClick={() => setLang(lang === 'BN' ? 'EN' : 'BN')}
            className="ml-2 px-2 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[10px] font-extrabold uppercase"
          >
            {lang === 'BN' ? 'ENGLISH' : 'বাংলা'}
          </button>
        </nav>
      </header>

      {/* Ticker Announcement */}
      {activeNotice && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-400 text-xs py-1 px-4 flex items-center">
          <span className="bg-amber-500 text-slate-950 font-extrabold px-1.5 py-0.2 rounded mr-2 text-[10px] uppercase tracking-wider shrink-0">
            {lang === 'BN' ? 'জরুরি নোটিশ' : 'ANNOUNCEMENT'}
          </span>
          <marquee className="font-semibold">{activeNotice.text}</marquee>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {loading ? (
          <div className="text-center py-24 space-y-3">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="text-amber-500 font-bold tracking-widest text-xs uppercase animate-pulse">Syncing Esports Data...</div>
          </div>
        ) : (
          <>
            {/* 1. TOURNAMENTS GRID */}
            {activeTab === 'tournaments' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-l-4 border-amber-500 pl-3">
                  <h2 className="text-lg font-black uppercase tracking-wider">
                    {lang === 'BN' ? 'অফিশিয়াল টুর্নামেন্টসমূহ' : 'Official Tournaments'}
                  </h2>
                  <span className="text-xs text-slate-400">Garena Free Fire Circuit</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tournaments.map((t) => {
                    const approvedCount = registrations.filter(r => r.tournament_id === t.id && r.status === 'APPROVED').length;
                    const isFull = approvedCount >= t.total_slots;

                    return (
                      <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-xl hover:border-amber-500/30 transition">
                        <div className="p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-bold uppercase">
                                {t.mode} • {t.map}
                              </span>
                              <h3 className="text-base font-extrabold text-white mt-1">{t.title}</h3>
                            </div>
                            <span className="text-xs font-bold text-amber-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                              🕒 {t.display_time}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center bg-slate-950/80 p-2.5 rounded border border-slate-800 text-xs">
                            <div><div className="text-slate-500 text-[10px]">PRIZE POOL</div><div className="font-extrabold text-amber-400">৳{t.prize_pool}</div></div>
                            <div><div className="text-slate-500 text-[10px]">ENTRY FEE</div><div className="font-extrabold text-slate-200">৳{t.entry_fee}</div></div>
                            <div><div className="text-slate-500 text-[10px]">PER KILL</div><div className="font-extrabold text-emerald-400">৳{t.per_kill}</div></div>
                          </div>

                          <div className="text-xs space-y-1">
                            <div className="flex justify-between text-slate-400">
                              <span>Slot Allocation</span>
                              <span className={isFull ? 'text-red-400 font-bold' : ''}>{approvedCount} / {t.total_slots}</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div className={`h-full ${isFull ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${Math.min((approvedCount / t.total_slots) * 100, 100)}%` }} />
                            </div>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              disabled={isFull || t.status !== 'UPCOMING'}
                              onClick={() => setSelectedTournament(t)}
                              className={`flex-1 py-2 rounded text-xs font-bold uppercase tracking-wider transition ${
                                isFull || t.status !== 'UPCOMING'
                                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                  : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/10'
                              }`}
                            >
                              {isFull ? 'Slots Full' : 'Register Squad'}
                            </button>

                            {t.rulebook_url && (
                              <a
                                href={t.rulebook_url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold uppercase flex items-center gap-1"
                              >
                                📄 Rulebook
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. VISUAL MATCH BRACKETS */}
            {activeTab === 'brackets' && (
              <div className="space-y-4">
                <div className="border-l-4 border-amber-500 pl-3">
                  <h2 className="text-lg font-black uppercase tracking-wider">Tournament Visual Bracket Tree</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {brackets.map((b) => (
                    <div key={b.id} className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg space-y-2">
                      <div className="flex justify-between items-center text-[10px] text-amber-400 font-bold uppercase border-b border-slate-800 pb-1">
                        <span>{b.round_name}</span>
                        <span className="text-slate-500">{b.match_status}</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className={`p-2 rounded border flex justify-between ${b.winner_name === b.team1_name ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 font-extrabold' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                          <span>{b.team1_name}</span>
                          {b.winner_name === b.team1_name && <span>👑 WINNER</span>}
                        </div>
                        <div className={`p-2 rounded border flex justify-between ${b.winner_name === b.team2_name ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 font-extrabold' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                          <span>{b.team2_name}</span>
                          {b.winner_name === b.team2_name && <span>👑 WINNER</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. LIVE MATCH STREAM */}
            {activeTab === 'stream' && (
              <div className="space-y-4 max-w-4xl mx-auto">
                <div className="border-l-4 border-amber-500 pl-3">
                  <h2 className="text-lg font-black uppercase tracking-wider">Official Tournament Live Broadcast</h2>
                </div>

                <div className="aspect-video w-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-2xl">
                  {tournaments.find(t => t.live_stream_url) ? (
                    <iframe
                      className="w-full h-full"
                      src={tournaments.find(t => t.live_stream_url)?.live_stream_url}
                      title="Free Fire Esports Broadcast"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500 text-xs font-bold uppercase tracking-widest">
                      📡 No Active Live Stream Signal
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. GROUP ALLOCATION */}
            {activeTab === 'groups' && (
              <div className="space-y-4">
                <div className="border-l-4 border-amber-500 pl-3">
                  <h2 className="text-lg font-black uppercase tracking-wider">Group Stage Bracket Allocation</h2>
                </div>

                <div className="flex gap-2 border-b border-slate-800 pb-2">
                  {['GROUP_A', 'GROUP_B', 'GROUP_C', 'GROUP_D'].map((grp) => (
                    <button
                      key={grp}
                      onClick={() => setSelectedGroup(grp)}
                      className={`px-3 py-1 rounded text-xs font-bold ${selectedGroup === grp ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
                    >
                      {grp.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {registrations.filter(r => r.status === 'APPROVED').slice(0, 12).map((r, idx) => (
                    <div key={r.id} className="bg-slate-900 border border-slate-800 p-3 rounded flex justify-between items-center text-xs">
                      <span className="font-mono text-slate-500 font-bold">SLOT #{idx + 1}</span>
                      <span className="font-extrabold text-amber-400">{r.squad_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. MVP TRACKER */}
            {activeTab === 'mvp' && (
              <div className="space-y-4">
                <div className="border-l-4 border-amber-500 pl-3">
                  <h2 className="text-lg font-black uppercase tracking-wider">Top Eliminator MVP Leaderboard</h2>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto shadow-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                      <tr>
                        <th className="p-3">Rank</th>
                        <th className="p-3">Player IGN</th>
                        <th className="p-3">Squad Name</th>
                        <th className="p-3 text-center">Total Kills</th>
                        <th className="p-3 text-right">Headshot %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {mvpStats.map((item, index) => (
                        <tr key={item.id} className="hover:bg-slate-800/40">
                          <td className="p-3 font-bold">{index === 0 ? '👑 #1 MVP' : `#${index + 1}`}</td>
                          <td className="p-3 font-extrabold text-amber-400">{item.player_ign}</td>
                          <td className="p-3 text-slate-300">{item.squad_name}</td>
                          <td className="p-3 text-center font-bold text-emerald-400">{item.total_kills}</td>
                          <td className="p-3 text-right font-mono text-slate-400">{item.headshot_rate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. RULES & POINT MATRIX */}
            {activeTab === 'rules' && (
              <div className="space-y-6 max-w-3xl mx-auto text-xs">
                <div className="border-l-4 border-amber-500 pl-3">
                  <h2 className="text-lg font-black uppercase tracking-wider">Official Tournament Rules</h2>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-3">
                  <h3 className="font-extrabold text-amber-400 uppercase">Points Distribution</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center font-mono">
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">#1 Booyah: 12 Pts</div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">#2 Place: 9 Pts</div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">#3 Place: 8 Pts</div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">Per Kill: 1 Pt</div>
                  </div>
                </div>
              </div>
            )}

            {/* 7. LEADERBOARD */}
            {activeTab === 'leaderboard' && (
              <div className="space-y-4">
                <div className="border-l-4 border-amber-500 pl-3">
                  <h2 className="text-lg font-black uppercase tracking-wider">Official Tournament Standings</h2>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto shadow-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                      <tr>
                        <th className="p-3">Rank</th>
                        <th className="p-3">Squad Name</th>
                        <th className="p-3 text-center">Booyahs</th>
                        <th className="p-3 text-center">Kills</th>
                        <th className="p-3 text-right">Total Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {leaderboard.map((item, index) => (
                        <tr key={item.id} className="hover:bg-slate-800/40">
                          <td className="p-3 font-bold">{`#${index + 1}`}</td>
                          <td className="p-3 font-extrabold text-amber-400">{item.squad_name}</td>
                          <td className="p-3 text-center text-amber-500 font-bold">{item.booyah_count}</td>
                          <td className="p-3 text-center text-emerald-400">{item.total_kills}</td>
                          <td className="p-3 text-right font-black text-amber-400">{item.total_points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 8. MY REGISTRATIONS & ROOM INFO */}
            {activeTab === 'my-registrations' && (
              <div className="space-y-4 max-w-xl mx-auto text-xs">
                <div className="border-l-4 border-amber-500 pl-3">
                  <h2 className="text-lg font-black uppercase tracking-wider">Check Registration & Room Pass</h2>
                </div>

                <input
                  type="text"
                  placeholder="Enter Registered WhatsApp Number..."
                  value={searchWhatsapp}
                  onChange={(e) => setSearchWhatsapp(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-white focus:outline-none focus:border-amber-500"
                />

                <div className="space-y-3">
                  {registrations.filter((r) => searchWhatsapp && r.whatsapp.includes(searchWhatsapp)).map((reg) => {
                    const match = tournaments.find((t) => t.id === reg.tournament_id);
                    return (
                      <div key={reg.id} className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-amber-400">{reg.squad_name}</span>
                          <span className="text-emerald-400 font-bold px-2 py-0.5 bg-emerald-950/50 rounded border border-emerald-500/30">
                            {reg.status}
                          </span>
                        </div>

                        {reg.status === 'APPROVED' && match?.room_id && (
                          <div className="bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded space-y-1">
                            <p className="font-bold text-emerald-400">Match Room Details:</p>
                            <p className="text-slate-200">Room ID: <span className="font-mono text-amber-400 font-bold">{match.room_id}</span></p>
                            <p className="text-slate-200">Password: <span className="font-mono text-amber-400 font-bold">{match.room_pass}</span></p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 9. PRIZE CLAIMS */}
            {activeTab === 'claims' && (
              <div className="max-w-xl mx-auto space-y-4 text-xs">
                <div className="flex justify-between items-center border-l-4 border-amber-500 pl-3">
                  <h2 className="text-lg font-black uppercase tracking-wider">Prize Money Claim</h2>
                  <button onClick={() => setPrizeClaimModal(true)} className="bg-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded uppercase">
                    Claim Prize
                  </button>
                </div>

                <div className="space-y-2">
                  {prizeClaims.map((c) => (
                    <div key={c.id} className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex justify-between items-center">
                      <div>
                        <div className="font-extrabold text-white">{c.squad_name}</div>
                        <div className="text-slate-400 text-[11px]">{c.account_type}: {c.account_number}</div>
                      </div>
                      <span className="font-black text-emerald-400">৳{c.prize_amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 10. SUPPORT TICKETS */}
            {activeTab === 'support' && (
              <div className="max-w-xl mx-auto space-y-4 text-xs">
                <div className="border-l-4 border-amber-500 pl-3">
                  <h2 className="text-lg font-black uppercase tracking-wider">Dispute Ticket Desk</h2>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  await supabase.from('tickets').insert([ticketForm]);
                  alert('Ticket Submitted!');
                }} className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-3">
                  <input type="text" placeholder="Squad Name *" required value={ticketForm.squad_name} onChange={(e) => setTicketForm({ ...ticketForm, squad_name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-white" />
                  <textarea placeholder="Describe issue or violation proof..." required rows="3" value={ticketForm.issue} onChange={(e) => setTicketForm({ ...ticketForm, issue: e.target.value })} className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-white" />
                  <button type="submit" className="w-full bg-amber-500 text-slate-950 font-bold py-2 rounded uppercase">Submit Ticket</button>
                </form>
              </div>
            )}

            {/* 11. ADMIN PANEL */}
            {activeTab === 'admin' && (
              <div className="space-y-6 text-xs">
                {!adminAuth ? (
                  <form onSubmit={(e) => { e.preventDefault(); adminPasscode === 'admin123' ? setAdminAuth(true) : alert('Wrong Pass'); }} className="max-w-xs mx-auto bg-slate-900 p-5 rounded-lg border border-slate-800 space-y-3">
                    <h3 className="font-bold text-amber-400 text-center uppercase">Admin Access</h3>
                    <input type="password" placeholder="Passcode" value={adminPasscode} onChange={(e) => setAdminPasscode(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-white" />
                    <button type="submit" className="w-full bg-amber-500 text-slate-950 font-bold py-2 rounded uppercase">Login</button>
                  </form>
                ) : (
                  <div className="space-y-6">
                    {/* Admin Actions */}
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-3">
                      <h3 className="font-extrabold text-amber-400 uppercase">Create Tournament</h3>
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        await supabase.from('tournaments').insert([newTournament]);
                        alert('Tournament Created!');
                        fetchData();
                      }} className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <input type="text" placeholder="Title" required value={newTournament.title} onChange={(e) => setNewTournament({ ...newTournament, title: e.target.value })} className="bg-slate-950 border border-slate-800 p-2 rounded text-white" />
                        <input type="text" placeholder="Time" required value={newTournament.display_time} onChange={(e) => setNewTournament({ ...newTournament, display_time: e.target.value })} className="bg-slate-950 border border-slate-800 p-2 rounded text-white" />
                        <input type="text" placeholder="Stream Embed URL" value={newTournament.live_stream_url} onChange={(e) => setNewTournament({ ...newTournament, live_stream_url: e.target.value })} className="bg-slate-950 border border-slate-800 p-2 rounded text-white" />
                        <button type="submit" className="bg-amber-500 text-slate-950 font-bold p-2 rounded uppercase">Publish</button>
                      </form>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-3">
                      <h3 className="font-extrabold text-amber-400 uppercase">Add Bracket Match</h3>
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        await supabase.from('brackets').insert([newBracket]);
                        alert('Bracket Added!');
                        fetchData();
                      }} className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <input type="text" placeholder="Round (e.g. Quarter Final)" required value={newBracket.round_name} onChange={(e) => setNewBracket({ ...newBracket, round_name: e.target.value })} className="bg-slate-950 border border-slate-800 p-2 rounded text-white" />
                        <input type="text" placeholder="Team 1" required value={newBracket.team1_name} onChange={(e) => setNewBracket({ ...newBracket, team1_name: e.target.value })} className="bg-slate-950 border border-slate-800 p-2 rounded text-white" />
                        <input type="text" placeholder="Team 2" required value={newBracket.team2_name} onChange={(e) => setNewBracket({ ...newBracket, team2_name: e.target.value })} className="bg-slate-950 border border-slate-800 p-2 rounded text-white" />
                        <button type="submit" className="bg-amber-500 text-slate-950 font-bold p-2 rounded uppercase">Add Match</button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Official Sponsor Showcase */}
            <div className="pt-8 border-t border-slate-900 text-center space-y-3">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">OFFICIAL TOURNAMENT SPONSORS & PARTNERS</span>
              <div className="flex justify-center items-center gap-6 opacity-40 hover:opacity-100 transition grayscale hover:grayscale-0 text-xs font-black text-slate-400">
                <span>BOOYAH STREAM</span>
                <span>GARENA ESPORTS</span>
                <span>BKASH GAMING</span>
                <span>RED BULL ARENA</span>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Registration Modal */}
      {selectedTournament && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-amber-500/30 max-w-lg w-full p-5 rounded-lg space-y-3 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-amber-400">Register: {selectedTournament.title}</h3>
              <button onClick={() => setSelectedTournament(null)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <input type="text" placeholder="Squad Name *" required value={regForm.squad_name} onChange={(e) => setRegForm({ ...regForm, squad_name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-white" />
              <div className="grid grid-cols-3 gap-2">
                <input type="text" placeholder="Leader IGN *" required value={regForm.leader_ign} onChange={(e) => setRegForm({ ...regForm, leader_ign: e.target.value })} className="bg-slate-950 border border-slate-800 p-2 rounded text-white" />
                <input type="text" placeholder="Leader UID *" required value={regForm.leader_uid} onChange={(e) => setRegForm({ ...regForm, leader_uid: e.target.value })} className="bg-slate-950 border border-slate-800 p-2 rounded text-white" />
                <select value={regForm.leader_role} onChange={(e) => setRegForm({ ...regForm, leader_role: e.target.value })} className="bg-slate-950 border border-slate-800 p-2 rounded text-white">
                  <option value="IGL">Role: IGL</option>
                  <option value="Rusher">Role: Rusher</option>
                  <option value="Sniper">Role: Sniper</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="WhatsApp Number *" required value={regForm.whatsapp} onChange={(e) => setRegForm({ ...regForm, whatsapp: e.target.value })} className="bg-slate-950 border border-slate-800 p-2 rounded text-white" />
                <input type="text" placeholder="TrxID (Payement)" value={regForm.trx_id} onChange={(e) => setRegForm({ ...regForm, trx_id: e.target.value })} className="bg-slate-950 border border-slate-800 p-2 rounded text-white" />
              </div>
              <button type="submit" className="w-full bg-amber-500 text-slate-950 font-bold py-2 rounded uppercase">Confirm Squad Registration</button>
            </form>
          </div>
        </div>
      )}

      {/* Prize Claim Modal */}
      {prizeClaimModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 max-w-sm w-full p-4 rounded-lg space-y-3 text-xs">
            <h3 className="font-bold text-amber-400 uppercase">Prize Money Claim Request</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await supabase.from('prize_claims').insert([claimForm]);
              alert('Claim Request Sent!');
              setPrizeClaimModal(false);
              fetchData();
            }} className="space-y-2">
              <input type="text" placeholder="Squad Name" required value={claimForm.squad_name} onChange={(e) => setClaimForm({ ...claimForm, squad_name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-white" />
              <input type="text" placeholder="Leader UID" required value={claimForm.leader_uid} onChange={(e) => setClaimForm({ ...claimForm, leader_uid: e.target.value })} className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-white" />
              <input type="text" placeholder="Account Number (bKash/Nagad)" required value={claimForm.account_number} onChange={(e) => setClaimForm({ ...claimForm, account_number: e.target.value })} className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-white" />
              <input type="number" placeholder="Claim Amount (৳)" required value={claimForm.prize_amount} onChange={(e) => setClaimForm({ ...claimForm, prize_amount: e.target.value })} className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-white" />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-amber-500 text-slate-950 font-bold py-2 rounded uppercase">Submit Claim</button>
                <button type="button" onClick={() => setPrizeClaimModal(false)} className="bg-slate-800 text-slate-400 px-3 py-2 rounded">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
