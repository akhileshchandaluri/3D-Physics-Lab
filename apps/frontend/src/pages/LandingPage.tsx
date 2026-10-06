import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './LandingPage.css';

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
);
const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
);

/* ─── tiny SVG icons (inline to avoid deps) ─── */
const BeakerIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 3h15"/><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3"/><path d="M6 14h12"/></svg>
);
const BoltIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
);
const ChartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
);
const AtomIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"/></svg>
);
const CpuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>
);
const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
);
const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
);
const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);
/* ─── Course sessions ─── */
const experiments = [
  {
    title: "Ohm's Law",
    description: "Session 01. Change the voltage and the resistance, and read the current.",
    icon: <BoltIcon />,
    color: '#8d1b2e',
    status: 'Available' as const,
    path: '/experiments/ohms-law',
  },
  {
    title: 'Lattice constant',
    description: 'Session 02. Determination of lattice constant. This session is listed and not built yet.',
    icon: <AtomIcon />,
    color: '#3c414c',
    status: 'Not built yet' as const,
    path: '',
  },
  {
    title: 'Lycopodium powder',
    description: 'Session 03. Particle size of lycopodium powder using a laser. This session is listed and not built yet.',
    icon: <ChartIcon />,
    color: '#7cb342',
    status: 'Not built yet' as const,
    path: '',
  },
  {
    title: "Young's modulus",
    description: 'Session 04. Uniform bending method. This session is listed and not built yet.',
    icon: <BeakerIcon />,
    color: '#8d1b2e',
    status: 'Not built yet' as const,
    path: '',
  },
  {
    title: 'Creep constant',
    description: 'Session 05. Hang a steady weight on a wire and find the two creep numbers, β and k.',
    icon: <CpuIcon />,
    color: '#7cb342',
    status: 'Available' as const,
    path: '/experiments/creep-constant',
  },
  {
    title: 'Hall effect',
    description: 'Session 06. Hall coefficient. This session is listed and not built yet.',
    icon: <ShieldIcon />,
    color: '#3c414c',
    status: 'Not built yet' as const,
    path: '',
  },
  {
    title: "Planck's constant",
    description: 'Session 07. This session is listed and not built yet.',
    icon: <UsersIcon />,
    color: '#8d1b2e',
    status: 'Not built yet' as const,
    path: '',
  },
  {
    title: 'Solar cell',
    description: 'Session 08. Solar cell characteristics. This session is listed and not built yet.',
    icon: <AtomIcon />,
    color: '#3c414c',
    status: 'Not built yet' as const,
    path: '',
  },
];

const features = [
  {
    icon: <BoltIcon />,
    title: 'Change a quantity',
    desc: 'Move a control and watch the reading change. The number on the instrument is the one you write down.',
  },
  {
    icon: <ChartIcon />,
    title: 'Table and graph',
    desc: 'The session draws the table and the graph from your readings, so you can copy them into the lab record.',
  },
  {
    icon: <AtomIcon />,
    title: 'Workbook equations',
    desc: 'The models follow the equations in the physics workbook for this course.',
  },
  {
    icon: <CpuIcon />,
    title: 'Save a session',
    desc: 'Sign in, save the setup, and open it again when you write the record.',
  },
  {
    icon: <ShieldIcon />,
    title: 'No extra software',
    desc: 'The lab opens in the browser. Nothing has to be installed on the lab computer.',
  },
  {
    icon: <UsersIcon />,
    title: 'Class account',
    desc: 'Use the account your teacher gave you. A teacher can also open the classroom page.',
  },
];

const labNotes = [
  {
    title: 'Take the readings',
    text: 'Read the instruments in the session. Do not invent a number that the instrument does not show.',
  },
  {
    title: 'Save the session',
    text: 'Save before you leave. The saved session keeps the setup so you can open it again for the lab record.',
  },
  {
    title: 'Check the graph',
    text: 'Compare the graph with the workbook. The slope is the quantity the session asks you to find.',
  },
];

