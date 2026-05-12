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
const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
);
const QuoteIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" opacity="0.15"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
);

/* ─── Experiments data ─── */
const experiments = [
  {
    title: "Ohm's Law",
    description: "Explore voltage, current, and resistance relationships with interactive circuit simulations.",
    icon: <BoltIcon />,
    color: '#6366f1',
    status: 'Available',
  },
  {
    title: "Simple Pendulum",
    description: "Study oscillatory motion by varying length, mass, and gravitational acceleration.",
    icon: <AtomIcon />,
    color: '#8b5cf6',
    status: 'Coming Soon',
  },
  {
    title: "Projectile Motion",
    description: "Launch projectiles at different angles and velocities to analyze parabolic trajectories.",
    icon: <ChartIcon />,
    color: '#a855f7',
    status: 'Coming Soon',
  },
  {
    title: "Snell's Law",
    description: "Visualize light refraction through different media and verify Snell's law interactively.",
    icon: <BeakerIcon />,
    color: '#c084fc',
    status: 'Coming Soon',
  },
  {
    title: "Newton's Cooling",
    description: "Observe how temperature changes over time and verify Newton's law of cooling.",
    icon: <CpuIcon />,
    color: '#10b981',
    status: 'Coming Soon',
  },
  {
    title: "Wave Interference",
    description: "Combine two waves and observe constructive & destructive interference patterns.",
    icon: <AtomIcon />,
    color: '#f97316',
    status: 'Coming Soon',
  },
];

const features = [
  {
    icon: <BoltIcon />,
    title: "Real-Time Simulations",
    desc: "Interactive physics engines that respond instantly to parameter changes with smooth 60fps rendering.",
  },
  {
    icon: <ChartIcon />,
    title: "Live Data Visualization",
    desc: "Auto-generated graphs and charts that plot your experimental data in real-time as you adjust variables.",
  },
  {
    icon: <AtomIcon />,
    title: "Accurate Physics Models",
    desc: "Built on validated equations and models used in academic research and standardized curricula.",
  },
  {
    icon: <CpuIcon />,
    title: "Session Progress Tracking",
    desc: "Save your experiment sessions, track observations, and export results for lab reports.",
  },
  {
    icon: <ShieldIcon />,
    title: "Safe Experimentation",
    desc: "No broken equipment, no safety hazards — explore freely without limits or consequences.",
  },
  {
    icon: <UsersIcon />,
    title: "Collaborative Learning",
    desc: "Share experiment setups with classmates, compare results, and learn together in real-time.",
  },
];

const testimonials = [
  {
    name: "Arjun Reddy",
    role: "3rd Year, ECE",
    text: "The Ohm's Law simulation helped me visualize what I'd only seen in textbooks. My lab understanding improved dramatically.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "2nd Year, CSE",
    text: "I love how I can experiment without worrying about breaking expensive lab equipment. The real-time graphs are incredibly helpful.",
    rating: 5,
  },
  {
    name: "Karthik Nair",
    role: "4th Year, Mechanical",
    text: "The projectile motion simulator made our mechanics class so much more intuitive. Wish we had this from day one!",
    rating: 5,
  },
];

