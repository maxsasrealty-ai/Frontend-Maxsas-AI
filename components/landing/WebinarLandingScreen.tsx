import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { router } from 'expo-router';
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock,
  Database,
  Languages,
  Menu,
  Mic2,
  Phone,
  PhoneIncoming,
  Radio,
  Sparkles,
  Timer,
  TrendingUp,
  Users,
  X,
  XCircle,
  Zap,
  type LucideIcon,
} from 'lucide-react';

const LOGO_IMG = require('../../assets/images/maxsas-logo.png');
const FOUNDER_IMG = '/anubhav.png';

const c = {
  base: '#06080F',
  surface: '#0E1220',
  elevated: '#161B2E',
  line: '#232A44',
  blue: '#3B6FFF',
  blueLight: '#5B87FF',
  ice: '#8FB8FF',
  amber: '#FFB454',
  text: '#F4F6FB',
  muted: '#8D96B3',
};

const display = { fontFamily: "'Space Grotesk', sans-serif" };
const mono = { fontFamily: "'IBM Plex Mono', monospace" };

type Tone = 'amber' | 'blue' | 'muted';

type TimelineStep = {
  time: string;
  event: string;
  status: string;
  tone: Tone;
  Icon: LucideIcon;
};

type AgendaItem = {
  title: string;
  desc: string;
};

type FaqItem = {
  q: string;
  a: string;
};

type Testimonial = {
  quote: string;
  name: string;
  role: string;
};