const stats = [
  { value: '8', label: 'Sessions' },
  { value: '2', label: 'Ready to open' },
];

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const heroRef = useRef<HTMLDivElement>(null);

  /* parallax mouse glow */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  /* intersection observer for scroll animations */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.scroll-reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing">
      {/* ────── NAVBAR ────── */}
      <nav className="navbar" id="navbar">
        <div className="navbar-inner">
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="navbar-brand">
            <div className="brand-icon">
              <AtomIcon />
            </div>
            <span className="brand-text">PhySim Lab</span>
          </Link>
          <div className="navbar-links">
            <a href="#experiments">Experiments</a>
            <a href="#how-it-works">How the lab works</a>
            <a href="#lab-record">Lab record</a>
            <a href="#faq">Questions</a>
            <Link to="/login?role=teacher" style={{ color: '#fff', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>Educators</Link>
          </div>
          <div className="navbar-actions">
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme" id="theme-toggle-btn">
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary-sm" id="nav-dashboard-btn">Open the lab</Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost" id="nav-login-btn">Sign in</Link>
                <Link to={isAuthenticated ? '/dashboard' : '/login'} className="btn-primary-sm" id="nav-signup-btn">Open the lab</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ────── HERO ────── */}
      <section className="hero-section" id="hero" ref={heroRef}>
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-orb hero-orb-3" />
          <div className="hero-grid" />
        </div>

        <div className="hero-content">
          <div className="hero-badge animate-fade-in-up">
            <span className="badge-dot" />
            Ohm's Law and Creep Constant are ready
          </div>

          <h1 className="hero-title animate-fade-in-up delay-100">
            College physics laboratory<br />
            <span className="gradient-text">Virtual experiments for this course</span>
          </h1>

          <p className="hero-subtitle animate-fade-in-up delay-200">
            Sign in with the account from class. Two sessions can be opened today.
            The other sessions are listed here and are not built yet.
          </p>

          <div className="hero-actions animate-fade-in-up delay-300">
            <Link to={isAuthenticated ? "/dashboard" : "/login"} className="btn-primary" id="hero-signup-btn">
              Open the lab
              <ArrowRightIcon />
            </Link>
            <a href="#experiments" className="btn-outline" id="hero-explore-btn">
              <PlayIcon />
              See the sessions
            </a>
          </div>

          <div className="hero-stats animate-fade-in-up delay-400">
            {stats.map((s) => (
              <div key={s.label} className="hero-stat">
                <span className="hero-stat-value">{s.value}</span>
                <span className="hero-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* floating atoms decoration */}
        <div className="hero-decoration">
          <div className="floating-atom atom-1" style={{ animationDelay: '0s' }}><AtomIcon /></div>
          <div className="floating-atom atom-2" style={{ animationDelay: '1s' }}><BoltIcon /></div>
          <div className="floating-atom atom-3" style={{ animationDelay: '2s' }}><BeakerIcon /></div>
        </div>
      </section>

      {/* ────── SOCIAL PROOF BAR ────── */}
      <section className="proof-bar scroll-reveal">
        <div className="proof-inner">
          <p className="proof-label">Sessions in this laboratory</p>
          <div className="proof-logos">
            {["Ohm's law", 'Lattice constant', "Young's modulus", 'Creep', 'Hall effect', "Planck's constant", 'Solar cell'].map((d) => (
              <span key={d} className="proof-dept">{d}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ────── EXPERIMENTS ────── */}
      <section className="section" id="experiments">
        <div className="section-inner">
          <div className="section-header scroll-reveal">
            <span className="section-tag">This course</span>
            <h2 className="section-title">The eight laboratory sessions</h2>
            <p className="section-desc">
              These are the sessions in the catalog. Ohm's Law and Creep Constant can be opened now.
            </p>
          </div>

          <div className="experiments-grid">
            {experiments.map((exp, i) => (
              <div
                key={exp.title}
                className="experiment-card scroll-reveal"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="exp-card-glow" style={{ background: `${exp.color}15` }} />
                <div className="exp-icon" style={{ color: exp.color, background: `${exp.color}15` }}>
                  {exp.icon}
                </div>
                <h3 className="exp-title">{exp.title}</h3>
                <p className="exp-desc">{exp.description}</p>
                <div className="exp-footer">
                  <span
                    className={`exp-status ${exp.status === 'Available' ? 'status-live' : 'status-soon'}`}
                  >
                    <span className="status-dot" />
                    {exp.status}
                  </span>
                  {exp.status === 'Available' ? (
                    <Link to={isAuthenticated ? exp.path : '/login'} className="exp-link">
                      Open <ArrowRightIcon />
                    </Link>
                  ) : (
                    <span className="exp-link disabled">Not built yet</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────── FEATURES ────── */}
      <section className="section section-alt" id="features">
        <div className="section-inner">
          <div className="section-header scroll-reveal">
            <span className="section-tag">In the session</span>
            <h2 className="section-title">What you do in the lab</h2>
            <p className="section-desc">
              Change a quantity, read the instrument, and copy the table and the graph into the lab record.
            </p>
          </div>

          <div className="features-grid">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="feature-card scroll-reveal"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────── HOW IT WORKS ────── */}
      <section className="section" id="how-it-works">
        <div className="section-inner">
          <div className="section-header scroll-reveal">
            <span className="section-tag">In class</span>
            <h2 className="section-title">Three steps</h2>
            <p className="section-desc">
              Sign in, open a session, and record the readings.
            </p>
          </div>

          <div className="steps-row">
            {[
              { num: '01', title: 'Sign in', desc: 'Use the account from class. Your saved sessions stay with that account.' },
              { num: '02', title: 'Open a session', desc: 'Ohm\'s Law and Creep Constant are ready. The other six sessions are on the list and are not built yet.' },
              { num: '03', title: 'Record the readings', desc: 'Read the instruments, save the session, and copy the table and the graph into the lab record.' },
            ].map((step, i) => (
              <div key={step.num} className="step-card scroll-reveal" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="step-num">{step.num}</div>
                <div className="step-connector" />
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────── TESTIMONIALS ────── */}
      <section className="section section-alt" id="lab-record">
        <div className="section-inner">
          <div className="section-header scroll-reveal">
            <span className="section-tag">Lab record</span>
            <h2 className="section-title">What goes in the record</h2>
            <p className="section-desc">
              The session is the practical. The record is what you write from it.
            </p>
          </div>

          <div className="testimonials-grid">
            {labNotes.map((note, i) => (
              <div key={note.title} className="testimonial-card scroll-reveal" style={{ animationDelay: `${i * 0.12}s` }}>
                <h3 className="feature-title">{note.title}</h3>
                <p className="testimonial-text">{note.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────── FAQ ────── */}
      <section className="section" id="faq">
        <div className="section-inner section-narrow">
          <div className="section-header scroll-reveal">
            <span className="section-tag">Questions</span>
            <h2 className="section-title">Before you open a session</h2>
          </div>

          <div className="faq-list">
            {[
              { q: 'Who can sign in?', a: 'Students in this physics laboratory, with the account from class. A teacher signs in to open the classroom page.' },
              { q: 'Do I need to install anything?', a: 'No. The lab runs in the browser on the computer you use for the practical.' },
              { q: 'Can these readings go in the lab record?', a: 'Yes. Copy the table and the graph from the session into the record. Read the instruments. Do not type a number the instrument does not show.' },
              { q: 'Which sessions can I open?', a: 'Ohm\'s Law and Determination of Creep Constant. The other six sessions are on the list and are not built yet.' },
              { q: 'What if I need to start the practical again?', a: 'Reset that session. A session you already saved stays in your account until you delete it.' },
            ].map((faq, i) => (
              <details key={i} className="faq-item scroll-reveal" style={{ animationDelay: `${i * 0.08}s` }}>
                <summary className="faq-question">{faq.q}</summary>
                <p className="faq-answer">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ────── CTA ────── */}
      <section className="cta-section scroll-reveal" id="cta">
        <div className="cta-bg">
          <div className="cta-orb cta-orb-1" />
          <div className="cta-orb cta-orb-2" />
        </div>
        <div className="cta-content">
          <h2 className="cta-title">Sign in and open the lab</h2>
          <p className="cta-desc">
            Use the account from class. Ohm's Law and Creep Constant are ready.
          </p>
          <div className="cta-actions">
            <Link to="/login" className="btn-primary btn-lg" id="cta-signup-btn">
              Sign in
              <ArrowRightIcon />
            </Link>
            <Link to={isAuthenticated ? '/dashboard' : '/login'} className="btn-outline btn-lg" id="cta-login-btn">
              Open the lab
            </Link>
          </div>
        </div>
      </section>

      {/* ────── FOOTER ────── */}
      <footer className="footer" id="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="brand-icon"><AtomIcon /></div>
            <span className="brand-text">PhySim Lab</span>
            <p className="footer-tagline">A college physics laboratory project.</p>
          </div>

          <div className="footer-links-group">
            <div className="footer-col">
              <h4>Laboratory</h4>
              <a href="#experiments">Sessions</a>
              <a href="#features">In the session</a>
              <a href="#how-it-works">How the lab works</a>
            </div>
            <div className="footer-col">
              <h4>Course</h4>
              <a href="#faq">Questions</a>
              <a href="#lab-record">Lab record</a>
              <Link to="/login">Sign in</Link>
            </div>
            <div className="footer-col">
              <h4>Account</h4>
              <Link to="/login">Sign in</Link>
              <Link to="/login?role=teacher">Teacher</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} PhySim Lab. A college physics laboratory project.</p>
        </div>
      </footer>
    </div>
  );
}
