/* =====================================================================
 *  BOOYAH ARENA — Official Free Fire Esports & Tournament Platform
 *  Drop-in replacement for src/App.jsx
 *  React 18 + Tailwind CSS 3 + lucide-react + Supabase
 *
 *  Requires:
 *   • src/supabaseClient.js exporting `supabase` (createClient(url, anonKey))
 *   • schema.sql executed in Supabase + "Anonymous sign-ins" enabled
 *   • Admin PIN lives in the database (default 1234 — change it, see
 *     schema.sql header). It is verified server-side by admin_login().
 * ===================================================================== */
import React, {
  useState, useEffect, useMemo, useCallback, useRef, createContext, useContext,
} from 'react';
import { supabase } from './supabaseClient';
import {
  Trophy, ShieldCheck, Crosshair, Users, Key, Gamepad2, PlusCircle, CheckCircle2, Clock,
  AlertTriangle, Settings, Award, BookOpen, Flame, Lock, Unlock, RefreshCw, Copy, Eye, EyeOff,
  X, Search, Upload, MessageCircle, Send, Radio, Pause, Play, Ban, Trash2, Pencil,
  ChevronRight, ChevronLeft, Megaphone, Calculator, Wallet, Swords, Skull, Medal, LogOut, Info,
  Check, Zap, Map as MapIcon, Crown, Smartphone, Headphones, Shield, ExternalLink, Image as ImageIcon,
} from 'lucide-react';

/* ───────────────────────── CONFIG ───────────────────────── */

const MAPS = ['Bermuda', 'Kalahari', 'Purgatory', 'Alpine', 'Nexterra'];
const MODES = ['SOLO', 'DUO', 'SQUAD'];
const MODE_SIZE = { SOLO: 1, DUO: 2, SQUAD: 4 };
const T_STATUSES = ['UPCOMING', 'LIVE', 'COMPLETED', 'PAUSED', 'CANCELLED'];
const ROOM_WINDOW_MIN = 15;
const MAX_PROOF_BYTES = 3 * 1024 * 1024;
const DEFAULT_POINTS = { kill: 1, placement: [12, 9, 8, 7, 6, 5, 4, 3, 2, 1] };
const DEFAULT_PAYMENT = { bkash: '', nagad: '', rocket: '' };
const DEFAULT_SUPPORT = { whatsapp: '', telegram: '' };
const METHODS = [
  { id: 'BKASH', key: 'bkash', label: 'bKash', color: '#E2136E' },
  { id: 'NAGAD', key: 'nagad', label: 'Nagad', color: '#F6921E' },
  { id: 'ROCKET', key: 'rocket', label: 'Rocket', color: '#A855F7' },
];
const MAP_ART = {
  Bermuda: ['#0b2e24', '#1f8a62'], Kalahari: ['#4a2e0c', '#d49a35'], Purgatory: ['#33080f', '#c2334a'],
  Alpine: ['#0d2342', '#62b0e0'], Nexterra: ['#24104a', '#8b5cf6'],
};
const NAV = [
  { id: 'lobby', label: 'Lobby', icon: Gamepad2 },
  { id: 'slots', label: 'My Slots', icon: Key },
  { id: 'standings', label: 'Standings', icon: Award },
  { id: 'support', label: 'Rules', icon: BookOpen },
];

/* ───────────────────────── HELPERS ───────────────────────── */

const cn = (...a) => a.filter(Boolean).join(' ');
const pad2 = (n) => String(n).padStart(2, '0');
const money = (n) => `৳${Number(n || 0).toLocaleString('en-US')}`;
const errMsg = (e) => (e && (e.message || e.error_description)) || 'Something went wrong. Please try again.';
const uuid = () => (typeof crypto !== 'undefined' && crypto.randomUUID
  ? crypto.randomUUID() : 'x' + Math.random().toString(36).slice(2) + Date.now().toString(36));