const stats = [
  { value: '6+', label: 'Experiments' },
  { value: '500+', label: 'Active Users' },
  { value: '10K+', label: 'Simulations Run' },
  { value: '4.8', label: 'Avg Rating' },
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
          <Link to="/" className="navbar-brand">
            <img src="/klulogo.png" alt="KLU Logo" className="brand-logo-img" />
            <span className="brand-text">Virtual Labs</span>
          </Link>
          <div className="navbar-links">
            <a href="#experiments">Experiments</a>
            <a href="#features">Features</a>
            <a href="#testimonials">Reviews</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="navbar-actions">
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme" id="theme-toggle-btn">
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
            <Link to="/login" className="btn-ghost" id="nav-login-btn">Log In</Link>
            <Link to="/signup" className="btn-primary-sm" id="nav-signup-btn">Get Started</Link>
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
            Now Live — Ohm's Law Simulation
          </div>

          <h1 className="hero-title animate-fade-in-up delay-100">
            Master Physics Through<br />
            <span className="gradient-text">Interactive Simulations</span>
          </h1>

          <p className="hero-subtitle animate-fade-in-up delay-200">
            Experience hands-on virtual experiments that bring textbook concepts to life.
            Adjust parameters in real-time, visualize results instantly, and build deep
            intuitive understanding of physics principles.
          </p>

          <div className="hero-actions animate-fade-in-up delay-300">
            <Link to="/signup" className="btn-primary" id="hero-signup-btn">
              Start Experimenting
              <ArrowRightIcon />
            </Link>
            <a href="#experiments" className="btn-outline" id="hero-explore-btn">
              <PlayIcon />
              Explore Labs
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
          <p className="proof-label">Trusted by students across Engineering, Sciences & Mathematics departments</p>
          <div className="proof-logos">
            {['Physics', 'Electronics', 'Mechanics', 'Optics', 'Thermodynamics'].map((d) => (
              <span key={d} className="proof-dept">{d}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ────── EXPERIMENTS ────── */}
      <section className="section" id="experiments">
        <div className="section-inner">
          <div className="section-header scroll-reveal">
            <span className="section-tag">Virtual Laboratory</span>
            <h2 className="section-title">Explore Our Experiments</h2>
            <p className="section-desc">
              Each experiment is carefully designed to reinforce core physics concepts
              with real-time interactive simulations you can control.
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
                    <Link to={isAuthenticated ? '/dashboard' : '/login'} className="exp-link">
                      Launch <ArrowRightIcon />
                    </Link>
                  ) : (
                    <span className="exp-link disabled">Coming Soon</span>
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
            <span className="section-tag">Why Virtual Labs</span>
            <h2 className="section-title">Built for Real Understanding</h2>
            <p className="section-desc">
              Go beyond memorization — our platform is engineered to help you develop
              deep, intuitive understanding of physical phenomena.
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
            <span className="section-tag">Getting Started</span>
            <h2 className="section-title">Three Steps to Mastery</h2>
            <p className="section-desc">
              Our streamlined workflow gets you from login to lab results in minutes.
            </p>
          </div>

          <div className="steps-row">
            {[
              { num: '01', title: 'Create an Account', desc: 'Sign up in seconds with your email. Your progress and sessions are saved automatically.' },
              { num: '02', title: 'Choose an Experiment', desc: 'Browse our library of physics simulations. Each one is mapped to standard curriculum topics.' },
              { num: '03', title: 'Simulate & Learn', desc: 'Adjust variables, observe real-time changes, record readings, and export your results.' },
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
      <section className="section section-alt" id="testimonials">
        <div className="section-inner">
          <div className="section-header scroll-reveal">
            <span className="section-tag">Student Voices</span>
            <h2 className="section-title">Loved by Learners</h2>
            <p className="section-desc">
              Hear what students have to say about their experience with Virtual Labs.
            </p>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((t, i) => (
              <div key={t.name} className="testimonial-card scroll-reveal" style={{ animationDelay: `${i * 0.12}s` }}>
                <QuoteIcon />
                <p className="testimonial-text">{t.text}</p>
                <div className="testimonial-stars">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <StarIcon key={j} />
                  ))}
                </div>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.name[0]}</div>
                  <div>
                    <p className="testimonial-name">{t.name}</p>
                    <p className="testimonial-role">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────── FAQ ────── */}
      <section className="section" id="faq">
        <div className="section-inner section-narrow">
          <div className="section-header scroll-reveal">
            <span className="section-tag">FAQ</span>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>

          <div className="faq-list">
            {[
              { q: 'Is Virtual Labs free to use?', a: 'Yes! All basic simulations are completely free. Create an account and start experimenting immediately.' },
              { q: 'Do I need to install any software?', a: 'No installation required. Virtual Labs runs entirely in your browser on any device — desktop, tablet, or mobile.' },
              { q: 'Can I use simulation data for my lab reports?', a: 'Absolutely. You can export readings, graphs, and observations directly from each experiment session.' },
              { q: 'How accurate are the simulations?', a: 'Our models are built using validated physics equations and are reviewed by faculty. They closely mirror real-world lab behavior.' },
              { q: 'Will more experiments be added?', a: 'Yes! We regularly expand our library. Simple Pendulum, Projectile Motion, and Snell\'s Law are coming soon.' },
              { q: 'Can I reset my experiment and start over?', a: 'Of course. Each session can be reset to defaults or you can start a new session while keeping the previous one saved.' },
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
          <h2 className="cta-title">Ready to Transform How You Learn Physics?</h2>
          <p className="cta-desc">
            Join hundreds of students already mastering physics concepts through
            interactive virtual experiments. It's free, instant, and built for you.
          </p>
          <div className="cta-actions">
            <Link to="/signup" className="btn-primary btn-lg" id="cta-signup-btn">
              Create Free Account
              <ArrowRightIcon />
            </Link>
            <Link to="/login" className="btn-outline btn-lg" id="cta-login-btn">
              Log In
            </Link>
          </div>
        </div>
      </section>

      {/* ────── FOOTER ────── */}
      <footer className="footer" id="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src="/klulogo.png" alt="KLU Logo" className="brand-logo-img footer-logo" />
            <span className="brand-text">Virtual Labs</span>
            <p className="footer-tagline">Interactive physics simulations for the curious mind.</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Virtual Labs. Built with ❤️ for curious learners.</p>
        </div>
      </footer>
    </div>
  );
}