function useCountdown(target: string) {
  const [left, setLeft] = useState('--d --h --m --s');

  useEffect(() => {
    const end = new Date(target).getTime();
    const tick = () => {
      const diff = end - Date.now();
      if (diff <= 0) {
        setLeft('Live now');
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLeft(`${d}d ${h}h ${m}m ${s}s`);
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  return left;
}

function useOnScreen(ref: { current: HTMLDivElement | null }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return visible;
}

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const visible = useOnScreen(ref);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0px)' : 'translateY(20px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function Waveform({ size = 22 }: { size?: number }) {
  const heights = [10, 22, 14, 30, 18, 26, 12, 24, 16];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: size + 12 }}>
      {heights.map((height, index) => (
        <span
          key={index}
          style={{
            width: 3,
            height,
            borderRadius: 2,
            background: `linear-gradient(180deg, ${c.ice}, ${c.blue})`,
            animation: 'wavepulse 1.1s ease-in-out infinite',
            animationDelay: `${index * 0.08}s`,
          }}
        />
      ))}
    </div>
  );
}

const LEDGER_STEPS: TimelineStep[] = [
  { time: '00:00', event: 'Lead captured', status: 'New', tone: 'muted', Icon: Users },
  { time: '00:04', event: 'AI dialing lead', status: 'Calling', tone: 'blue', Icon: PhoneIncoming },
  { time: '00:52', event: 'Budget & timeline confirmed', status: 'Qualified', tone: 'amber', Icon: CheckCircle2 },
  { time: '00:53', event: 'Record synced to CRM', status: 'Synced', tone: 'blue', Icon: Database },
  { time: '00:58', event: 'Site visit slot booked', status: 'Booked', tone: 'amber', Icon: CalendarClock },
  { time: '01:00', event: 'Assigned to closing rep', status: 'Handed off', tone: 'blue', Icon: Phone },
];

function StatusPill({ status, tone }: { status: string; tone: Tone }) {
  const color = tone === 'amber' ? c.amber : c.blue;
  return (
    <span
      style={{
        ...mono,
        color,
        background: `${color}22`,
        border: `1px solid ${color}55`,
        padding: '6px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {status}
    </span>
  );
}

function CallLedger() {
  const ref = useRef<HTMLDivElement | null>(null);
  const visible = useOnScreen(ref);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!visible) return;
    setShown(0);
    const id = window.setInterval(() => {
      setShown((value) => (value < LEDGER_STEPS.length ? value + 1 : value));
    }, 550);
    return () => window.clearInterval(id);
  }, [visible]);

  return (
    <div ref={ref} style={{ borderRadius: 20, border: `1px solid ${c.line}`, background: c.surface, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${c.line}` }}>
        <span style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', ...mono, color: c.muted }}>Call Ledger</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, ...mono, color: c.amber }}>
          <Radio size={12} style={{ animation: 'pulse 1.2s ease-in-out infinite' }} />
          LIVE
        </span>
      </div>
      <div>
        {LEDGER_STEPS.map((row, index) => {
          const active = index < shown;
          const Icon = row.Icon;
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 20px',
                borderBottom: index === LEDGER_STEPS.length - 1 ? 'none' : `1px solid ${c.line}`,
                opacity: active ? 1 : 0.25,
                transform: active ? 'translateX(0px)' : 'translateX(-8px)',
                transition: 'opacity 0.4s ease, transform 0.4s ease',
              }}
            >
              <span style={{ fontSize: 12, width: 56, flexShrink: 0, ...mono, color: c.muted }}>{row.time}</span>
              <Icon size={16} style={{ color: row.tone === 'amber' ? c.amber : c.ice, flexShrink: 0 }} />
              <span style={{ fontSize: 14, flex: 1, color: c.text }}>{row.event}</span>
              <StatusPill status={row.status} tone={row.tone} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Section({ children, style, id }: { children: ReactNode; style?: CSSProperties; id?: string }) {
  return (
    <section id={id} style={{ padding: '80px 0', ...style }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 20px' }}>{children}</div>
    </section>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <span style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', ...mono, color: c.ice }}>{children}</span>;
}

const PAIN_POINTS = [
  { Icon: Clock, title: 'Slow lead response', desc: 'Leads sit in a queue for hours before anyone answers.' },
  { Icon: XCircle, title: 'Missed follow-ups', desc: 'Interested buyers go quiet when no one follows up at the right moment.' },
  { Icon: TrendingUp, title: 'Low conversion', desc: 'Inconsistent scripts and rushed calls mean fewer site visits and closings.' },
  { Icon: Database, title: 'Manual CRM updates', desc: 'Rep work is delayed and pipeline data lags behind reality.' },
  { Icon: Users, title: 'Team overload', desc: 'Your best closers spend their day dialing instead of closing.' },
  { Icon: Sparkles, title: 'High acquisition cost', desc: 'You pay premium CPLs and lose leads before your team can engage them.' },
];

const FEATURES = [
  { Icon: Zap, title: 'Instant AI calling', desc: 'Every new lead gets contacted within seconds, no queue required.' },
  { Icon: CheckCircle2, title: 'AI lead qualification', desc: 'Budget, timeline, and intent are captured consistently on the first call.' },
  { Icon: Clock, title: 'Automatic follow-up', desc: 'Warm leads get re-contacted on a reliable schedule without manual reminders.' },
  { Icon: Database, title: 'CRM sync', desc: 'Call outcomes are written back to your CRM as soon as the conversation ends.' },
  { Icon: CalendarClock, title: 'Appointment booking', desc: 'Qualified buyers can be routed straight into your calendar.' },
  { Icon: Mic2, title: 'Call recording', desc: 'Every interaction is captured for review, training, and handoff.' },
  { Icon: BarChart3, title: 'Analytics view', desc: 'You can track speed, conversion, and pipeline health in one place.' },
  { Icon: Languages, title: 'Multi-language voice agents', desc: 'Leads can be spoken to in the language they understand best.' },
];

const AGENDA: AgendaItem[] = [
  { title: 'Live product demo', desc: 'A real AI call placed and qualified in front of you.' },
  { title: 'Real call examples', desc: 'See how objections, pricing questions, and cold leads are handled.' },
  { title: 'Workflow breakdown', desc: 'Understand how leads move from first contact to booked meeting.' },
  { title: 'ROI calculation', desc: 'Estimate payback based on your own lead volume and response rate.' },
  { title: 'Implementation roadmap', desc: 'Learn the rollout steps, integrations, and timeline required to go live.' },
  { title: 'Live Q&A', desc: 'Bring your toughest lead-flow and CRM questions to the session.' },
];

const TESTIMONIALS: Testimonial[] = [
  { quote: 'Our AI Voice Agent now calls every enquiry within a minute. Our site-visit conversions improved within the first month.', name: 'Rohit Malhotra', role: 'VP Sales, Signature Realty Group' },
  { quote: 'Our team used to lose track of follow-ups constantly. Now every lead gets called back on schedule automatically.', name: 'Priya Nair', role: 'Sales Head, Orchid Builders & Developers' },
  { quote: 'CRM entries used to be a week behind reality. Now every call updates our pipeline instantly.', name: 'Karan Deshpande', role: 'Founder, Deshpande Channel Partners' },
];

const FAQS: FaqItem[] = [
  { q: 'Is this just a sales pitch?', a: 'No. The session is practical, with a live product demo and a walkthrough of the workflow.' },
  { q: 'Do I need technical knowledge?', a: 'No. The workshop is built for founders, sales leaders, and operations teams.' },
  { q: 'Will I get a recording?', a: 'Yes. Every registrant receives the recording and the workshop resources.' },
  { q: 'How much does it cost?', a: 'The workshop is ₹199, discounted from ₹1,099, and includes the live session plus the recording.' },
  { q: 'Who should attend?', a: 'Teams handling 500+ leads a day and looking to reduce response time and manual follow-up.' },
];

export default function WebinarLandingScreen() {
  const [mobileNav, setMobileNav] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showSticky, setShowSticky] = useState(false);
  const registerRef = useRef<HTMLDivElement | null>(null);
  const countdown = useCountdown('2026-08-25T16:00:00+05:30');

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const regTop = registerRef.current ? registerRef.current.getBoundingClientRect().top + window.scrollY : 999999;
      setShowSticky(y > 500 && y + window.innerHeight < regTop + 100);
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: c.base, color: c.text, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        @keyframes wavepulse { 0%,100% { transform: scaleY(0.3); opacity: .55; } 50% { transform: scaleY(1); opacity: 1; } }
        @keyframes pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.25); opacity: 0.7; } }
        
        .founder-img-wrapper {
          width: 100%;
          max-width: 420px;
          aspect-ratio: 3 / 4;
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid ${c.line};
          background: ${c.elevated};
          position: relative;
          margin: 0 auto;
        }

        .founder-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 20%;
        }

        .floating-call-card {
          position: absolute;
          right: -12px;
          bottom: -24px;
          width: 92%;
          max-width: 360px;
          border-radius: 18px;
          padding: 16px;
          border: 1px solid ${c.blue}66;
          background: ${c.surface}FA;
          backdrop-filter: blur(12px);
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.6);
          z-index: 10;
        }

        @media (max-width: 767px) {
          .floating-call-card {
            position: relative;
            right: 0;
            bottom: 0;
            margin-top: -30px;
            width: 100%;
            max-width: 100%;
          }
          .founder-img-wrapper {
            max-width: 100%;
            aspect-ratio: 4 / 5;
          }
        }

        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .desktop-cta { display: inline-flex !important; }
          .hamburger-btn { display: none !important; }
          .hero-grid { grid-template-columns: 1.1fr 0.9fr !important; }
          .stats-grid { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
          .pain-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
          .feature-grid { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
          .ledger-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .agenda-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .speaker-grid { grid-template-columns: 320px 1fr !important; }
          .testimonial-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
          .register-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }

        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>

      {/* Header */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: `${c.base}CC`, borderBottom: `1px solid ${c.line}`, backdropFilter: 'blur(16px)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 20px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="#top" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: c.text }}>
            <span style={{ width: 36, height: 36, borderRadius: 999, overflow: 'hidden', border: `1px solid ${c.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.surface }}>
              <img src={LOGO_IMG} alt="Maxsas AI logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </span>
            <span style={{ ...display, fontWeight: 600, fontSize: 16 }}>Maxsas <span style={{ color: c.blueLight }}>AI</span></span>
          </a>
          <nav className="desktop-nav" style={{ display: 'none', alignItems: 'center', gap: 28, color: c.muted, fontSize: 14 }}>
            <a href="#agenda" style={{ color: c.muted, textDecoration: 'none' }}>What You&apos;ll Learn</a>
            <a href="#ledger" style={{ color: c.muted, textDecoration: 'none' }}>How It Works</a>
            <a href="#speaker" style={{ color: c.muted, textDecoration: 'none' }}>Speaker</a>
            <a href="#faq" style={{ color: c.muted, textDecoration: 'none' }}>FAQ</a>
          </nav>
          <a href="#register" className="desktop-cta" style={{ display: 'none', alignItems: 'center', gap: 8, background: c.blue, color: '#fff', padding: '10px 16px', borderRadius: 999, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            Reserve My Seat — ₹199
          </a>
          <button className="hamburger-btn" onClick={() => setMobileNav((value) => !value)} aria-label="Toggle menu" style={{ display: 'flex', border: 'none', background: 'transparent', color: c.text, cursor: 'pointer' }}>
            {mobileNav ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {mobileNav && (
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, borderTop: `1px solid ${c.line}`, background: c.surface }}>
            <a href="#agenda" onClick={() => setMobileNav(false)} style={{ color: c.muted, textDecoration: 'none' }}>What You&apos;ll Learn</a>
            <a href="#ledger" onClick={() => setMobileNav(false)} style={{ color: c.muted, textDecoration: 'none' }}>How It Works</a>
            <a href="#speaker" onClick={() => setMobileNav(false)} style={{ color: c.muted, textDecoration: 'none' }}>Speaker</a>
            <a href="#faq" onClick={() => setMobileNav(false)} style={{ color: c.muted, textDecoration: 'none' }}>FAQ</a>
            <a href="#register" onClick={() => setMobileNav(false)} style={{ background: c.blue, color: '#fff', textDecoration: 'none', textAlign: 'center', padding: '10px 14px', borderRadius: 999 }}>
              Reserve My Seat — ₹199
            </a>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="top" style={{ padding: '112px 0 72px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 15% 10%, ${c.blue}22, transparent 45%), radial-gradient(circle at 90% 0%, ${c.ice}18, transparent 40%)` }} />
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 20px', position: 'relative' }}>
          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 48, alignItems: 'center' }}>
            <Reveal>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, padding: '8px 12px', border: `1px solid ${c.line}`, background: `${c.surface}CC`, color: c.ice, fontSize: 12, ...mono }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: c.amber }} />
                LIVE WORKSHOP · LIMITED TO 100 SEATS · ₹199 ONLY
              </div>
              <h1 style={{ ...display, fontWeight: 600, lineHeight: 1.08, fontSize: 'clamp(2.2rem, 4vw, 3.8rem)', marginTop: 18 }}>
                Your leads are going cold<br />while your team is still <span style={{ color: c.blueLight }}>dialing.</span>
              </h1>
              <p style={{ marginTop: 18, fontSize: 16, lineHeight: 1.7, color: c.muted, maxWidth: 620 }}>
                See how real estate builders, brokerages, and channel partners use AI Voice Agents to call every lead in under 60 seconds and hand only qualified buyers to the closing team.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderRadius: 14, padding: '10px 14px', border: `1px solid ${c.line}`, background: c.surface }}>
                  <CalendarClock size={17} style={{ color: c.ice }} />
                  <span style={{ fontSize: 13, ...mono }}>Thu, 25 Aug 2026</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderRadius: 14, padding: '10px 14px', border: `1px solid ${c.line}`, background: c.surface }}>
                  <Clock size={17} style={{ color: c.ice }} />
                  <span style={{ fontSize: 13, ...mono }}>4:00 PM IST · Live on Zoom</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, marginTop: 24 }}>
                <a href="#register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: c.blue, color: '#fff', padding: '14px 22px', borderRadius: 999, fontWeight: 700, textDecoration: 'none', boxShadow: `0 10px 30px -8px ${c.blue}99` }}>
                  Reserve My Seat — ₹199 <ArrowRight size={16} />
                </a>
                <span style={{ fontSize: 12, color: c.muted, ...mono }}>₹199 only (worth ₹1,099) · Recording included</span>
              </div>
            </Reveal>

            {/* Founder Visual Card */}
            <Reveal delay={150}>
              <div style={{ position: 'relative' }}>
                <div className="founder-img-wrapper">
                  <img src={FOUNDER_IMG} alt="Anubhav Chaudhary" className="founder-img" />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(6, 8, 15, 0.95) 5%, rgba(0,0,0,0.1) 60%)' }} />
                  <div style={{ position: 'absolute', left: 20, bottom: 20, zIndex: 2 }}>
                    <p style={{ ...display, fontWeight: 600, fontSize: 16, color: c.text }}>Anubhav Chaudhary</p>
                    <p style={{ fontSize: 12, color: c.ice, ...mono }}>Founder &amp; CEO, Maxsas AI</p>
                  </div>
                </div>

                {/* Overlaid Floating AI Call Widget */}
                <div className="floating-call-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, ...mono, color: c.muted }}>REAL ESTATE AI AGENT</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, ...mono, color: c.amber }}><Radio size={11} style={{ animation: 'pulse 1.2s ease-in-out infinite' }} /> 00:42</span>
                  </div>
                  <Waveform size={18} />
                  <p style={{ fontSize: 12, marginTop: 10, lineHeight: 1.5, ...mono, color: c.text }}>“...3BHK in Whitefield, budget ₹80L-1.2Cr, site visit booked for Saturday.”</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: 11, ...mono }}>
                    <span style={{ padding: '4px 8px', borderRadius: 6, color: c.amber, background: `${c.amber}1A`, border: `1px solid ${c.amber}33` }}>Hot Lead Qualified 🔥</span>
                    <span style={{ color: c.ice }}>CRM Synced ✓</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section style={{ borderTop: `1px solid ${c.line}`, borderBottom: `1px solid ${c.line}`, background: `${c.surface}66`, padding: '36px 0' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 20px' }}>
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 24 }}>
            {[
              ['<60s', 'Average first-call response time'],
              ['3.2M+', 'Minutes of AI voice calls placed'],
              ['68%', 'Avg. lift in lead-to-meeting rate'],
              ['24/7', 'Always-on lead qualification'],
            ].map(([value, label]) => (
              <Reveal key={label}>
                <p style={{ ...display, fontWeight: 700, color: c.ice, fontSize: 32 }}>{value}</p>
                <p style={{ fontSize: 13, marginTop: 4, color: c.muted }}>{label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <Section>
        <Reveal>
          <Eyebrow>The Problem</Eyebrow>
          <h2 style={{ ...display, fontWeight: 600, fontSize: 'clamp(1.8rem, 3vw, 2.7rem)', lineHeight: 1.2, marginTop: 12, maxWidth: 700 }}>
            Every missed call is a lead you already paid for.
          </h2>
          <p style={{ marginTop: 14, fontSize: 16, lineHeight: 1.7, color: c.muted, maxWidth: 720 }}>
            You are spending on ads, listings, and referral partners to bring in leads, then losing a large share of them before your team even picks up the phone.
          </p>
        </Reveal>
        <div className="pain-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginTop: 28 }}>
          {PAIN_POINTS.map((item, index) => (
            <Reveal key={item.title} delay={index * 60}>
              <div style={{ borderRadius: 20, padding: 20, border: `1px solid ${c.line}`, background: c.surface, height: '100%' }}>
                <item.Icon size={24} style={{ color: c.blueLight, marginBottom: 12 }} />
                <h3 style={{ ...display, fontWeight: 600, fontSize: 18, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: c.muted }}>{item.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Solutions / Features */}
      <Section style={{ background: `${c.surface}66`, borderTop: `1px solid ${c.line}`, borderBottom: `1px solid ${c.line}` }}>
        <Reveal>
          <Eyebrow>The Solution</Eyebrow>
          <h2 style={{ ...display, fontWeight: 600, fontSize: 'clamp(1.8rem, 3vw, 2.7rem)', lineHeight: 1.2, marginTop: 12, maxWidth: 700 }}>
            Maxsas AI Voice Infrastructure
          </h2>
          <p style={{ marginTop: 14, fontSize: 16, lineHeight: 1.7, color: c.muted, maxWidth: 720 }}>
            One system that calls, qualifies, follows up, updates your CRM, and books meetings so your team only connects with buyers who are ready.
          </p>
        </Reveal>
        <div className="feature-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, marginTop: 28 }}>
          {FEATURES.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 50}>
              <div style={{ borderRadius: 20, padding: 20, border: `1px solid ${c.line}`, background: c.surface, height: '100%' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${c.blue}22`, marginBottom: 12 }}>
                  <feature.Icon size={20} style={{ color: c.ice }} />
                </div>
                <h3 style={{ ...display, fontWeight: 600, fontSize: 18, marginBottom: 6 }}>{feature.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: c.muted }}>{feature.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Ledger Section */}
      <Section id="ledger">
        <div className="ledger-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 36, alignItems: 'start' }}>
          <Reveal>
            <Eyebrow>The Workflow</Eyebrow>
            <h2 style={{ ...display, fontWeight: 600, fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', lineHeight: 1.2, marginTop: 12 }}>
              From new lead to booked meeting without a human touching it.
            </h2>
            <p style={{ marginTop: 14, fontSize: 16, lineHeight: 1.7, color: c.muted }}>
              Every lead follows the same six-stage path, and each stage updates the ledger instantly.
            </p>
          </Reveal>
          <Reveal delay={150}>
            <CallLedger />
          </Reveal>
        </div>
      </Section>

      {/* Agenda */}
      <Section id="agenda" style={{ background: `${c.surface}66`, borderTop: `1px solid ${c.line}`, borderBottom: `1px solid ${c.line}` }}>
        <Reveal>
          <Eyebrow>Workshop Agenda</Eyebrow>
          <h2 style={{ ...display, fontWeight: 600, fontSize: 'clamp(1.8rem, 3vw, 2.7rem)', lineHeight: 1.2, marginTop: 12, maxWidth: 700 }}>
            What you&apos;ll walk away with
          </h2>
        </Reveal>
        <div className="agenda-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginTop: 28 }}>
          {AGENDA.map((item, index) => (
            <Reveal key={item.title} delay={index * 60}>
              <div style={{ display: 'flex', gap: 12, borderRadius: 20, padding: 20, border: `1px solid ${c.line}`, background: `${c.surface}99` }}>
                <ArrowRight size={16} style={{ color: c.ice, flexShrink: 0, marginTop: 2 }} />
                <div>
                  <h3 style={{ ...display, fontWeight: 600, fontSize: 18, marginBottom: 6 }}>{item.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: c.muted }}>{item.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Host Section */}
      <Section id="speaker">
        <Reveal>
          <Eyebrow>Your Host</Eyebrow>
        </Reveal>
        <Reveal delay={100}>
          <div className="speaker-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32, marginTop: 20, borderRadius: 28, padding: '24px 28px', border: `1px solid ${c.line}`, background: c.surface, alignItems: 'center' }}>
            <div className="founder-img-wrapper" style={{ margin: 0 }}>
              <img src={FOUNDER_IMG} alt="Anubhav Chaudhary" className="founder-img" />
            </div>
            <div>
              <h3 style={{ ...display, fontWeight: 600, fontSize: 'clamp(1.5rem, 2.5vw, 2rem)' }}>Anubhav Chaudhary</h3>
              <p style={{ fontSize: 13, marginTop: 4, color: c.ice, ...mono }}>Founder &amp; CEO, Maxsas AI</p>
              <p style={{ marginTop: 16, lineHeight: 1.7, color: c.muted }}>
                Anubhav founded Maxsas AI to close the gap between how fast real estate leads arrive and how slowly they typically get worked. He leads product and voice-AI strategy at Maxsas and runs this workshop personally.
              </p>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* Testimonials */}
      <Section style={{ background: `${c.surface}66`, borderTop: `1px solid ${c.line}`, borderBottom: `1px solid ${c.line}` }}>
        <Reveal>
          <Eyebrow>What teams are saying</Eyebrow>
          <h2 style={{ ...display, fontWeight: 600, fontSize: 'clamp(1.8rem, 3vw, 2.7rem)', lineHeight: 1.2, marginTop: 12, maxWidth: 700 }}>
            Real teams, real results
          </h2>
        </Reveal>
        <div className="testimonial-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginTop: 24 }}>
          {TESTIMONIALS.map((item, index) => (
            <Reveal key={item.name} delay={index * 80}>
              <div style={{ borderRadius: 20, padding: 20, border: `1px solid ${c.line}`, background: c.base, height: '100%' }}>
                <p style={{ color: c.amber, fontSize: 14, marginBottom: 12 }}>★★★★★</p>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: c.muted, marginBottom: 16 }}>“{item.quote}”</p>
                <p style={{ ...display, fontWeight: 600, fontSize: 16 }}>{item.name}</p>
                <p style={{ fontSize: 12, color: c.muted, ...mono, marginTop: 4 }}>{item.role}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq">
        <Reveal>
          <Eyebrow>FAQ</Eyebrow>
          <h2 style={{ ...display, fontWeight: 600, fontSize: 'clamp(1.8rem, 3vw, 2.7rem)', lineHeight: 1.2, marginTop: 12, maxWidth: 700 }}>Questions you might have</h2>
        </Reveal>
        <div style={{ maxWidth: 760, marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FAQS.map((item, index) => {
            const open = openFaq === index;
            return (
              <Reveal key={item.q} delay={index * 40}>
                <div style={{ borderRadius: 18, overflow: 'hidden', border: `1px solid ${c.line}`, background: c.surface }}>
                  <button onClick={() => setOpenFaq(open ? null : index)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', color: c.text, padding: '16px 18px', cursor: 'pointer' }}>
                    <span style={{ ...display, fontWeight: 500, fontSize: 15 }}>{item.q}</span>
                    <ChevronDown size={18} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', color: c.ice }} />
                  </button>
                  <div style={{ maxHeight: open ? 220 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                    <p style={{ fontSize: 14, lineHeight: 1.7, color: c.muted, padding: '0 18px 16px' }}>{item.a}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Section>

      {/* Registration Section */}
      <section id="register" ref={registerRef} style={{ padding: '84px 0', background: `${c.surface}88`, borderTop: `1px solid ${c.line}`, borderBottom: `1px solid ${c.line}` }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 20px' }}>
          <div className="register-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 36, alignItems: 'start' }}>
            <Reveal>
              <Eyebrow>Reserve your seat</Eyebrow>
              <h2 style={{ ...display, fontWeight: 600, fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', lineHeight: 1.2, marginTop: 12 }}>
                Seats are capped at 100 to keep the Q&amp;A useful.
              </h2>
              <p style={{ marginTop: 14, lineHeight: 1.7, color: c.muted }}>
                Fill in your details below. You&apos;ll get the Zoom link, calendar invite, and a reminder before the session, plus the recording afterward either way.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24, padding: 16, borderRadius: 16, border: `1px solid ${c.blue}66`, background: c.elevated }}>
                <div style={{ width: 44, height: 44, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${c.amber}22` }}>
                  <Sparkles size={20} style={{ color: c.amber }} />
                </div>
                <div>
                  <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.2em', color: c.muted }}>Workshop fee</p>
                  <p style={{ ...display, fontWeight: 600, fontSize: 24 }}>₹199 <span style={{ color: c.muted, textDecoration: 'line-through', fontSize: 16, fontWeight: 400 }}>₹1,099</span></p>
                  <p style={{ fontSize: 12, color: c.ice, ...mono }}>One-time · Recording &amp; resources included</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, padding: 16, borderRadius: 16, border: `1px solid ${c.line}`, background: c.base }}>
                <div style={{ width: 44, height: 44, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${c.blue}22` }}>
                  <Timer size={20} style={{ color: c.ice }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, color: c.muted, ...mono }}>Workshop starts in</p>
                  <p style={{ ...display, fontWeight: 600, color: c.ice, fontSize: 18 }}>{countdown}</p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={150}>
              <div style={{ borderRadius: 24, padding: 24, border: `1px solid ${c.blue}55`, background: c.base }}>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const form = event.currentTarget;
                    const formData = new FormData(form);
                    router.push({
                      pathname: '/webinar-register',
                      params: {
                        fullName: String(formData.get('fullName') || ''),
                        phone: String(formData.get('phone') || ''),
                        email: String(formData.get('email') || ''),
                        company: String(formData.get('company') || ''),
                      },
                    });
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                >
                  {[
                    { label: 'Full name', type: 'text', placeholder: 'Your full name', name: 'fullName' },
                    { label: 'Phone number', type: 'tel', placeholder: '+91 98765 43210', name: 'phone' },
                    { label: 'Work email', type: 'email', placeholder: 'you@company.com', name: 'email' },
                    { label: 'Company name', type: 'text', placeholder: 'Your company', name: 'company' },
                  ].map((field) => (
                    <label key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: c.muted }}>
                      <span>{field.label}</span>
                      <input name={field.name} required type={field.type} placeholder={field.placeholder} style={{ padding: '12px 14px', borderRadius: 12, border: `1px solid ${c.line}`, background: c.surface, color: c.text, outline: 'none' }} />
                    </label>
                  ))}
                  <button type="submit" style={{ marginTop: 6, padding: '14px 16px', borderRadius: 12, border: 'none', background: c.blue, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>Reserve My Seat — ₹199</button>
                </form>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Sticky Mobile Registration CTA */}
      <div style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 60, transform: showSticky ? 'translateY(0px)' : 'translateY(140%)', transition: 'transform 0.3s ease' }}>
        <a href="#register" style={{ display: 'inline-flex', padding: '12px 20px', borderRadius: 999, background: c.blue, color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14, boxShadow: `0 10px 30px -8px ${c.blue}CC` }}>
          Reserve My Seat — ₹199
        </a>
      </div>
    </div>
  );
}