const fmtDT = (iso) => {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
    }).format(new Date(iso));
  } catch { return '—'; }
};
const toLocalInput = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
const fmtCountdown = (ms) => {
  if (ms <= 0) return '00:00:00';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${d ? `${d}d ` : ''}${pad2(h)}:${pad2(m)}:${pad2(sec)}`;
};

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy'); document.body.removeChild(ta); return ok;
    } catch { return false; }
  }
}

/** placement + kill points for one squad */
function calcPoints(placement, kills, points) {
  const p = points || DEFAULT_POINTS;
  const pl = Number(placement), k = Math.max(0, Number(kills) || 0);
  const placementPts = pl >= 1 ? Number(p.placement?.[pl - 1] ?? 0) : 0;
  const killPts = k * Number(p.kill ?? 1);
  return { placementPts, killPts, total: placementPts + killPts };
}

function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(i); }, [ms]);
  return now;
}

const safeStore = {
  get: (k) => { try { return sessionStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { sessionStorage.setItem(k, v); } catch { /* storage unavailable */ } },
  del: (k) => { try { sessionStorage.removeItem(k); } catch { /* storage unavailable */ } },
};

/* ───────────────────────── TOASTS ───────────────────────── */

const ToastCtx = createContext(null);
const useToast = () => useContext(ToastCtx);

function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((type, msg) => {
    const id = uuid();
    setItems((s) => [...s.slice(-3), { id, type, msg }]);
    setTimeout(() => setItems((s) => s.filter((i) => i.id !== id)), type === 'error' ? 6500 : 3800);
  }, []);
  const api = useMemo(() => ({
    success: (m) => push('success', m), error: (m) => push('error', m), info: (m) => push('info', m),
  }), [push]);
  const tone = {
    success: ['border-[#10B981]/40', 'text-[#10B981]', CheckCircle2],
    error: ['border-[#EF4444]/40', 'text-[#EF4444]', AlertTriangle],
    info: ['border-[#FFB800]/40', 'text-[#FFB800]', Info],
  };
  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="fixed z-[120] top-3 inset-x-3 sm:inset-x-auto sm:right-4 sm:w-96 space-y-2 pointer-events-none" aria-live="polite">
        {items.map((t) => {
          const [b, c, Icon] = tone[t.type];
          return (
            <div key={t.id} className={cn('pointer-events-auto flex gap-3 items-start rounded-xl border bg-[#0B0F17]/95 backdrop-blur-xl px-4 py-3 shadow-2xl anim-toast', b)}>
              <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', c)} />
              <p className="text-sm text-white/90 leading-snug flex-1">{t.msg}</p>
              <button aria-label="Dismiss" onClick={() => setItems((s) => s.filter((i) => i.id !== t.id))} className="text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

/* ───────────────────────── GLOBAL STYLE ───────────────────────── */

function GlobalStyle() {
  useEffect(() => {
    const id = 'ba-fonts';
    if (document.getElementById(id)) return;
    const l = document.createElement('link');
    l.id = id; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Exo+2:wght@400;500;600;700;800&family=Teko:wght@500;600;700&display=swap';
    document.head.appendChild(l);
  }, []);
  return (
    <style>{`
      .font-display{font-family:'Teko','Arial Narrow',sans-serif;letter-spacing:.04em}
      .ba-root{font-family:'Exo 2',system-ui,-apple-system,'Segoe UI',sans-serif}
      .cyber-grid{background-image:linear-gradient(rgba(255,184,0,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,184,0,.045) 1px,transparent 1px);background-size:46px 46px}
      @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
      .anim-marquee{animation:marquee 45s linear infinite}
      .anim-marquee:hover{animation-play-state:paused}
      @keyframes stripes{from{background-position:0 0}to{background-position:28px 0}}
      .bar-stripes{background-image:linear-gradient(45deg,rgba(255,255,255,.2) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.2) 50%,rgba(255,255,255,.2) 75%,transparent 75%);background-size:28px 28px;animation:stripes 1.2s linear infinite}
      @keyframes ping2{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.55)}50%{box-shadow:0 0 0 7px rgba(16,185,129,0)}}
      .live-dot{animation:ping2 1.6s ease-in-out infinite}
      @keyframes toastIn{from{opacity:0;transform:translateY(-10px) scale(.98)}to{opacity:1;transform:none}}
      .anim-toast{animation:toastIn .22s ease-out}
      @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
      .anim-up{animation:fadeUp .35s ease-out both}
      @keyframes sheen{0%{transform:translateX(-120%)}100%{transform:translateX(220%)}}
      .sheen::after{content:'';position:absolute;inset:0;width:40%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.18),transparent);animation:sheen 3.2s ease-in-out infinite}
      .no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{scrollbar-width:none}
      @media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
    `}</style>
  );
}

/* ───────────────────────── UI PRIMITIVES ───────────────────────── */

const inputCls = 'w-full rounded-xl bg-[#07090E]/80 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#FFB800]/70 focus:ring-2 focus:ring-[#FFB800]/20 transition disabled:opacity-50';
const labelCls = 'block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-1.5';

function Glass({ className, children, ...p }) {
  return (
    <div className={cn('rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,.35)]', className)} {...p}>
      {children}
    </div>
  );
}

const TONES = {
  gold: 'bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/30',
  emerald: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30',
  crimson: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30',
  orange: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  gray: 'bg-white/5 text-white/60 border-white/10',
  blue: 'bg-sky-500/10 text-sky-300 border-sky-400/30',
};

function Badge({ tone = 'gold', children, className, dot }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider', TONES[tone], className)}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full bg-current', dot === 'pulse' && 'live-dot')} />}
      {children}
    </span>
  );
}

const STATUS_TONE = {
  UPCOMING: 'gold', LIVE: 'emerald', COMPLETED: 'gray', PAUSED: 'orange', CANCELLED: 'crimson',
  PENDING: 'gold', APPROVED: 'emerald', REJECTED: 'crimson',
};
function StatusBadge({ status }) {
  return <Badge tone={STATUS_TONE[status] || 'gray'} dot={status === 'LIVE' ? 'pulse' : true}>{status}</Badge>;
}

const BTN_BASE = 'inline-flex items-center justify-center gap-2 rounded-xl font-bold uppercase tracking-wider transition active:scale-[.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 whitespace-nowrap';
const BTN_VARIANT = {
  gold: 'bg-gradient-to-r from-[#FFB800] to-[#FFD24D] text-black hover:brightness-110 shadow-[0_0_24px_rgba(255,184,0,.25)]',
  emerald: 'bg-[#10B981] text-black hover:bg-[#34D399]',
  crimson: 'bg-[#EF4444] text-white hover:bg-[#F87171]',
  ghost: 'bg-white/5 text-white/80 hover:bg-white/10 border border-white/10',
  outline: 'border border-[#FFB800]/40 text-[#FFB800] hover:bg-[#FFB800]/10',
};
const BTN_SIZE = { sm: 'px-3 py-1.5 text-[11px]', md: 'px-5 py-2.5 text-xs', lg: 'px-6 py-3.5 text-sm' };

function Button({ variant = 'gold', size = 'md', loading, className, children, disabled, type = 'button', ...p }) {
  return (
    <button type={type} disabled={disabled || loading} className={cn(BTN_BASE, BTN_VARIANT[variant], BTN_SIZE[size], className)} {...p}>
      {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

function Field({ label, hint, children, className }) {
  return (
    <label className={cn('block', className)}>
      {label && <span className={labelCls}>{label}</span>}
      {children}
      {hint && <span className="block mt-1 text-[11px] text-white/35">{hint}</span>}
    </label>
  );
}

function Switch({ checked, onChange, label, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn('relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition disabled:opacity-50',
        checked ? 'bg-[#10B981]/25 border-[#10B981]/60' : 'bg-white/5 border-white/15')}>
      <span className={cn('inline-block h-5 w-5 rounded-full transition-transform', checked ? 'translate-x-6 bg-[#10B981]' : 'translate-x-1 bg-white/50')} />
    </button>
  );
}

function Modal({ open, onClose, title, subtitle, children, wide, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative w-full max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-[#FFB800]/25 bg-[#0B0F17]/95 shadow-[0_0_60px_rgba(255,184,0,.12)] anim-up', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}>
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
          <div className="min-w-0">
            <h2 className="font-display text-3xl text-[#FFB800] leading-none truncate">{title}</h2>
            {subtitle && <p className="text-xs text-white/50 mt-1">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-white/50 hover:text-white hover:bg-white/10"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto px-5 pb-5 flex-1">{children}</div>
        {footer && <div className="border-t border-white/10 p-4">{footer}</div>}
      </div>
    </div>
  );
}

function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', tone = 'crimson', note, busy, onConfirm, onClose }) {
  const [text, setText] = useState('');
  useEffect(() => { if (open) setText(''); }, [open]);
  return (
    <Modal open={open} onClose={busy ? undefined : onClose} title={title}
      footer={(
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant={tone} loading={busy} onClick={() => onConfirm(text)}>{confirmLabel}</Button>
        </div>
      )}>
      <p className="text-sm text-white/70 leading-relaxed">{message}</p>
      {note && (
        <Field label="Note to player (optional)" className="mt-4">
          <textarea className={cn(inputCls, 'h-20 resize-none')} maxLength={200} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. TrxID not found in our statement" />
        </Field>
      )}
    </Modal>
  );
}

function SlotBar({ filled, total }) {
  const pct = total ? Math.min(100, Math.round((filled / total) * 100)) : 0;
  const hot = pct >= 90, warm = pct >= 70;
  const left = total - filled;
  return (
    <div>
      <div className="flex justify-between text-[11px] font-semibold mb-1.5">
        <span className="text-white/50 uppercase tracking-wider">Slots filled</span>
        <span className={hot ? 'text-[#EF4444]' : warm ? 'text-[#FFB800]' : 'text-[#10B981]'}>
          {filled}/{total}{left > 0 && left <= 3 ? ` · only ${left} left` : ''}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-white/10 overflow-hidden" role="progressbar" aria-valuenow={filled} aria-valuemin={0} aria-valuemax={total}>
        <div className={cn('h-full rounded-full transition-all duration-700 bar-stripes', hot ? 'bg-[#EF4444]' : warm ? 'bg-[#FFB800]' : 'bg-[#10B981]')} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MapArt({ map, url, className }) {
  const [bad, setBad] = useState(false);
  useEffect(() => setBad(false), [url]);
  const [a, b] = MAP_ART[map] || ['#111827', '#374151'];
  return (
    <div className={cn('relative overflow-hidden', className)} style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>
      <div className="absolute inset-0 cyber-grid opacity-60" />
      <span className="absolute -right-2 -bottom-6 font-display text-8xl uppercase text-white/10 select-none leading-none">{map}</span>
      {url && !bad && <img src={url} alt={`${map} map`} loading="lazy" onError={() => setBad(true)} className="absolute inset-0 w-full h-full object-cover" />}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F17] via-[#0B0F17]/30 to-transparent" />
    </div>
  );
}

function Empty({ icon: Icon, title, children }) {
  return (
    <Glass className="p-10 text-center">
      <Icon className="w-10 h-10 mx-auto text-white/25 mb-3" />
      <p className="font-display text-2xl text-white/80">{title}</p>
      {children && <p className="text-sm text-white/45 mt-1 max-w-md mx-auto">{children}</p>}
    </Glass>
  );
}

function SectionTitle({ icon: Icon, children, right }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3 mb-5">
      <h2 className="font-display text-3xl sm:text-4xl text-white flex items-center gap-2.5 leading-none">
        <Icon className="w-6 h-6 text-[#FFB800]" />{children}
      </h2>
      {right}
    </div>
  );
}

function Countdown({ to, prefix }) {
  const now = useNow(1000);
  const ms = new Date(to).getTime() - now;
  return <span className="tabular-nums">{prefix}{fmtCountdown(ms)}</span>;
}

function CopyButton({ value, label = 'Copy', size = 'sm', variant = 'ghost' }) {
  const toast = useToast();
  const [done, setDone] = useState(false);
  const onClick = async () => {
    const ok = await copyText(value);
    if (ok) { setDone(true); toast.success('Copied to clipboard'); setTimeout(() => setDone(false), 1800); }
    else toast.error('Copy failed — select and copy manually.');
  };
  return (
    <Button variant={variant} size={size} onClick={onClick} aria-label={`Copy ${label}`}>
      {done ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}{done ? 'Copied' : label}
    </Button>
  );
}

/* ───────────────────────── MATCH LOBBY ───────────────────────── */

const STATUS_RANK = { LIVE: 0, UPCOMING: 1, PAUSED: 2, COMPLETED: 3, CANCELLED: 4 };

function ChipGroup({ label, options, value, onChange }) {
  return (
    <div className="min-w-0">
      <p className={labelCls}>{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const v = typeof o === 'string' ? o : o.value;
          const l = typeof o === 'string' ? o : o.label;
          const on = value === v;
          return (
            <button key={v} onClick={() => onChange(v)} aria-pressed={on}
              className={cn('rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border transition',
                on ? 'bg-[#FFB800] text-black border-[#FFB800] shadow-[0_0_16px_rgba(255,184,0,.3)]' : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10')}>
              {l}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MatchCard({ t, reg, onJoin }) {
  const now = useNow(15000);
  const start = new Date(t.start_time).getTime();
  const full = t.filled_slots >= t.total_slots;
  const registered = reg && reg.status !== 'REJECTED';
  let btn;
  if (registered) btn = { label: `Registered · ${reg.status}`, disabled: true, variant: 'ghost' };
  else if (t.status === 'LIVE') btn = { label: 'Live now', disabled: true, variant: 'ghost' };
  else if (t.status !== 'UPCOMING') btn = { label: t.status === 'PAUSED' ? 'Paused' : t.status === 'CANCELLED' ? 'Cancelled' : 'Completed', disabled: true, variant: 'ghost' };
  else if (start <= now) btn = { label: 'Started', disabled: true, variant: 'ghost' };
  else if (full) btn = { label: 'Slots full', disabled: true, variant: 'ghost' };
  else btn = { label: t.entry_fee > 0 ? `Join · ${money(t.entry_fee)}` : 'Join free', disabled: false, variant: 'gold' };
  const dim = t.status === 'CANCELLED' || t.status === 'COMPLETED';

  return (
    <Glass className={cn('overflow-hidden flex flex-col transition duration-300 hover:border-[#FFB800]/40 hover:shadow-[0_0_40px_rgba(255,184,0,.10)] anim-up', dim && 'opacity-70')}>
      <div className="relative h-36">
        <MapArt map={t.map} url={t.map_image_url} className="absolute inset-0" />
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="font-display text-xl leading-none bg-[#FFB800] text-black px-2.5 pt-1 pb-0.5 rounded-md">{t.mode}</span>
          <StatusBadge status={t.status} />
        </div>
        <div className="absolute bottom-2.5 left-4 right-4">
          <h3 className="font-display text-3xl text-white leading-none uppercase truncate drop-shadow">{t.title}</h3>
          <p className="text-[11px] text-white/60 mt-0.5 flex items-center gap-1"><MapIcon className="w-3 h-3" />{t.map}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 p-4 pb-3">
        {[
          { icon: Trophy, c: 'text-[#FFB800]', l: 'Prize pool', v: money(t.prize_pool) },
          { icon: Crosshair, c: 'text-[#EF4444]', l: 'Per kill', v: money(t.per_kill_reward) },
          { icon: Wallet, c: 'text-[#10B981]', l: 'Entry', v: t.entry_fee > 0 ? money(t.entry_fee) : 'FREE' },
        ].map(({ icon: I, c, l, v }) => (
          <div key={l} className="rounded-xl bg-[#07090E]/60 border border-white/5 p-2.5">
            <I className={cn('w-4 h-4 mb-1', c)} />
            <p className="text-[9px] uppercase tracking-wider text-white/40 font-semibold">{l}</p>
            <p className={cn('font-display text-2xl leading-none mt-0.5', c)}>{v}</p>
          </div>
        ))}
      </div>

      <div className="px-4 pb-4 mt-auto space-y-3">
        <SlotBar filled={t.filled_slots} total={t.total_slots} />
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] text-white/55 min-w-0">
            <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#FFB800]" />{fmtDT(t.start_time)}</p>
            {t.status === 'UPCOMING' && start > now && (
              <p className="text-[#10B981] font-semibold mt-0.5"><Countdown to={t.start_time} prefix="Starts in " /></p>
            )}
          </div>
          <Button variant={btn.variant} disabled={btn.disabled} onClick={() => onJoin(t)} className="shrink-0">{btn.label}</Button>
        </div>
      </div>
    </Glass>
  );
}

function Lobby({ tournaments, loading, regByTournament, onJoin, onRefresh }) {
  const [mode, setMode] = useState('ALL');
  const [map, setMap] = useState('ALL');
  const [fee, setFee] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const filtered = useMemo(() => {
    return tournaments
      .filter((t) => (mode === 'ALL' || t.mode === mode)
        && (map === 'ALL' || t.map === map)
        && (fee === 'ALL' || (fee === 'FREE' ? t.entry_fee === 0 : t.entry_fee > 0))
        && (status === 'ALL' || t.status === status))
      .sort((a, b) => (STATUS_RANK[a.status] - STATUS_RANK[b.status])
        || (a.status === 'COMPLETED' ? new Date(b.start_time) - new Date(a.start_time) : new Date(a.start_time) - new Date(b.start_time)));
  }, [tournaments, mode, map, fee, status]);
  const dirty = mode !== 'ALL' || map !== 'ALL' || fee !== 'ALL' || status !== 'ALL';

  return (
    <div>
      <SectionTitle icon={Gamepad2} right={(
        <button onClick={onRefresh} className="text-xs text-[#FFB800] flex items-center gap-1.5 hover:underline"><RefreshCw className="w-3.5 h-3.5" />Refresh</button>
      )}>MATCH LOBBY</SectionTitle>

      <Glass className="p-4 mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ChipGroup label="Mode" value={mode} onChange={setMode} options={['ALL', ...MODES]} />
        <ChipGroup label="Entry" value={fee} onChange={setFee} options={[{ value: 'ALL', label: 'ALL' }, { value: 'FREE', label: 'FREE' }, { value: 'PAID', label: 'PAID' }]} />
        <ChipGroup label="Status" value={status} onChange={setStatus} options={[{ value: 'ALL', label: 'ALL' }, { value: 'UPCOMING', label: 'UPCOMING' }, { value: 'LIVE', label: 'LIVE' }, { value: 'COMPLETED', label: 'COMPLETED' }]} />
        <ChipGroup label="Map" value={map} onChange={setMap} options={['ALL', ...MAPS]} />
        {dirty && (
          <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-between text-xs text-white/50">
            <span>{filtered.length} match{filtered.length === 1 ? '' : 'es'} found</span>
            <button className="text-[#FFB800] hover:underline" onClick={() => { setMode('ALL'); setMap('ALL'); setFee('ALL'); setStatus('ALL'); }}>Clear filters</button>
          </div>
        )}
      </Glass>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-[26rem] rounded-2xl bg-white/[0.04] animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Empty icon={Gamepad2} title="No matches found">
          {dirty ? 'Try loosening your filters.' : 'No tournaments are scheduled yet — check back soon.'}
        </Empty>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => <MatchCard key={t.id} t={t} reg={regByTournament[t.id]} onJoin={onJoin} />)}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── REGISTRATION MODAL ───────────────────────── */

const UID_LABELS = ['Player 1 (Leader) UID', 'Player 2 UID', 'Player 3 UID', 'Player 4 UID', 'Substitute UID (optional)'];
const UID_SHOWN = { SOLO: [0], DUO: [0, 1, 4], SQUAD: [0, 1, 2, 3, 4] };

function Stepper({ steps, step }) {
  return (
    <ol className="flex items-center gap-2 mb-5">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-2 flex-1 last:flex-none">
          <span className={cn('w-7 h-7 rounded-full grid place-items-center text-xs font-bold border',
            i < step ? 'bg-[#10B981] border-[#10B981] text-black' : i === step ? 'bg-[#FFB800] border-[#FFB800] text-black' : 'border-white/15 text-white/40')}>
            {i < step ? <Check className="w-4 h-4" /> : i + 1}
          </span>
          <span className={cn('text-[11px] font-bold uppercase tracking-wider', i === step ? 'text-white' : 'text-white/40')}>{s}</span>
          {i < steps.length - 1 && <span className={cn('h-px flex-1', i < step ? 'bg-[#10B981]/60' : 'bg-white/10')} />}
        </li>
      ))}
    </ol>
  );
}

function RegisterModal({ t, settings, userId, onClose, onDone }) {
  const toast = useToast();
  const paid = t.entry_fee > 0;
  const steps = paid ? ['Squad', 'Payment', 'Review'] : ['Squad', 'Review'];
  const methods = METHODS.filter((m) => settings.payment?.[m.key]);
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ squad: '', ign: '', uids: ['', '', '', '', ''], whatsapp: '', method: methods[0]?.id || '', trx: '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const need = MODE_SIZE[t.mode];
  const shown = UID_SHOWN[t.mode];
  const method = METHODS.find((m) => m.id === f.method);
  const number = method ? settings.payment?.[method.key] : '';

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const setUid = (i, v) => setF((s) => ({ ...s, uids: s.uids.map((u, j) => (j === i ? v.replace(/\D/g, '') : u)) }));

  const validateTeam = () => {
    if (t.mode !== 'SOLO' && f.squad.trim().length < 2) return 'Enter a squad name (at least 2 characters).';
    if (f.ign.trim().length < 2) return 'Enter your in-game name (IGN).';
    const seen = [];
    for (const i of shown) {
      const v = f.uids[i].trim();
      if (!v) { if (i === 4) continue; return `${UID_LABELS[i].replace(' UID', '')} UID is required.`; }
      if (!/^\d{6,15}$/.test(v)) return `${UID_LABELS[i].replace(' (optional)', '')} must be 6–15 digits.`;
      if (seen.includes(v)) return 'Each player must have a different UID.';
      seen.push(v);
    }
    if (!/^\+?\d{10,15}$/.test(f.whatsapp.replace(/[\s-]/g, ''))) return 'Enter a valid WhatsApp number (e.g. 017XXXXXXXX).';
    return '';
  };
  const validatePay = () => {
    if (!methods.length) return 'Payment numbers are not configured yet. Please contact support.';
    if (!f.method) return 'Choose a payment method.';
    if (!/^[A-Za-z0-9]{6,30}$/.test(f.trx.trim())) return 'Enter the TrxID from your payment SMS (6–30 letters/digits).';
    return '';
  };

  const next = () => {
    const err = steps[step] === 'Squad' ? validateTeam() : steps[step] === 'Payment' ? validatePay() : '';
    setError(err);
    if (!err) setStep((s) => s + 1);
  };

  const pickFile = (e) => {
    const file0 = e.target.files?.[0];
    e.target.value = '';
    if (!file0) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file0.type)) { toast.error('Screenshot must be a JPG, PNG or WEBP image.'); return; }
    if (file0.size > MAX_PROOF_BYTES) { toast.error('Screenshot is too large (max 3 MB).'); return; }
    setFile(file0);
    setPreview(URL.createObjectURL(file0));
  };

  const submit = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      let shot = null;
      if (paid && file) {
        const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
        const path = `${userId || 'anon'}/${uuid()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('payment-proofs').upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw new Error(`Screenshot upload failed: ${upErr.message}`);
        shot = supabase.storage.from('payment-proofs').getPublicUrl(path).data.publicUrl;
      }
      const u = f.uids.map((x) => x.trim() || null);
      const { data, error: e } = await supabase.rpc('register_squad', {
        p_tournament: t.id,
        p_squad_name: t.mode === 'SOLO' ? f.ign.trim() : f.squad.trim(),
        p_ign: f.ign.trim(),
        p_p1: u[0], p_p2: t.mode === 'SOLO' ? null : u[1], p_p3: t.mode === 'SQUAD' ? u[2] : null,
        p_p4: t.mode === 'SQUAD' ? u[3] : null, p_sub: t.mode === 'SOLO' ? null : u[4],
        p_whatsapp: f.whatsapp.trim(),
        p_method: paid ? f.method : null, p_trx: paid ? f.trx.trim() : null, p_screenshot: shot,
      });
      if (e) throw e;
      toast.success(paid ? 'Registration submitted! An admin will verify your payment shortly.' : 'Slot booked — you are in!');
      onDone(data);
    } catch (e) {
      const m = errMsg(e); setError(m); toast.error(m);
    } finally { setBusy(false); }
  };

  const cur = steps[step];
  const perPlayer = need > 1 ? t.entry_fee / need : t.entry_fee;

  return (
    <Modal open onClose={busy ? undefined : onClose} title="REGISTER SLOT" subtitle={`${t.title} · ${t.mode} · ${t.map} · ${fmtDT(t.start_time)}`}
      footer={(
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" disabled={busy} onClick={step === 0 ? onClose : () => { setError(''); setStep((s) => s - 1); }}>
            {step === 0 ? 'Cancel' : <><ChevronLeft className="w-4 h-4" />Back</>}
          </Button>
          {cur === 'Review'
            ? <Button loading={busy} onClick={submit}><ShieldCheck className="w-4 h-4" />{paid ? `Submit · ${money(t.entry_fee)}` : 'Confirm free slot'}</Button>
            : <Button onClick={next}>Next<ChevronRight className="w-4 h-4" /></Button>}
        </div>
      )}>
      <Stepper steps={steps} step={step} />
      {error && (
        <div role="alert" className="mb-4 flex gap-2 items-start rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 px-3 py-2.5 text-xs text-[#fca5a5]">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />{error}
        </div>
      )}

      {cur === 'Squad' && (
        <div className="space-y-3.5">
          {t.mode !== 'SOLO' && (
            <Field label="Squad name"><input className={inputCls} maxLength={40} value={f.squad} onChange={(e) => setF({ ...f, squad: e.target.value })} placeholder="e.g. VIP ESPORTS" /></Field>
          )}
          <Field label="In-game name (IGN)"><input className={inputCls} maxLength={40} value={f.ign} onChange={(e) => setF({ ...f, ign: e.target.value })} placeholder="Your Free Fire nickname" /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {shown.map((i) => (
              <Field key={i} label={UID_LABELS[i]}>
                <input className={inputCls} inputMode="numeric" maxLength={15} value={f.uids[i]} onChange={(e) => setUid(i, e.target.value)} placeholder="Free Fire UID" />
              </Field>
            ))}
          </div>
          <Field label="WhatsApp number" hint="Used by admins to contact the squad leader about room details."><input className={inputCls} inputMode="tel" value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} placeholder="017XXXXXXXX" /></Field>
        </div>
      )}

      {cur === 'Payment' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#FFB800]/30 bg-[#FFB800]/5 p-4 flex items-end justify-between gap-4">
            <div>
              <p className={labelCls}>Entry fee payable</p>
              <p className="font-display text-5xl text-[#FFB800] leading-none">{money(t.entry_fee)}</p>
            </div>
            <p className="text-[11px] text-white/50 text-right">
              One payment per {t.mode.toLowerCase()}
              {need > 1 && <><br />= {money(Math.round(perPlayer * 100) / 100)} × {need} players</>}
            </p>
          </div>

          {methods.length === 0 ? (
            <p className="text-sm text-[#EF4444]">No payment numbers are configured. Please contact support.</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                {methods.map((m) => (
                  <button key={m.id} onClick={() => setF({ ...f, method: m.id })} aria-pressed={f.method === m.id}
                    className={cn('rounded-xl border py-2.5 text-sm font-bold transition', f.method === m.id ? 'bg-white/10 text-white' : 'border-white/10 text-white/50 hover:text-white')}
                    style={f.method === m.id ? { borderColor: m.color, boxShadow: `0 0 18px ${m.color}44` } : undefined}>
                    {m.label}
                  </button>
                ))}
              </div>
              <div className="rounded-xl bg-[#07090E] border border-white/10 p-4">
                <p className={labelCls}>Send Money to this {method?.label} (personal) number</p>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-2xl font-bold text-[#FFB800] tracking-wider">{number}</p>
                  <CopyButton value={number} label="Number" />
                </div>
                <ol className="mt-4 space-y-1.5 text-xs text-white/60 list-decimal list-inside leading-relaxed">
                  <li>Open the <b className="text-white/80">{method?.label}</b> app and choose <b className="text-white/80">Send Money</b>.</li>
                  <li>Enter the number above and the exact amount <b className="text-[#FFB800]">{money(t.entry_fee)}</b>.</li>
                  <li>Complete the payment and copy the <b className="text-white/80">TrxID</b> from the confirmation SMS.</li>
                  <li>Paste the TrxID below and attach a screenshot for faster approval.</li>
                </ol>
              </div>
              <Field label="TrxID / Transaction ID">
                <input className={cn(inputCls, 'font-mono uppercase')} maxLength={30} value={f.trx} onChange={(e) => setF({ ...f, trx: e.target.value.replace(/[^A-Za-z0-9]/g, '') })} placeholder="e.g. 9H7K3L2M1N" />
              </Field>
              <div>
                <span className={labelCls}>Payment screenshot (recommended)</span>
                {preview ? (
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 p-2.5">
                    <img src={preview} alt="Payment proof preview" className="w-16 h-16 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0 text-xs"><p className="truncate text-white/80">{file?.name}</p><p className="text-white/40">{Math.round((file?.size || 0) / 1024)} KB</p></div>
                    <Button variant="ghost" size="sm" onClick={() => { setFile(null); setPreview(''); }}><Trash2 className="w-3.5 h-3.5" />Remove</Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/20 hover:border-[#FFB800]/60 hover:bg-[#FFB800]/5 transition cursor-pointer py-6 text-xs text-white/50">
                    <Upload className="w-5 h-5 text-[#FFB800]" />Tap to upload · JPG / PNG / WEBP · max 3 MB
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={pickFile} />
                  </label>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {cur === 'Review' && (
        <div className="space-y-3 text-sm">
          <dl className="rounded-xl border border-white/10 divide-y divide-white/5 overflow-hidden">
            {[
              ['Match', `${t.title} (${t.mode})`],
              ['Squad', t.mode === 'SOLO' ? f.ign : f.squad],
              ['IGN', f.ign],
              ...shown.filter((i) => f.uids[i]).map((i) => [UID_LABELS[i].replace(' UID', '').replace(' (optional)', ''), f.uids[i]]),
              ['WhatsApp', f.whatsapp],
              ...(paid ? [['Payment', `${method?.label} · TrxID ${f.trx.toUpperCase()}`], ['Amount', money(t.entry_fee)], ['Screenshot', file ? file.name : 'Not attached']] : [['Entry', 'FREE']]),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-4 py-2.5">
                <dt className="text-white/45 text-xs uppercase tracking-wider">{k}</dt>
                <dd className="text-white font-semibold text-right break-all">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="text-[11px] text-white/45 leading-relaxed">
            {paid ? 'Your slot stays PENDING until an admin verifies the TrxID. Wrong or reused TrxIDs are rejected and the slot is released.' : 'Free slots are confirmed instantly.'}
          </p>
        </div>
      )}
    </Modal>
  );
}

/* ───────────────────────── PLAYER DASHBOARD ───────────────────────── */

function RoomPanel({ reg, t, room }) {
  const now = useNow(1000);
  const [show, setShow] = useState(false);
  const unlockAt = new Date(t.start_time).getTime() - ROOM_WINDOW_MIN * 60000;
  const box = 'rounded-xl border p-4 text-xs';

  if (reg.status === 'PENDING') {
    return <div className={cn(box, 'border-[#FFB800]/30 bg-[#FFB800]/5 text-[#FFB800]')}><p className="flex items-center gap-2 font-semibold"><Clock className="w-4 h-4 shrink-0" />Waiting for admin to verify your payment (TrxID {reg.trx_id || '—'}).</p></div>;
  }
  if (reg.status === 'REJECTED') {
    return (
      <div className={cn(box, 'border-[#EF4444]/30 bg-[#EF4444]/5 text-[#fca5a5]')}>
        <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="w-4 h-4 shrink-0" />Registration rejected — your slot was released.</p>
        {reg.admin_note && <p className="mt-1 text-white/60">Reason: {reg.admin_note}</p>}
      </div>
    );
  }
  if (t.status === 'CANCELLED') return <div className={cn(box, 'border-[#EF4444]/30 text-[#fca5a5]')}>This match was cancelled by the organizers.</div>;
  if (t.status === 'COMPLETED') return <div className={cn(box, 'border-white/10 text-white/50')}>Match completed. Check the Standings tab for results.</div>;

  if (room) {
    return (
      <div className={cn(box, 'border-[#10B981]/40 bg-[#10B981]/5')}>
        <p className="flex items-center gap-2 font-bold text-[#10B981] mb-3 text-[11px] uppercase tracking-wider"><Unlock className="w-4 h-4" />Room credentials unlocked</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-[#07090E] border border-white/10 p-3">
            <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Room ID</p>
            <p className="font-mono text-xl font-bold text-[#FFB800] break-all">{room.room_id}</p>
            <CopyButton value={room.room_id} label="ID" className="mt-2" />
          </div>
          <div className="rounded-lg bg-[#07090E] border border-white/10 p-3">
            <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1 flex items-center justify-between">
              Password
              <button onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="text-white/50 hover:text-white">{show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
            </p>
            <p className="font-mono text-xl font-bold text-[#FFB800] break-all">{show ? room.room_password : '•'.repeat(Math.max(4, room.room_password.length))}</p>
            <CopyButton value={room.room_password} label="Password" className="mt-2" />
          </div>
        </div>
        <CopyButton variant="outline" value={`Room ID: ${room.room_id}\nPassword: ${room.room_password}`} label="Copy both" className="mt-3 w-full" />
      </div>
    );
  }
  if (now < unlockAt) {
    return (
      <div className={cn(box, 'border-white/10 bg-white/[0.02]')}>
        <p className="flex items-center gap-2 text-white/60 font-semibold"><Lock className="w-4 h-4 text-[#FFB800]" />Room ID &amp; Password unlock {ROOM_WINDOW_MIN} minutes before kick-off</p>
        <p className="font-display text-4xl text-[#FFB800] leading-none mt-2"><Countdown to={unlockAt} /></p>
      </div>
    );
  }
  return <div className={cn(box, 'border-[#FFB800]/30 bg-[#FFB800]/5 text-[#FFB800]')}><p className="flex items-center gap-2 font-semibold"><Radio className="w-4 h-4 animate-pulse" />Window is open — waiting for the admin to publish the room. This page updates automatically.</p></div>;
}

function MySlots({ myRegs, tournaments, rooms, userReady }) {
  const tById = useMemo(() => Object.fromEntries(tournaments.map((t) => [t.id, t])), [tournaments]);
  const roomById = useMemo(() => Object.fromEntries(rooms.map((r) => [r.tournament_id, r])), [rooms]);
  const list = myRegs.filter((r) => tById[r.tournament_id]);
  return (
    <div>
      <SectionTitle icon={Key}>MY SLOTS &amp; ROOM ACCESS</SectionTitle>
      <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/50 flex gap-2">
        <Info className="w-4 h-4 text-[#FFB800] shrink-0 mt-px" />
        Your slots are linked to this browser. Don't clear site data or switch browsers before the match — your room credentials appear here only.
      </div>
      {!userReady ? <Empty icon={Lock} title="Session not ready">Could not start a player session. Check that Anonymous sign-ins are enabled in Supabase.</Empty>
        : list.length === 0 ? <Empty icon={Key} title="No slots yet">Join a match from the lobby and your registration will show up here.</Empty>
          : (
            <div className="grid gap-5 lg:grid-cols-2">
              {list.map((r) => {
                const t = tById[r.tournament_id];
                return (
                  <Glass key={r.id} className="p-5 space-y-4 anim-up">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-display text-3xl text-[#FFB800] leading-none truncate">{t.title}</h3>
                        <p className="text-xs text-white/50 mt-1.5">{t.mode} · {t.map} · {fmtDT(t.start_time)}</p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-[#07090E]/60 border border-white/5 p-2.5"><p className="text-white/40 text-[10px] uppercase tracking-wider">Squad</p><p className="font-bold text-white truncate">{r.squad_name}</p></div>
                      <div className="rounded-lg bg-[#07090E]/60 border border-white/5 p-2.5"><p className="text-white/40 text-[10px] uppercase tracking-wider">Entry paid</p><p className="font-bold text-white">{r.amount > 0 ? `${money(r.amount)} · ${r.payment_method}` : 'FREE'}</p></div>
                    </div>
                    <RoomPanel reg={r} t={t} room={roomById[r.tournament_id]} />
                  </Glass>
                );
              })}
            </div>
          )}
    </div>
  );
}

/* ───────────────────────── LEADERBOARD ───────────────────────── */

function PointCalculator({ points }) {
  const [placement, setPlacement] = useState(1);
  const [kills, setKills] = useState(5);
  const maxPl = Math.max(12, points.placement.length);
  const r = calcPoints(placement, kills, points);
  const max = Math.max(1, (points.placement[0] || 0) + 20 * points.kill);
  return (
    <Glass className="p-5">
      <h3 className="font-display text-2xl text-[#FFB800] flex items-center gap-2 mb-4"><Calculator className="w-5 h-5" />KILL-TO-POINT CALCULATOR</h3>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Placement">
          <select className={inputCls} value={placement} onChange={(e) => setPlacement(Number(e.target.value))}>
            {Array.from({ length: maxPl }, (_, i) => i + 1).map((n) => <option key={n} value={n}>#{n}{n === 1 ? ' · Booyah' : ''}</option>)}
          </select>
        </Field>
        <Field label="Kills"><input type="number" min="0" max="60" className={inputCls} value={kills} onChange={(e) => setKills(Math.max(0, Math.min(60, Number(e.target.value) || 0)))} /></Field>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-[#07090E]/70 border border-white/5 p-3"><p className="text-[10px] uppercase text-white/40 tracking-wider">Placement</p><p className="font-display text-3xl text-white">{r.placementPts}</p></div>
        <div className="rounded-xl bg-[#07090E]/70 border border-white/5 p-3"><p className="text-[10px] uppercase text-white/40 tracking-wider">Kills × {points.kill}</p><p className="font-display text-3xl text-[#EF4444]">{r.killPts}</p></div>
        <div className="rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/30 p-3"><p className="text-[10px] uppercase text-[#FFB800]/70 tracking-wider">Total</p><p className="font-display text-3xl text-[#FFB800]">{r.total}</p></div>
      </div>
      <div className="mt-4 h-2.5 rounded-full bg-white/10 overflow-hidden flex">
        <div className="bg-[#FFB800] transition-all duration-500" style={{ width: `${Math.min(100, (r.placementPts / max) * 100)}%` }} />
        <div className="bg-[#EF4444] transition-all duration-500" style={{ width: `${Math.min(100, (r.killPts / max) * 100)}%` }} />
      </div>
    </Glass>
  );
}

function Leaderboard({ board, points, tournaments }) {
  const rows = useMemo(() => [...board].sort((a, b) => b.total_points - a.total_points || b.booyahs - a.booyahs || b.total_kills - a.total_kills || a.squad_name.localeCompare(b.squad_name)), [board]);
  const completed = tournaments.filter((t) => t.status === 'COMPLETED').length;
  const medal = ['bg-[#FFB800] text-black', 'bg-slate-300 text-black', 'bg-amber-700 text-white'];
  return (
    <div className="space-y-6">
      <SectionTitle icon={Award} right={<Badge tone="emerald" dot="pulse">Live standings</Badge>}>TOURNAMENT STANDINGS</SectionTitle>
      {rows.length === 0 ? <Empty icon={Trophy} title="No results yet">Standings appear here as soon as the first match is completed ({completed} completed so far).</Empty> : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {rows.slice(0, 3).map((r, i) => (
              <Glass key={r.squad_key} className={cn('p-5 relative overflow-hidden', i === 0 && 'border-[#FFB800]/50 shadow-[0_0_40px_rgba(255,184,0,.15)]')}>
                <Crown className={cn('absolute right-3 top-3 w-6 h-6', i === 0 ? 'text-[#FFB800]' : 'text-white/15')} />
                <span className={cn('inline-grid place-items-center w-8 h-8 rounded-lg font-display text-xl', medal[i])}>{i + 1}</span>
                <p className="font-display text-3xl text-white mt-2 truncate leading-none">{r.squad_name}</p>
                <p className="text-xs text-white/45 mt-1">{r.booyahs} Booyah · {r.total_kills} kills · {r.matches_played} matches</p>
                <p className="font-display text-5xl text-[#FFB800] leading-none mt-3">{r.total_points}<span className="text-sm text-white/40 ml-1">PTS</span></p>
              </Glass>
            ))}
          </div>
          <Glass className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="bg-[#07090E]/70 text-white/45 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3 text-left w-16">Rank</th><th className="p-3 text-left">Squad</th>
                    <th className="p-3 text-center">Played</th><th className="p-3 text-center">Booyah</th>
                    <th className="p-3 text-center">Kills</th><th className="p-3 text-center">Place pts</th>
                    <th className="p-3 text-center">Kill pts</th><th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rows.map((r, i) => (
                    <tr key={r.squad_key} className="hover:bg-white/[0.04] transition">
                      <td className="p-3"><span className={cn('inline-grid place-items-center w-7 h-7 rounded-lg text-xs font-bold', medal[i] || 'bg-white/10 text-white/60')}>{i + 1}</span></td>
                      <td className="p-3 font-bold text-white">{r.squad_name}</td>
                      <td className="p-3 text-center text-white/60">{r.matches_played}</td>
                      <td className="p-3 text-center text-[#FFB800] font-bold">{r.booyahs}</td>
                      <td className="p-3 text-center text-[#EF4444] font-bold">{r.total_kills}</td>
                      <td className="p-3 text-center text-white/60">{r.placement_points}</td>
                      <td className="p-3 text-center text-white/60">{r.kill_points}</td>
                      <td className="p-3 text-right font-display text-3xl text-[#FFB800] leading-none">{r.total_points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Glass>
        </>
      )}
      <PointCalculator points={points} />
    </div>
  );
}

/* ───────────────────────── RULES & SUPPORT ───────────────────────── */

const RULE_GROUPS = [
  { icon: Swords, title: 'GENERAL MATCH RULES', items: [
    'Join the custom room at least 5 minutes before the official start time. Late players are not re-invited.',
    'Only the registered Player UIDs may play. Using another account (ghosting) leads to disqualification.',
    'Squad leaders are responsible for sharing the Room ID & Password with teammates — never share them publicly.',
    'Match settings (map, mode, skills, ammo) are fixed by the organizers and shown on the match card.',
    'Prize money is paid within 24 hours of results to the same bKash / Nagad / Rocket number used for entry, unless stated otherwise.',
  ] },
  { icon: Shield, title: 'ANTI-CHEAT POLICY', items: [
    'Hacks, scripts, aim-assist tools, macros, emulator tricks and unfair game exploits are strictly prohibited.',
    'Teaming with other squads, stream-sniping and intentional feeding are treated as cheating.',
    'Organizers may request gameplay recordings; refusal or edited footage counts as a violation.',
    'Offenders are removed from the match, forfeit all prizes, and are permanently banned from the platform.',
  ] },
  { icon: Wallet, title: 'PAYMENTS & REFUNDS', items: [
    'Send the exact entry fee by Send Money and submit the correct TrxID. Wrong, reused or fake TrxIDs are rejected.',
    'Approved squads receive Room credentials automatically 15 minutes before kick-off once published.',
    'If a match is cancelled by the organizers, the full entry fee is refunded. No refunds after the room is published.',
  ] },
];

function RulesSupport({ points, support }) {
  const rows = points.placement.map((p, i) => ({ rank: i + 1, p }));
  const hasSupport = support.whatsapp || support.telegram;
  return (
    <div className="space-y-6">
      <SectionTitle icon={BookOpen}>RULES &amp; SUPPORT CENTER</SectionTitle>

      <Glass className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-[#10B981]/30">
        <div className="flex items-center gap-3">
          <Headphones className="w-8 h-8 text-[#10B981]" />
          <div><p className="font-display text-2xl text-white leading-none">LIVE SUPPORT</p><p className="text-xs text-white/50 mt-1">Payment stuck? Room not showing? Talk to an admin.</p></div>
        </div>
        <div className="flex gap-2">
          {support.whatsapp && <a href={support.whatsapp} target="_blank" rel="noopener noreferrer" className={cn(BTN_BASE, BTN_VARIANT.emerald, BTN_SIZE.md)}><MessageCircle className="w-4 h-4" />WhatsApp</a>}
          {support.telegram && <a href={support.telegram} target="_blank" rel="noopener noreferrer" className={cn(BTN_BASE, 'bg-sky-500 text-black hover:bg-sky-400', BTN_SIZE.md)}><Send className="w-4 h-4" />Telegram</a>}
          {!hasSupport && <span className="text-xs text-white/40">Support links will appear here soon.</span>}
        </div>
      </Glass>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          {RULE_GROUPS.map(({ icon: I, title, items }) => (
            <Glass key={title} className="p-5">
              <h3 className="font-display text-2xl text-[#FFB800] flex items-center gap-2 mb-3"><I className="w-5 h-5" />{title}</h3>
              <ul className="space-y-2.5">
                {items.map((x) => <li key={x} className="flex gap-2.5 text-sm text-white/70 leading-relaxed"><ChevronRight className="w-4 h-4 text-[#FFB800] shrink-0 mt-0.5" />{x}</li>)}
              </ul>
            </Glass>
          ))}
        </div>
        <Glass className="p-5 h-fit">
          <h3 className="font-display text-2xl text-[#FFB800] flex items-center gap-2 mb-3"><Medal className="w-5 h-5" />POINT SYSTEM</h3>
          <div className="space-y-1.5 text-sm">
            {rows.map(({ rank, p }) => (
              <div key={rank} className="flex justify-between rounded-lg bg-[#07090E]/70 border border-white/5 px-3 py-2">
                <span className="text-white/60">#{rank}{rank === 1 ? ' Booyah' : ''} placement</span><span className="font-bold text-[#FFB800]">{p} pts</span>
              </div>
            ))}
            <div className="flex justify-between rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 px-3 py-2">
              <span className="text-white/70 flex items-center gap-1.5"><Skull className="w-3.5 h-3.5" />Each kill</span><span className="font-bold text-[#EF4444]">{points.kill} pt</span>
            </div>
            <p className="text-[11px] text-white/40 pt-1">Ranks beyond #{rows.length} earn 0 placement points. Ties are broken by Booyahs, then total kills.</p>
          </div>
        </Glass>
      </div>
    </div>
  );
}

/* ───────────────────────── CHROME: HERO, TICKER, NAV ───────────────────────── */

function SetupScreen() {
  return (
    <div className="min-h-screen grid place-items-center p-6 bg-[#07090E] text-white ba-root">
      <Glass className="max-w-lg p-8">
        <Zap className="w-10 h-10 text-[#FFB800] mb-3" />
        <h1 className="font-display text-4xl text-[#FFB800] leading-none">CONNECT SUPABASE</h1>
        <p className="text-sm text-white/60 mt-3 leading-relaxed">Could not find a Supabase client. Make sure <code className="text-[#FFB800]">src/supabaseClient.js</code> exports <code className="text-[#FFB800]">supabase = createClient(URL, ANON_KEY)</code>.</p>
        <p className="text-xs text-white/40 mt-3">Then run <code>schema.sql</code> in the Supabase SQL editor and enable Anonymous sign-ins.</p>
      </Glass>
    </div>
  );
}

function Ticker({ items }) {
  if (!items.length) return null;
  const line = items.map((n) => n.message);
  return (
    <div className="border-b border-[#FFB800]/15 bg-[#FFB800]/[0.06] overflow-hidden" aria-label="Announcements">
      <div className="flex items-center">
        <span className="shrink-0 z-10 flex items-center gap-1.5 bg-[#FFB800] text-black px-3 py-1.5 font-display text-lg leading-none"><Megaphone className="w-4 h-4" />NOTICE</span>
        <div className="overflow-hidden flex-1">
          <div className="flex w-max anim-marquee">
            {[0, 1].map((k) => (
              <div key={k} className="flex shrink-0 items-center" aria-hidden={k === 1}>
                {line.map((m, i) => <span key={`${k}-${i}`} className="px-8 text-xs text-white/80 whitespace-nowrap flex items-center gap-8">{m}<Flame className="w-3 h-3 text-[#FFB800]" /></span>)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero({ banner, tournaments, onCta }) {
  const open = tournaments.filter((t) => t.status === 'UPCOMING' || t.status === 'LIVE');
  const stats = [
    { l: 'Live now', v: tournaments.filter((t) => t.status === 'LIVE').length, c: 'text-[#10B981]' },
    { l: 'Open prize pool', v: money(open.reduce((s, t) => s + t.prize_pool, 0)), c: 'text-[#FFB800]' },
    { l: 'Squads registered', v: open.reduce((s, t) => s + t.filled_slots, 0), c: 'text-white' },
  ];
  return (
    <section className="relative overflow-hidden border-b border-[#FFB800]/15">
      {banner?.image_url
        ? <img src={banner.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        : null}
      <div className="absolute inset-0 cyber-grid" />
      <div className="absolute -top-24 -right-24 w-[28rem] h-[28rem] rounded-full bg-[#FFB800]/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-16 w-[24rem] h-[24rem] rounded-full bg-[#10B981]/10 blur-3xl" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#07090E] via-[#07090E]/70 to-transparent" />
      <div className="relative max-w-7xl mx-auto px-4 py-10 sm:py-16">
        <Badge tone="gold" className="mb-4 backdrop-blur"><Flame className="w-3.5 h-3.5" />{banner?.title || 'Free Fire Championship Season'}</Badge>
        <h1 className="font-display text-6xl sm:text-8xl leading-[.85] text-white uppercase">
          Dominate the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-[#FFE08A]">battleground</span>
        </h1>
        <p className="mt-4 max-w-xl text-sm sm:text-base text-white/60 leading-relaxed">
          {banner?.message || 'Book your squad slot, submit payment, get verified, and win daily cash prize pools.'}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button size="lg" onClick={onCta}><Gamepad2 className="w-5 h-5" />Find a match</Button>
        </div>
        <div className="mt-8 grid grid-cols-3 gap-3 max-w-xl">
          {stats.map((s) => (
            <Glass key={s.l} className="px-4 py-3">
              <p className={cn('font-display text-3xl sm:text-4xl leading-none', s.c)}>{s.v}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/40 mt-1">{s.l}</p>
            </Glass>
          ))}
        </div>
      </div>
    </section>
  );
}

function Header({ tab, setTab, live, readyRooms }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#FFB800]/15 bg-[#07090E]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <button onClick={() => setTab('lobby')} className="flex items-center gap-3" aria-label="Go to lobby">
          <span className="relative sheen overflow-hidden grid place-items-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFB800] to-[#B37A00] text-black font-display text-2xl leading-none pt-1 shadow-[0_0_24px_rgba(255,184,0,.35)]">FF</span>
          <span className="text-left">
            <span className="block font-display text-3xl text-[#FFB800] leading-none">BOOYAH ARENA</span>
            <span className="block text-[9px] uppercase tracking-[.25em] text-white/40 font-semibold">Official Esports Portal</span>
          </span>
        </button>
        <nav className="hidden md:flex items-center gap-1" aria-label="Main">
          {NAV.map(({ id, label, icon: I }) => (
            <button key={id} onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined}
              className={cn('relative flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition',
                tab === id ? 'bg-[#FFB800] text-black shadow-[0_0_20px_rgba(255,184,0,.3)]' : 'text-white/55 hover:text-white hover:bg-white/5')}>
              <I className="w-4 h-4" />{label}
              {id === 'slots' && readyRooms > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#10B981] text-black text-[10px] grid place-items-center live-dot">{readyRooms}</span>}
            </button>
          ))}
          <button onClick={() => setTab('admin')} className={cn('ml-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-wider transition',
            tab === 'admin' ? 'bg-[#EF4444] border-[#EF4444] text-white' : 'border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/10')}>
            <Settings className="w-4 h-4" />Admin
          </button>
        </nav>
        <span className={cn('md:hidden flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider', live ? 'text-[#10B981]' : 'text-white/30')}>
          <span className={cn('w-2 h-2 rounded-full bg-current', live && 'live-dot')} />{live ? 'Live' : 'Sync'}
        </span>
        <span className={cn('hidden md:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider', live ? 'text-[#10B981]' : 'text-white/30')} title={live ? 'Realtime connected' : 'Reconnecting — data refreshes every 30s'}>
          <span className={cn('w-2 h-2 rounded-full bg-current', live && 'live-dot')} />{live ? 'Realtime' : 'Polling'}
        </span>
      </div>
    </header>
  );
}

function BottomBar({ tab, setTab, readyRooms }) {
  const items = [...NAV, { id: 'admin', label: 'Admin', icon: Settings }];
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-[#FFB800]/20 bg-[#0B0F17]/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]" aria-label="Main">
      <div className="grid grid-cols-5">
        {items.map(({ id, label, icon: I }) => {
          const on = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)} aria-current={on ? 'page' : undefined}
              className={cn('relative flex flex-col items-center gap-0.5 py-2.5 transition', on ? (id === 'admin' ? 'text-[#EF4444]' : 'text-[#FFB800]') : 'text-white/40')}>
              {on && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-current shadow-[0_0_10px_currentColor]" />}
              <span className="relative"><I className="w-5 h-5" />{id === 'slots' && readyRooms > 0 && <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-[#10B981] text-black text-[9px] font-bold grid place-items-center">{readyRooms}</span>}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ───────────────────────── ADMIN CONTROL CENTER ───────────────────────── */

const ADMIN_TOKEN_KEY = 'ba_admin_token';

function AdminGate({ onUnlocked }) {
  const toast = useToast();
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    if (!pin || busy) return;
    setBusy(true); setErr('');
    try {
      const { data, error } = await supabase.rpc('admin_login', { p_pin: pin });
      if (error) throw error;
      if (!data) { setErr('Incorrect PIN. Access denied.'); setPin(''); return; }
      toast.success('Admin panel unlocked');
      onUnlocked(data);
    } catch (e2) { setErr(errMsg(e2)); } finally { setBusy(false); }
  };
  return (
    <div className="max-w-md mx-auto">
      <Glass className="p-8 text-center border-[#EF4444]/30 shadow-[0_0_60px_rgba(239,68,68,.10)]">
        <div className="mx-auto w-16 h-16 rounded-2xl grid place-items-center bg-[#EF4444]/10 border border-[#EF4444]/30 mb-4"><Lock className="w-8 h-8 text-[#EF4444]" /></div>
        <h2 className="font-display text-4xl text-white leading-none">ADMIN ACCESS LOCKED</h2>
        <p className="text-xs text-white/45 mt-2 mb-6">Enter the security PIN to open the control center.</p>
        <form onSubmit={submit} className="space-y-3">
          <input type="password" inputMode="numeric" autoComplete="off" autoFocus maxLength={32} value={pin} onChange={(e) => setPin(e.target.value)}
            aria-label="Admin PIN" placeholder="• • • •" className={cn(inputCls, 'text-center text-2xl tracking-[.5em] font-mono text-[#FFB800] focus:border-[#EF4444]/70 focus:ring-[#EF4444]/20')} />
          {err && <p role="alert" className="text-xs text-[#EF4444]">{err}</p>}
          <Button variant="crimson" size="lg" type="submit" loading={busy} disabled={!pin} className="w-full"><Unlock className="w-4 h-4" />Unlock panel</Button>
        </form>
      </Glass>
    </div>
  );
}

const EMPTY_MATCH = () => ({
  id: '', title: '', map: 'Bermuda', mode: 'SQUAD', entry_fee: '50', prize_pool: '1000', per_kill_reward: '10',
  total_slots: '12', start_time: toLocalInput(Date.now() + 2 * 3600 * 1000), map_image_url: '',
});

function MatchesAdmin({ tournaments, call, refresh }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_MATCH);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null); // {type, t}
  const [cBusy, setCBusy] = useState(false);
  const editing = !!form.id;
  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    const n = (v) => Number(v);
    if (form.title.trim().length < 3) return toast.error('Match title must be at least 3 characters.');
    if (![form.entry_fee, form.prize_pool, form.per_kill_reward].every((v) => Number.isInteger(n(v)) && n(v) >= 0)) return toast.error('Fee, prize and per-kill must be whole numbers ≥ 0.');
    if (!Number.isInteger(n(form.total_slots)) || n(form.total_slots) < 2 || n(form.total_slots) > 100) return toast.error('Total slots must be between 2 and 100.');
    const when = new Date(form.start_time);
    if (Number.isNaN(when.getTime())) return toast.error('Pick a valid start date & time.');
    setBusy(true);
    try {
      await call('admin_upsert_tournament', { p: { ...form, id: form.id || null, start_time: when.toISOString() } });
      toast.success(editing ? 'Match updated.' : 'Match published to the lobby.');
      setForm(EMPTY_MATCH()); await refresh();
    } catch (e2) { toast.error(errMsg(e2)); } finally { setBusy(false); }
  };

  const setStatus = async (t, status) => {
    try { await call('admin_set_tournament_status', { p_id: t.id, p_status: status }); toast.success(`${t.title} → ${status}`); await refresh(); }
    catch (e) { toast.error(errMsg(e)); }
  };
  const runConfirm = async () => {
    setCBusy(true);
    try {
      if (confirm.type === 'delete') { await call('admin_delete_tournament', { p_id: confirm.t.id }); toast.success('Match deleted.'); if (form.id === confirm.t.id) setForm(EMPTY_MATCH()); }
      else { await call('admin_set_tournament_status', { p_id: confirm.t.id, p_status: 'CANCELLED' }); toast.success('Match cancelled.'); }
      setConfirm(null); await refresh();
    } catch (e) { toast.error(errMsg(e)); } finally { setCBusy(false); }
  };

  return (
    <div className="space-y-6">
      <Glass className="p-5">
        <h3 className="font-display text-2xl text-[#FFB800] flex items-center gap-2 mb-4">{editing ? <Pencil className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}{editing ? 'EDIT MATCH' : 'CREATE NEW MATCH'}</h3>
        <form onSubmit={save} className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Match title" className="lg:col-span-2"><input className={inputCls} value={form.title} maxLength={80} onChange={set('title')} placeholder="DAILY BOOYAH SQUAD" /></Field>
          <Field label="Game mode"><select className={inputCls} value={form.mode} onChange={set('mode')}>{MODES.map((m) => <option key={m}>{m}</option>)}</select></Field>
          <Field label="Map"><select className={inputCls} value={form.map} onChange={set('map')}>{MAPS.map((m) => <option key={m}>{m}</option>)}</select></Field>
          <Field label="Entry fee (৳)" hint="0 = free"><input type="number" min="0" className={inputCls} value={form.entry_fee} onChange={set('entry_fee')} /></Field>
          <Field label="Prize pool (৳)"><input type="number" min="0" className={inputCls} value={form.prize_pool} onChange={set('prize_pool')} /></Field>
          <Field label="Per-kill reward (৳)"><input type="number" min="0" className={inputCls} value={form.per_kill_reward} onChange={set('per_kill_reward')} /></Field>
          <Field label="Total slots"><input type="number" min="2" max="100" className={inputCls} value={form.total_slots} onChange={set('total_slots')} /></Field>
          <Field label="Scheduled date & time" className="lg:col-span-2"><input type="datetime-local" className={inputCls} value={form.start_time} onChange={set('start_time')} /></Field>
          <Field label="Map image URL (optional)" className="lg:col-span-2"><input className={inputCls} value={form.map_image_url} onChange={set('map_image_url')} placeholder="https://… (leave empty for generated art)" /></Field>
          <div className="sm:col-span-2 lg:col-span-4 flex gap-2 justify-end">
            {editing && <Button variant="ghost" onClick={() => setForm(EMPTY_MATCH())}>Cancel edit</Button>}
            <Button type="submit" loading={busy}><Check className="w-4 h-4" />{editing ? 'Save changes' : 'Publish match'}</Button>
          </div>
        </form>
      </Glass>

      <div className="space-y-3">
        {tournaments.length === 0 && <Empty icon={Gamepad2} title="No matches yet">Create your first match above.</Empty>}
        {tournaments.map((t) => (
          <Glass key={t.id} className="p-4 flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap"><h4 className="font-display text-2xl text-white leading-none">{t.title}</h4><StatusBadge status={t.status} /></div>
              <p className="text-xs text-white/50 mt-1.5">{t.mode} · {t.map} · {fmtDT(t.start_time)} · Fee {t.entry_fee ? money(t.entry_fee) : 'FREE'} · Prize {money(t.prize_pool)} · {money(t.per_kill_reward)}/kill · <b className="text-white/70">{t.filled_slots}/{t.total_slots}</b> slots</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button size="sm" variant="ghost" onClick={() => { setForm({ id: t.id, title: t.title, map: t.map, mode: t.mode, entry_fee: String(t.entry_fee), prize_pool: String(t.prize_pool), per_kill_reward: String(t.per_kill_reward), total_slots: String(t.total_slots), start_time: toLocalInput(t.start_time), map_image_url: t.map_image_url || '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><Pencil className="w-3.5 h-3.5" />Edit</Button>
              {t.status === 'UPCOMING' && <Button size="sm" variant="emerald" onClick={() => setStatus(t, 'LIVE')}><Play className="w-3.5 h-3.5" />Go live</Button>}
              {(t.status === 'UPCOMING' || t.status === 'LIVE') && <Button size="sm" variant="outline" onClick={() => setStatus(t, 'PAUSED')}><Pause className="w-3.5 h-3.5" />Pause</Button>}
              {t.status === 'PAUSED' && <Button size="sm" variant="emerald" onClick={() => setStatus(t, 'UPCOMING')}><Play className="w-3.5 h-3.5" />Resume</Button>}
              {t.status !== 'CANCELLED' && t.status !== 'COMPLETED' && <Button size="sm" variant="ghost" onClick={() => setConfirm({ type: 'cancel', t })}><Ban className="w-3.5 h-3.5" />Cancel</Button>}
              {t.status === 'CANCELLED' && <Button size="sm" variant="ghost" onClick={() => setStatus(t, 'UPCOMING')}>Reopen</Button>}
              <Button size="sm" variant="crimson" onClick={() => setConfirm({ type: 'delete', t })}><Trash2 className="w-3.5 h-3.5" />Delete</Button>
            </div>
          </Glass>
        ))}
      </div>

      <ConfirmModal open={!!confirm} busy={cBusy} onClose={() => setConfirm(null)} onConfirm={runConfirm}
        title={confirm?.type === 'delete' ? 'DELETE MATCH?' : 'CANCEL MATCH?'}
        confirmLabel={confirm?.type === 'delete' ? 'Delete forever' : 'Cancel match'}
        message={confirm?.type === 'delete'
          ? `“${confirm?.t.title}” will be removed with all its registrations, room info and results. Standings are recalculated. This cannot be undone.`
          : `“${confirm?.t.title}” will be marked CANCELLED and registration closes. Remember to refund paid squads.`} />
    </div>
  );
}

function PaymentsAdmin({ tournaments, regs, call, refresh }) {
  const toast = useToast();
  const [tid, setTid] = useState('ALL');
  const [st, setSt] = useState('PENDING');
  const [q, setQ] = useState('');
  const [rejecting, setRejecting] = useState(null);
  const [busyId, setBusyId] = useState('');
  const [rBusy, setRBusy] = useState(false);
  const [proof, setProof] = useState('');
  const tById = useMemo(() => Object.fromEntries(tournaments.map((t) => [t.id, t])), [tournaments]);
  const counts = useMemo(() => regs.reduce((a, r) => ({ ...a, [r.status]: (a[r.status] || 0) + 1 }), {}), [regs]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return regs.filter((r) => (tid === 'ALL' || r.tournament_id === tid) && (st === 'ALL' || r.status === st)
      && (!s || [r.squad_name, r.ign, r.trx_id, r.whatsapp, r.player1_uid, r.player2_uid, r.player3_uid, r.player4_uid, r.sub_uid].some((x) => (x || '').toLowerCase().includes(s))));
  }, [regs, tid, st, q]);

  const setStatus = async (r, status, note) => {
    setBusyId(r.id);
    try { await call('admin_set_registration_status', { p_id: r.id, p_status: status, p_note: note || null }); toast.success(`${r.squad_name} → ${status}`); await refresh(); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusyId(''); }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[['PENDING', 'Pending', 'text-[#FFB800]'], ['APPROVED', 'Approved', 'text-[#10B981]'], ['REJECTED', 'Rejected', 'text-[#EF4444]']].map(([k, l, c]) => (
          <button key={k} onClick={() => setSt(k)} className={cn('rounded-2xl border p-4 text-left transition', st === k ? 'border-white/30 bg-white/[0.07]' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]')}>
            <p className={cn('font-display text-4xl leading-none', c)}>{counts[k] || 0}</p><p className="text-[10px] uppercase tracking-wider text-white/45 mt-1">{l}</p>
          </button>
        ))}
      </div>
      <Glass className="p-4 grid gap-3 sm:grid-cols-3">
        <Field label="Match"><select className={inputCls} value={tid} onChange={(e) => setTid(e.target.value)}><option value="ALL">All matches</option>{tournaments.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></Field>
        <Field label="Status"><select className={inputCls} value={st} onChange={(e) => setSt(e.target.value)}>{['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Search"><div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" /><input className={cn(inputCls, 'pl-9')} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Squad, TrxID, UID, phone" /></div></Field>
      </Glass>

      {list.length === 0 ? <Empty icon={Wallet} title="Nothing here">No registrations match these filters.</Empty> : (
        <div className="space-y-3">
          {list.map((r) => {
            const t = tById[r.tournament_id];
            const uids = [r.player1_uid, r.player2_uid, r.player3_uid, r.player4_uid].filter(Boolean);
            return (
              <Glass key={r.id} className="p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-2xl text-white leading-none">{r.squad_name} <span className="text-sm font-body text-white/40">· IGN {r.ign}</span></p>
                    <p className="text-xs text-white/45 mt-1">{t?.title || 'Deleted match'} · {t?.mode} · registered {fmtDT(r.created_at)}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-[#07090E]/60 border border-white/5 p-2.5"><p className="text-white/40 text-[10px] uppercase tracking-wider">Leader UID</p><p className="font-mono text-white">{r.player1_uid}</p></div>
                  <div className="rounded-lg bg-[#07090E]/60 border border-white/5 p-2.5"><p className="text-white/40 text-[10px] uppercase tracking-wider">Team UIDs</p><p className="font-mono text-white/80 break-all">{uids.slice(1).join(', ') || '—'}{r.sub_uid ? ` · sub ${r.sub_uid}` : ''}</p></div>
                  <div className="rounded-lg bg-[#07090E]/60 border border-white/5 p-2.5"><p className="text-white/40 text-[10px] uppercase tracking-wider">WhatsApp</p><a className="text-[#10B981] hover:underline inline-flex items-center gap-1" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${r.whatsapp.replace(/\D/g, '').replace(/^0/, '880')}`}>{r.whatsapp}<ExternalLink className="w-3 h-3" /></a></div>
                  <div className="rounded-lg bg-[#07090E]/60 border border-white/5 p-2.5">
                    <p className="text-white/40 text-[10px] uppercase tracking-wider">Payment</p>
                    {r.amount > 0 ? <p className="text-white"><b className="text-[#FFB800]">{money(r.amount)}</b> · {r.payment_method} · <span className="font-mono text-[#FFB800]">{r.trx_id}</span></p> : <p className="text-white/60">Free entry</p>}
                  </div>
                </div>
                {r.admin_note && <p className="text-xs text-white/50">Note: {r.admin_note}</p>}
                <div className="flex flex-wrap items-center gap-2">
                  {r.screenshot_url && <Button size="sm" variant="ghost" onClick={() => setProof(r.screenshot_url)}><ImageIcon className="w-3.5 h-3.5" />View screenshot</Button>}
                  {r.trx_id && <CopyButton value={r.trx_id} label="TrxID" />}
                  <span className="flex-1" />
                  {r.status !== 'APPROVED' && <Button size="sm" variant="emerald" loading={busyId === r.id} onClick={() => setStatus(r, 'APPROVED')}><Check className="w-3.5 h-3.5" />Approve</Button>}
                  {r.status !== 'REJECTED' && <Button size="sm" variant="crimson" disabled={busyId === r.id} onClick={() => setRejecting(r)}><X className="w-3.5 h-3.5" />Reject</Button>}
                </div>
              </Glass>
            );
          })}
        </div>
      )}

      <ConfirmModal open={!!rejecting} busy={rBusy} note title="REJECT REGISTRATION?" confirmLabel="Reject & free slot"
        message={`Reject “${rejecting?.squad_name}”? Their slot is released immediately and they see the reason you enter below.`}
        onClose={() => setRejecting(null)}
        onConfirm={async (note) => { setRBusy(true); await setStatus(rejecting, 'REJECTED', note); setRBusy(false); setRejecting(null); }} />
      <Modal open={!!proof} onClose={() => setProof('')} title="PAYMENT SCREENSHOT" wide>
        {proof && <><img src={proof} alt="Payment proof" className="w-full max-h-[70vh] object-contain rounded-xl bg-black" /><a href={proof} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-[#FFB800] hover:underline">Open original<ExternalLink className="w-3 h-3" /></a></>}
      </Modal>
    </div>
  );
}

function RoomEditor({ t, room, approved, call, refresh }) {
  const toast = useToast();
  const [id, setId] = useState(room?.room_id || '');
  const [pw, setPw] = useState(room?.room_password || '');
  const [pub, setPub] = useState(!!room?.published);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setId(room?.room_id || ''); setPw(room?.room_password || ''); setPub(!!room?.published); }, [room?.room_id, room?.room_password, room?.published]);

  const save = async (publish, okMsg) => {
    setBusy(true);
    try {
      await call('admin_set_room', { p_tournament: t.id, p_room_id: id, p_password: pw, p_published: publish });
      setPub(publish); toast.success(okMsg); await refresh();
    } catch (e) { toast.error(errMsg(e)); setPub(!!room?.published); } finally { setBusy(false); }
  };
  const dirty = id !== (room?.room_id || '') || pw !== (room?.room_password || '');

  return (
    <Glass className="p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h4 className="font-display text-2xl text-white leading-none">{t.title}</h4><p className="text-xs text-white/45 mt-1">{fmtDT(t.start_time)} · {approved} approved squad{approved === 1 ? '' : 's'} will receive this</p></div>
        <div className="flex items-center gap-2"><StatusBadge status={t.status} /><Badge tone={pub ? 'emerald' : 'gray'} dot>{pub ? 'Published' : 'Hidden'}</Badge></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Room ID"><input className={cn(inputCls, 'font-mono')} value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g. 5647382" /></Field>
        <Field label="Room password"><input className={cn(inputCls, 'font-mono')} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="e.g. 4821" /></Field>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#07090E]/60 px-4 py-3">
        <div className="min-w-0"><p className="text-sm font-semibold text-white flex items-center gap-2"><Radio className="w-4 h-4 text-[#10B981]" />Publish room info</p><p className="text-[11px] text-white/40">Approved players see it instantly once within {ROOM_WINDOW_MIN} min of kick-off.</p></div>
        <div className="flex items-center gap-3">
          {dirty && <Button size="sm" variant="outline" loading={busy} onClick={() => save(pub, 'Room details saved.')}>Save</Button>}
          <Switch checked={pub} disabled={busy} label="Publish room info" onChange={(v) => save(v, v ? 'Room info published to approved players.' : 'Room info hidden.')} />
        </div>
      </div>
    </Glass>
  );
}

function RoomsAdmin({ tournaments, regs, rooms, call, refresh }) {
  const active = tournaments.filter((t) => t.status === 'UPCOMING' || t.status === 'LIVE' || t.status === 'PAUSED');
  const roomBy = useMemo(() => Object.fromEntries(rooms.map((r) => [r.tournament_id, r])), [rooms]);
  if (!active.length) return <Empty icon={Key} title="No active matches">Create or reopen a match to manage its room.</Empty>;
  return (
    <div className="space-y-4">
      {active.map((t) => (
        <RoomEditor key={t.id} t={t} room={roomBy[t.id]} call={call} refresh={refresh}
          approved={regs.filter((r) => r.tournament_id === t.id && r.status === 'APPROVED').length} />
      ))}
    </div>
  );
}

function ResultsAdmin({ tournaments, regs, points, call, refresh }) {
  const toast = useToast();
  const eligible = tournaments.filter((t) => t.status !== 'CANCELLED');
  const [tid, setTid] = useState('');
  const [rows, setRows] = useState({}); // squad_name -> { placement, kills }
  const [busy, setBusy] = useState(false);
  const [fetching, setFetching] = useState(false);

  const selectedMatch = eligible.find((x) => x.id === tid);
  const approvedSquads = useMemo(() => {
    if (!tid) return [];
    return regs.filter((r) => r.tournament_id === tid && r.status === 'APPROVED')
      .sort((a, b) => a.squad_name.localeCompare(b.squad_name));
  }, [regs, tid]);

  useEffect(() => {
    if (!tid) { setRows({}); return; }
    let mounted = true;
    setFetching(true);
    (async () => {
      try {
        const { data, error } = await supabase.from('match_results').select('*').eq('tournament_id', tid);
        if (!mounted) return;
        if (!error && data && data.length > 0) {
          const map = {};
          data.forEach((r) => { map[r.squad_name] = { placement: r.placement, kills: r.kills }; });
          setRows(map);
        } else {
          // Initialize empty for all approved squads
          const map = {};
          approvedSquads.forEach((s) => { map[s.squad_name] = { placement: 0, kills: 0 }; });
          setRows(map);
        }
      } catch (e) {
        console.error('Failed to load match results', e);
      } finally {
        if (mounted) setFetching(false);
      }
    })();
    return () => { mounted = false; };
  }, [tid, approvedSquads]);

  const updateSquad = (squadName, field, value) => {
    setRows((prev) => ({
      ...prev,
      [squadName]: {
        placement: field === 'placement' ? Number(value) : (prev[squadName]?.placement || 0),
        kills: field === 'kills' ? Math.max(0, Number(value) || 0) : (prev[squadName]?.kills || 0),
      },
    }));
  };

  const saveResults = async (markCompleted) => {
    if (!tid) return;
    setBusy(true);
    try {
      const payload = Object.entries(rows).map(([squadName, data]) => ({
        tournament_id: tid,
        squad_name: squadName,
        placement: data.placement,
        kills: data.kills,
      }));

      await call('admin_save_results', {
        p_tournament: tid,
        p_results: payload,
        p_mark_completed: markCompleted,
      });

      toast.success(markCompleted ? 'Results saved & match marked COMPLETED!' : 'Draft results saved.');
      await refresh();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <Glass className="p-5 space-y-4">
        <Field label="Select match to input results">
          <select className={inputCls} value={tid} onChange={(e) => setTid(e.target.value)}>
            <option value="">-- Select a tournament --</option>
            {eligible.map((t) => (
              <option key={t.id} value={t.id}>{t.title} ({t.mode} · {t.status})</option>
            ))}
          </select>
        </Field>
      </Glass>

      {selectedMatch && (
        <Glass className="p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <h3 className="font-display text-3xl text-white leading-none">{selectedMatch.title}</h3>
              <p className="text-xs text-white/50 mt-1">{approvedSquads.length} approved squad(s) in this match</p>
            </div>
            <StatusBadge status={selectedMatch.status} />
          </div>

          {fetching ? (
            <div className="py-10 text-center text-white/40"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />Loading results...</div>
          ) : approvedSquads.length === 0 ? (
            <Empty icon={Users} title="No approved squads">Approve registrations in the Payments tab before entering results.</Empty>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[550px]">
                  <thead className="bg-[#07090E]/70 text-white/45 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="p-3 text-left">Squad</th>
                      <th className="p-3 text-center w-36">Placement</th>
                      <th className="p-3 text-center w-32">Kills</th>
                      <th className="p-3 text-center">Place Pts</th>
                      <th className="p-3 text-center">Kill Pts</th>
                      <th className="p-3 text-right">Total Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {approvedSquads.map((s) => {
                      const squadData = rows[s.squad_name] || { placement: 0, kills: 0 };
                      const calc = calcPoints(squadData.placement, squadData.kills, points);
                      return (
                        <tr key={s.id} className="hover:bg-white/[0.02]">
                          <td className="p-3 font-bold text-white">{s.squad_name} <span className="text-xs font-normal text-white/40">({s.ign})</span></td>
                          <td className="p-3">
                            <select className={cn(inputCls, 'py-1 text-center')} value={squadData.placement} onChange={(e) => updateSquad(s.squad_name, 'placement', e.target.value)}>
                              <option value={0}>0 (Not Ranked)</option>
                              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                                <option key={n} value={n}>#{n}{n === 1 ? ' · Booyah' : ''}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3">
                            <input type="number" min="0" max="50" className={cn(inputCls, 'py-1 text-center')} value={squadData.kills} onChange={(e) => updateSquad(s.squad_name, 'kills', e.target.value)} />
                          </td>
                          <td className="p-3 text-center font-mono text-white/70">{calc.placementPts}</td>
                          <td className="p-3 text-center font-mono text-[#EF4444]">{calc.killPts}</td>
                          <td className="p-3 text-right font-display text-2xl text-[#FFB800]">{calc.total}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap gap-3 justify-end pt-3 border-t border-white/10">
                <Button variant="ghost" loading={busy} onClick={() => saveResults(false)}>Save Draft</Button>
                <Button variant="gold" loading={busy} onClick={() => saveResults(true)}><Trophy className="w-4 h-4" />Save &amp; Complete Match</Button>
              </div>
            </>
          )}
        </Glass>
      )}
    </div>
  );
}

function AnnouncementsAdmin({ announcements, call, refresh }) {
  const toast = useToast();
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    setBusy(true);
    try {
      await call('admin_save_announcement', { p_message: msg.trim() });
      toast.success('Notice published to ticker!');
      setMsg('');
      await refresh();
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  const remove = async (id) => {
    try {
      await call('admin_delete_announcement', { p_id: id });
      toast.success('Notice removed');
      await refresh();
    } catch (err) { toast.error(errMsg(err)); }
  };

  return (
    <div className="space-y-6">
      <Glass className="p-5">
        <h3 className="font-display text-2xl text-[#FFB800] flex items-center gap-2 mb-3"><Megaphone className="w-5 h-5" />NEW ANNOUNCEMENT</h3>
        <form onSubmit={add} className="flex gap-3">
          <input className={inputCls} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="e.g. Daily Solo tournament starts at 8:00 PM tonight!" maxLength={200} />
          <Button type="submit" loading={busy} disabled={!msg.trim()}><Megaphone className="w-4 h-4" />Publish</Button>
        </form>
      </Glass>

      <div className="space-y-3">
        {announcements.length === 0 ? <Empty icon={Megaphone} title="No announcements">Publish notices above to show them on the scrolling ticker.</Empty>
          : announcements.map((a) => (
            <Glass key={a.id} className="p-4 flex items-center justify-between gap-4">
              <p className="text-sm text-white/80">{a.message}</p>
              <Button size="sm" variant="crimson" onClick={() => remove(a.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
            </Glass>
          ))}
      </div>
    </div>
  );
}

function SettingsAdmin({ settings, call, refresh }) {
  const toast = useToast();
  const [pay, setPay] = useState(settings.payment || DEFAULT_PAYMENT);
  const [sup, setSup] = useState(settings.support || DEFAULT_SUPPORT);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [busyPay, setBusyPay] = useState(false);
  const [busyPin, setBusyPin] = useState(false);

  useEffect(() => {
    setPay(settings.payment || DEFAULT_PAYMENT);
    setSup(settings.support || DEFAULT_SUPPORT);
  }, [settings]);

  const saveSettings = async (e) => {
    e.preventDefault();
    setBusyPay(true);
    try {
      await call('admin_save_settings', {
        p_payment: pay,
        p_support: sup,
      });
      toast.success('System settings saved successfully!');
      await refresh();
    } catch (err) { toast.error(errMsg(err)); } finally { setBusyPay(false); }
  };

  const changePin = async (e) => {
    e.preventDefault();
    if (!oldPin || !newPin) return;
    if (newPin.length < 4) return toast.error('New PIN must be at least 4 characters.');
    setBusyPin(true);
    try {
      await call('admin_change_pin', { p_old_pin: oldPin, p_new_pin: newPin });
      toast.success('Admin PIN updated!');
      setOldPin(''); setNewPin('');
    } catch (err) { toast.error(errMsg(err)); } finally { setBusyPin(false); }
  };

  return (
    <div className="space-y-6">
      <Glass className="p-5">
        <h3 className="font-display text-2xl text-[#FFB800] flex items-center gap-2 mb-4"><Wallet className="w-5 h-5" />PAYMENT &amp; SUPPORT ACCOUNTS</h3>
        <form onSubmit={saveSettings} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="bKash Personal Number"><input className={inputCls} value={pay.bkash || ''} onChange={(e) => setPay({ ...pay, bkash: e.target.value })} placeholder="017XXXXXXXX" /></Field>
            <Field label="Nagad Personal Number"><input className={inputCls} value={pay.nagad || ''} onChange={(e) => setPay({ ...pay, nagad: e.target.value })} placeholder="018XXXXXXXX" /></Field>
            <Field label="Rocket Personal Number"><input className={inputCls} value={pay.rocket || ''} onChange={(e) => setPay({ ...pay, rocket: e.target.value })} placeholder="019XXXXXXXX" /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-white/10">
            <Field label="WhatsApp Support Link"><input className={inputCls} value={sup.whatsapp || ''} onChange={(e) => setSup({ ...sup, whatsapp: e.target.value })} placeholder="https://wa.me/88017XXXXXXXX" /></Field>
            <Field label="Telegram Support Link"><input className={inputCls} value={sup.telegram || ''} onChange={(e) => setSup({ ...sup, telegram: e.target.value })} placeholder="https://t.me/yourusername" /></Field>
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" loading={busyPay}><Check className="w-4 h-4" />Save Configuration</Button>
          </div>
        </form>
      </Glass>

      <Glass className="p-5">
        <h3 className="font-display text-2xl text-[#EF4444] flex items-center gap-2 mb-4"><Lock className="w-5 h-5" />CHANGE ADMIN PIN</h3>
        <form onSubmit={changePin} className="grid gap-3 sm:grid-cols-3 items-end">
          <Field label="Current PIN"><input type="password" className={inputCls} value={oldPin} onChange={(e) => setOldPin(e.target.value)} placeholder="••••" /></Field>
          <Field label="New Security PIN"><input type="password" className={inputCls} value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="••••" /></Field>
          <Button type="submit" variant="crimson" loading={busyPin} disabled={!oldPin || !newPin}><Key className="w-4 h-4" />Update Security PIN</Button>
        </form>
      </Glass>
    </div>
  );
}

function AdminPanel({ tournaments, regs, rooms, announcements, settings, points, refresh }) {
  const [token, setToken] = useState(() => safeStore.get(ADMIN_TOKEN_KEY));
  const [tab, setTab] = useState('matches');

  const onUnlocked = (tok) => {
    safeStore.set(ADMIN_TOKEN_KEY, tok);
    setToken(tok);
  };

  const logout = () => {
    safeStore.del(ADMIN_TOKEN_KEY);
    setToken(null);
  };

  const callAdminRpc = useCallback(async (fnName, params = {}) => {
    const { data, error } = await supabase.rpc(fnName, { ...params, p_token: token });
    if (error) throw error;
    return data;
  }, [token]);

  if (!token) return <AdminGate onUnlocked={onUnlocked} />;

  const pendingCount = regs.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-[#EF4444]" />
          <div>
            <h2 className="font-display text-4xl text-white leading-none">ADMIN CONTROL CENTER</h2>
            <p className="text-xs text-white/50">Manage matches, registrations, room passwords, and standings</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={logout}><LogOut className="w-4 h-4" />Lock Panel</Button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {[
          { id: 'matches', label: 'Matches', icon: Gamepad2 },
          { id: 'payments', label: `Payments (${pendingCount})`, icon: Wallet, badge: pendingCount },
          { id: 'rooms', label: 'Rooms', icon: Key },
          { id: 'results', label: 'Results', icon: Trophy },
          { id: 'notices', label: 'Notices', icon: Megaphone },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition',
              tab === t.id ? 'bg-[#EF4444] text-white shadow-[0_0_20px_rgba(239,68,68,.3)]' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10')}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {tab === 'matches' && <MatchesAdmin tournaments={tournaments} call={callAdminRpc} refresh={refresh} />}
      {tab === 'payments' && <PaymentsAdmin tournaments={tournaments} regs={regs} call={callAdminRpc} refresh={refresh} />}
      {tab === 'rooms' && <RoomsAdmin tournaments={tournaments} regs={regs} rooms={rooms} call={callAdminRpc} refresh={refresh} />}
      {tab === 'results' && <ResultsAdmin tournaments={tournaments} regs={regs} points={points} call={callAdminRpc} refresh={refresh} />}
      {tab === 'notices' && <AnnouncementsAdmin announcements={announcements} call={callAdminRpc} refresh={refresh} />}
      {tab === 'settings' && <SettingsAdmin settings={settings} call={callAdminRpc} refresh={refresh} />}
    </div>
  );
}

/* ───────────────────────── MAIN APP ───────────────────────── */

function BooyahArena() {
  const toast = useToast();
  const [tab, setTab] = useState('lobby');
  const [user, setUser] = useState(null);
  const [userReady, setUserReady] = useState(false);
  const [tournaments, setTournaments] = useState([]);
  const [myRegs, setMyRegs] = useState([]);
  const [allRegs, setAllRegs] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [standings, setStandings] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [settings, setSettings] = useState({ payment: DEFAULT_PAYMENT, support: DEFAULT_SUPPORT });
  const [points, setPoints] = useState(DEFAULT_POINTS);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [joinModal, setJoinModal] = useState(null);

  // Authenticate player session anonymously
  useEffect(() => {
    if (!supabase) return;
    (async () => {
      try {
        let { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          const { data, error } = await supabase.auth.signInAnonymously();
          if (!error && data) session = data.session;
        }
        setUser(session?.user || null);
      } catch (e) {
        console.warn('Anon auth warning', e);
      } finally {
        setUserReady(true);
      }
    })();
  }, []);

  // Fetch all public database states
  const fetchData = useCallback(async () => {
    if (!supabase) return;
    try {
      const [tRes, rRes, rmRes, stRes, anRes, setRes] = await Promise.all([
        supabase.from('tournaments').select('*'),
        supabase.from('registrations').select('*'),
        supabase.from('tournament_rooms').select('*'),
        supabase.from('standings').select('*'),
        supabase.from('announcements').select('*'),
        supabase.from('system_settings').select('*'),
      ]);

      if (tRes.data) setTournaments(tRes.data);
      if (rRes.data) {
        setAllRegs(rRes.data);
        if (user) setMyRegs(rRes.data.filter((r) => r.user_id === user.id));
      }
      if (rmRes.data) setRooms(rmRes.data);
      if (stRes.data) setStandings(stRes.data);
      if (anRes.data) setAnnouncements(anRes.data);
      if (setRes.data) {
        const pay = setRes.data.find((s) => s.key === 'payment')?.value || DEFAULT_PAYMENT;
        const sup = setRes.data.find((s) => s.key === 'support')?.value || DEFAULT_SUPPORT;
        const pts = setRes.data.find((s) => s.key === 'points')?.value || DEFAULT_POINTS;
        setSettings({ payment: pay, support: sup });
        setPoints(pts);
      }
    } catch (e) {
      console.error('Data fetch error', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (userReady) fetchData();
  }, [userReady, fetchData]);

  // Set up Realtime channel with fallback interval
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase.channel('ba-public')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchData();
      })
      .subscribe((status) => {
        setLive(status === 'SUBSCRIBED');
      });

    const interval = setInterval(fetchData, 30000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchData]);

  const regByTournament = useMemo(() => {
    return Object.fromEntries(myRegs.map((r) => [r.tournament_id, r]));
  }, [myRegs]);

  const readyRoomsCount = useMemo(() => {
    const now = Date.now();
    return myRegs.filter((r) => {
      if (r.status !== 'APPROVED') return false;
      const t = tournaments.find((x) => x.id === r.tournament_id);
      if (!t || t.status !== 'UPCOMING') return false;
      const unlockAt = new Date(t.start_time).getTime() - ROOM_WINDOW_MIN * 60000;
      return now >= unlockAt;
    }).length;
  }, [myRegs, tournaments]);

  if (!supabase) return <SetupScreen />;

  return (
    <div className="min-h-screen bg-[#07090E] text-white ba-root pb-20 md:pb-10 selection:bg-[#FFB800] selection:text-black">
      <GlobalStyle />
      <Ticker items={announcements} />
      <Header tab={tab} setTab={setTab} live={live} readyRooms={readyRoomsCount} />

      {tab === 'lobby' && (
        <>
          <Hero banner={announcements[0]} tournaments={tournaments} onCta={() => window.scrollTo({ top: 600, behavior: 'smooth' })} />
          <main className="max-w-7xl mx-auto px-4 py-8">
            <Lobby tournaments={tournaments} loading={loading} regByTournament={regByTournament} onJoin={(t) => setJoinModal(t)} onRefresh={fetchData} />
          </main>
        </>
      )}

      {tab !== 'lobby' && (
        <main className="max-w-7xl mx-auto px-4 py-8">
          {tab === 'slots' && <MySlots myRegs={myRegs} tournaments={tournaments} rooms={rooms} userReady={userReady} />}
          {tab === 'standings' && <Leaderboard board={standings} points={points} tournaments={tournaments} />}
          {tab === 'support' && <RulesSupport points={points} support={settings.support} />}
          {tab === 'admin' && <AdminPanel tournaments={tournaments} regs={allRegs} rooms={rooms} announcements={announcements} settings={settings} points={points} refresh={fetchData} />}
        </main>
      )}

      <BottomBar tab={tab} setTab={setTab} readyRooms={readyRoomsCount} />

      {joinModal && (
        <RegisterModal t={joinModal} settings={settings} userId={user?.id} onClose={() => setJoinModal(null)} onDone={() => { setJoinModal(null); fetchData(); setTab('slots'); }} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <BooyahArena />
    </ToastProvider>
  );
}
