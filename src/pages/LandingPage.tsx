import React, { useState, useEffect, useMemo, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Database,
  Network,
  Globe,
  Hash,
  Check,
  Cpu,
  Layers,
  FileCode2,
  Menu,
  X
} from 'lucide-react';
import '@fontsource/syne/600.css';
import '@fontsource/syne/700.css';
import { Badge, MockDataBadge } from '../components/ui';
import { ThreatRadar } from '../components/radar/ThreatRadar';
import { useAsync, useReducedMotion } from '../hooks';
import { api } from '../services/api';
import { Threat } from '../types';
import './LandingPage.css';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  // Load real telemetry records and radar data from backend
  const threatsAsync = useAsync(() => api.getThreats());
  const radarAsync = useAsync(() => api.getRadarBlips());

  const realThreats = threatsAsync.data || [];
  const nvdCount = realThreats.filter(t => (t.source || '').toLowerCase().includes('nvd')).length;
  const githubCount = realThreats.filter(t => (t.source || '').toLowerCase().includes('github')).length;

  // Factual trust line based on live connected records
  const trustLineText = useMemo(() => {
    if (nvdCount > 0 && githubCount > 0) {
      return `Collects from NVD (${nvdCount} records) and GitHub (${githubCount} records)`;
    }
    if (nvdCount > 0) {
      return `Collects from NVD (${nvdCount} records); GitHub connected`;
    }
    return 'Collects from NVD; GitHub connected';
  }, [nvdCount, githubCount]);

  // Real threats sorted by newest published first for Stage 5
  const sortedThreats = useMemo(() => {
    return [...realThreats].sort((a, b) => {
      const timeA = new Date(a.published || a.timestamp || 0).getTime();
      const timeB = new Date(b.published || b.timestamp || 0).getTime();
      return timeB - timeA;
    });
  }, [realThreats]);

  // Scroll position & sticky nav state
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeStage, setActiveStage] = useState<number>(1);

  // Stepper ref tracking for IntersectionObserver
  const stepRef1 = useRef<HTMLDivElement>(null);
  const stepRef2 = useRef<HTMLDivElement>(null);
  const stepRef3 = useRef<HTMLDivElement>(null);
  const stepRef4 = useRef<HTMLDivElement>(null);
  const stepRef5 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // IntersectionObserver for scroll-driven pipeline stages
  useEffect(() => {
    if (reducedMotion) return;

    const refs = [stepRef1, stepRef2, stepRef3, stepRef4, stepRef5];
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const stageIndex = parseInt(entry.target.getAttribute('data-stage') || '1', 10);
            setActiveStage(stageIndex);
          }
        });
      },
      {
        rootMargin: '-30% 0px -40% 0px',
        threshold: 0.1
      }
    );

    refs.forEach(r => {
      if (r.current) observer.observe(r.current);
    });

    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <div className="landing-root">
      {/* Accessible screen-reader text alternative for the animated pipeline */}
      <div className="sr-only" aria-live="polite">
        <h2>CyberNexus Threat Correlation Pipeline Overview</h2>
        <p>Stage 1: Ingestion noise. CyberNexus monitors disparate unstructured vulnerability feeds from NVD and GitHub advisories.</p>
        <p>Stage 2: Indicator extraction. In development. Heuristic regex and NLP algorithms parse deterministic observables including CVE IDs (e.g. CVE-2026-0000), IPv4 addresses, domain names, and cryptographic file hashes.</p>
        <p>Stage 3: Graph correlation. In development. Multi-relational bipartite graph analysis connects advisory notices that share identical indicators.</p>
        <p>Stage 4: Cluster attribution. In development. Louvain community detection clusters connected nodes into shared infrastructure leads with analytical lead disclaimers.</p>
        <p>Stage 5: Operational handoff. Live verified records ingested from the Flask backend telemetry service are presented in the command center feed.</p>
      </div>

      {/* 1. STICKY TOP NAVIGATION */}
      <header className={`landing-nav ${isScrolled ? 'scrolled' : ''}`} role="banner">
        <NavLink to="/" className="landing-nav-logo" aria-label="CyberNexus home">
          <div className="landing-logo-badge">CN</div>
          <span className="landing-logo-text">CyberNexus</span>
        </NavLink>

        <nav className="landing-nav-menu" aria-label="Primary navigation">
          <a href="#pipeline">How It Works</a>
          <a href="#sources">Sources</a>
          <a href="#capabilities">Capabilities</a>
          <a href="#architecture">Architecture</a>
          <a href="#method">Method</a>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            type="button"
            className="landing-nav-cta-btn"
            onClick={() => navigate('/dashboard')}
          >
            Enter Command Center
          </button>

          <button
            type="button"
            className="landing-mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="landing-mobile-drawer" role="navigation" aria-label="Mobile menu">
          <a href="#pipeline" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
          <a href="#sources" onClick={() => setMobileMenuOpen(false)}>Sources</a>
          <a href="#capabilities" onClick={() => setMobileMenuOpen(false)}>Capabilities</a>
          <a href="#architecture" onClick={() => setMobileMenuOpen(false)}>Architecture</a>
          <a href="#method" onClick={() => setMobileMenuOpen(false)}>Method</a>
          <button
            type="button"
            className="landing-btn-primary"
            style={{ width: '100%', marginTop: 'var(--space-2)' }}
            onClick={() => {
              setMobileMenuOpen(false);
              navigate('/dashboard');
            }}
          >
            Enter Command Center
          </button>
        </div>
      )}

      {/* 2. HERO + 5-STAGE PIPELINE STAGE */}
      <main id="main-content">
        <section className="landing-hero-section" id="pipeline" aria-labelledby="hero-title">
          <div className="landing-hero-grid">
            {/* Left Narrative Column */}
            <div className="landing-hero-narrative">
              <h1 id="hero-title" className="landing-hero-h1">
                From fragmented feeds to unified threat intelligence.
              </h1>

              {/* Supporting sentence: strictly under 25 words (19 words) */}
              <p className="landing-hero-sub">
                CyberNexus collects advisories from multiple vulnerability sources, with automated indicator extraction and graph correlation currently in active development.
              </p>

              {/* CTA Row (No arrows) */}
              <div className="landing-hero-actions">
                <button
                  type="button"
                  className="landing-btn-primary"
                  onClick={() => navigate('/dashboard')}
                >
                  Enter Command Center
                </button>
                <a href="#pipeline" className="landing-btn-secondary">
                  See how it works
                </a>
              </div>

              {/* Factual trust line */}
              <div className="landing-trust-line">
                <span className="landing-trust-dot" aria-hidden="true" />
                <span>{trustLineText}</span>
              </div>

              {/* Stepper Navigator triggers on Left Column (Vertical Rail) */}
              <div className="landing-stepper-nav" role="tablist" aria-label="Pipeline sequence stages">
                <div className="landing-stepper-rail-line" aria-hidden="true" />
                {[
                  { id: 1, tag: '01', title: 'Stage 1: Ingestion noise' },
                  { id: 2, tag: '02', title: 'Stage 2: Indicator extraction' },
                  { id: 3, tag: '03', title: 'Stage 3: Graph correlation' },
                  { id: 4, tag: '04', title: 'Stage 4: Cluster attribution' },
                  { id: 5, tag: '05', title: 'Stage 5: Operational handoff' }
                ].map(s => {
                  const isActive = activeStage === s.id;
                  const isCompleted = s.id < activeStage;
                  const stateClass = isActive ? 'active' : isCompleted ? 'completed' : 'upcoming';

                  return (
                    <div
                      key={s.id}
                      ref={
                        s.id === 1 ? stepRef1 :
                        s.id === 2 ? stepRef2 :
                        s.id === 3 ? stepRef3 :
                        s.id === 4 ? stepRef4 : stepRef5
                      }
                      data-stage={s.id}
                      className={`landing-stepper-btn ${stateClass}`}
                      role="tab"
                      aria-selected={isActive}
                      tabIndex={0}
                      onClick={() => setActiveStage(s.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveStage(s.id);
                        }
                      }}
                    >
                      <span className={`landing-stepper-dot ${stateClass}`} aria-hidden="true">
                        {isCompleted && <Check size={10} strokeWidth={3} />}
                      </span>
                      <span className="landing-stepper-num">{s.tag}</span>
                      <span className="landing-stepper-title">{s.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Sticky Pipeline Stage */}
            <div className="landing-sticky-stage-wrapper">
              {/* Mobile Stage Switcher Buttons */}
              <div className="landing-mobile-stage-tabs" role="tablist" aria-label="Mobile stage selector">
                {[
                  { id: 1, label: '1: Noise' },
                  { id: 2, label: '2: Extraction' },
                  { id: 3, label: '3: Connection' },
                  { id: 4, label: '4: Cluster' },
                  { id: 5, label: '5: Handoff' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeStage === tab.id}
                    className={`landing-mobile-tab-btn ${activeStage === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveStage(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Framed Interactive Stage Viewport */}
              <div
                className="landing-stage-frame"
                role="region"
                aria-label={`Interactive pipeline stage: Stage ${activeStage}`}
              >
                {/* Stage Header */}
                <div className="landing-stage-header">
                  <div className="landing-stage-label-group">
                    <span className="landing-stage-step-tag">
                      {activeStage === 1 && 'Stage 1: Ingestion noise'}
                      {activeStage === 2 && 'Stage 2: Indicator extraction'}
                      {activeStage === 3 && 'Stage 3: Graph correlation'}
                      {activeStage === 4 && 'Stage 4: Cluster attribution'}
                      {activeStage === 5 && 'Stage 5: Operational handoff'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    {activeStage < 5 ? (
                      <>
                        <MockDataBadge>Illustrative example</MockDataBadge>
                        {activeStage >= 2 && <Badge variant="planned">In development</Badge>}
                      </>
                    ) : (
                      <>
                        {threatsAsync.simulated ? (
                          <MockDataBadge>Simulated feed</MockDataBadge>
                        ) : (
                          <span className="ui-badge ui-badge-active">Collected records ● Real-time</span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Stage Viewport */}
                <div className="landing-stage-viewport">
                  {/* Faint Dotted Grid Background using token colour at low opacity */}
                  <svg className="stage-viewport-dot-grid" aria-hidden="true">
                    <defs>
                      <pattern id="stage-dot-grid-pattern" width="18" height="18" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1" fill="var(--border-subtle-color)" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#stage-dot-grid-pattern)" />
                  </svg>

                  {/* STAGE 1: NOISE (Raw unstructured advisory text drift) */}
                  {activeStage === 1 && (
                    <div className="stage-noise-container">
                      {/* Rotating ThreatRadar as subtle backdrop motif */}
                      <div className="stage-noise-radar-backdrop" aria-hidden="true">
                        <ThreatRadar
                          data={radarAsync.data}
                          loading={false}
                          className="radar-embedded-landing"
                          showLegend={false}
                          showCaption={false}
                        />
                      </div>

                      <div className="stage-noise-sentence drift-1 stage-card-stagger stagger-1">
                        &quot;Buffer overflow in daemon allows remote code execution via network payload...&quot;
                        <span style={{ display: 'block', fontSize: '10px', color: 'var(--landing-cyan)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                          (NVD CVE-2026-0000 disclosure draft)
                        </span>
                      </div>

                      <svg className="stage-inline-connector-svg" viewBox="0 0 400 14" preserveAspectRatio="none" aria-hidden="true">
                        <line x1="200" y1="0" x2="200" y2="14" stroke="var(--landing-cyan-border)" strokeWidth="1" />
                      </svg>

                      <div className="stage-noise-sentence drift-2 stage-card-stagger stagger-2">
                        &quot;...adversary observed utilizing 192.0.2.1 for primary egress beaconing across affected instances...&quot;
                      </div>

                      <svg className="stage-inline-connector-svg" viewBox="0 0 400 14" preserveAspectRatio="none" aria-hidden="true">
                        <line x1="200" y1="0" x2="200" y2="14" stroke="var(--landing-cyan-border)" strokeWidth="1" />
                      </svg>

                      <div className="stage-noise-sentence drift-3 stage-card-stagger stagger-3">
                        &quot;...associated with malicious domain example.net dropping secondary executable with hash sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef...&quot;
                      </div>
                    </div>
                  )}

                  {/* STAGE 2: EXTRACTION (Monospace indicator lift-out) */}
                  {activeStage === 2 && (
                    <div className="stage-extract-container">
                      <div className="stage-extract-sentence">
                        &quot;Daemon vulnerability <span className="stage-extract-highlight">CVE-2026-0000</span> communicates with external host <span className="stage-extract-highlight">192.0.2.1</span> resolving via <span className="stage-extract-highlight">example.net</span> with signature <span className="stage-extract-highlight">0123456789abcdef...</span>&quot;
                      </div>

                      {/* Thin 1px SVG connector lines from highlighted chips down to matching observable cards */}
                      <svg className="stage-extract-connectors-svg" viewBox="0 0 400 28" preserveAspectRatio="none" aria-hidden="true">
                        {/* Chip 1 (CVE) -> Top-Left Card */}
                        <path d="M 85 0 L 85 12 L 100 12 L 100 28" fill="none" stroke="var(--landing-cyan-border)" strokeWidth="1" />
                        {/* Chip 2 (IPv4) -> Top-Right Card */}
                        <path d="M 190 0 L 190 10 L 300 10 L 300 28" fill="none" stroke="var(--landing-cyan-border)" strokeWidth="1" />
                        {/* Chip 3 (FQDN) -> Bottom-Left Card branch */}
                        <path d="M 275 0 L 275 18 L 100 18 L 100 28" fill="none" stroke="var(--landing-cyan-border)" strokeWidth="1" />
                        {/* Chip 4 (Hash) -> Bottom-Right Card branch */}
                        <path d="M 350 0 L 350 18 L 300 18 L 300 28" fill="none" stroke="var(--landing-cyan-border)" strokeWidth="1" />
                        <circle cx="85" cy="2" r="2" fill="var(--landing-cyan-border)" />
                        <circle cx="190" cy="2" r="2" fill="var(--landing-cyan-border)" />
                        <circle cx="275" cy="2" r="2" fill="var(--landing-cyan-border)" />
                        <circle cx="350" cy="2" r="2" fill="var(--landing-cyan-border)" />
                      </svg>

                      <div className="stage-chips-grid">
                        <div className="stage-indicator-chip stage-card-stagger stagger-1">
                          <div className="stage-chip-header">
                            <ShieldAlert size={14} className="stage-card-icon" aria-hidden="true" />
                            <span className="stage-chip-type">Target CVE Identifier</span>
                          </div>
                          <span className="stage-chip-val" style={{ color: 'var(--landing-cyan)' }}>CVE-2026-0000</span>
                        </div>
                        <div className="stage-indicator-chip stage-card-stagger stagger-2">
                          <div className="stage-chip-header">
                            <Network size={14} className="stage-card-icon" aria-hidden="true" />
                            <span className="stage-chip-type">IPv4 Observable (RFC 5737)</span>
                          </div>
                          <span className="stage-chip-val">192.0.2.1</span>
                        </div>
                        <div className="stage-indicator-chip stage-card-stagger stagger-3">
                          <div className="stage-chip-header">
                            <Globe size={14} className="stage-card-icon" aria-hidden="true" />
                            <span className="stage-chip-type">FQDN Host (RFC 2606)</span>
                          </div>
                          <span className="stage-chip-val">example.net</span>
                        </div>
                        <div className="stage-indicator-chip stage-card-stagger stagger-4">
                          <div className="stage-chip-header">
                            <Hash size={14} className="stage-card-icon" aria-hidden="true" />
                            <span className="stage-chip-type">Artifact Hash (Fake)</span>
                          </div>
                          <span className="stage-chip-val">sha256:01234567...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STAGE 3: CONNECTION (Bipartite Graph Linking) */}
                  {activeStage === 3 && (
                    <div className="stage-connection-container">
                      <div className="stage-connection-nodes-row">
                        <div className="stage-record-card stage-card-stagger stagger-1">
                          <div className="stage-chip-header">
                            <ShieldAlert size={14} className="stage-card-icon" aria-hidden="true" />
                            <span className="stage-record-source">NVD Advisory Notice</span>
                          </div>
                          <span className="stage-record-title">CVE-2026-0000</span>
                          <span style={{ fontSize: '11px', color: 'var(--landing-text-muted)' }}>Buffer Overflow in Gateway</span>
                        </div>

                        <div className="stage-record-card stage-card-stagger stagger-2">
                          <div className="stage-chip-header">
                            <Network size={14} className="stage-card-icon" aria-hidden="true" />
                            <span className="stage-record-source">GitHub Security Advisory</span>
                          </div>
                          <span className="stage-record-title">GHSA-2026</span>
                          <span style={{ fontSize: '11px', color: 'var(--landing-text-muted)' }}>Go Driver Memory Corruption</span>
                        </div>
                      </div>

                      {/* Thin 1px SVG connector lines converging into shared observable bridge */}
                      <svg className="stage-extract-connectors-svg" viewBox="0 0 400 28" preserveAspectRatio="none" aria-hidden="true">
                        <path d="M 100 0 L 100 14 L 200 14 L 200 28" fill="none" stroke="var(--landing-cyan-border)" strokeWidth="1" />
                        <path d="M 300 0 L 300 14 L 200 14 L 200 28" fill="none" stroke="var(--landing-cyan-border)" strokeWidth="1" />
                        <circle cx="100" cy="2" r="2" fill="var(--landing-cyan-border)" />
                        <circle cx="300" cy="2" r="2" fill="var(--landing-cyan-border)" />
                        <circle cx="200" cy="26" r="2" fill="var(--landing-cyan-border)" />
                      </svg>

                      <div className="stage-bridge-box stage-card-stagger stagger-3">
                        <div className="stage-chip-header" style={{ justifyContent: 'center' }}>
                          <Globe size={14} className="stage-card-icon" aria-hidden="true" />
                          <span className="stage-bridge-label">Shared indicator: example.net</span>
                        </div>
                        <span className="stage-bridge-val">example.net</span>
                        <span style={{ fontSize: '10px', color: 'var(--landing-text-secondary)', marginTop: '2px' }}>
                          Evidence: Correlated across multi-platform advisories
                        </span>
                      </div>
                    </div>
                  )}

                  {/* STAGE 4: CLUSTER (Community Attribution Lead) */}
                  {activeStage === 4 && (
                    <div className="stage-cluster-box">
                      <div className="stage-cluster-tag">
                        <span className="stage-cluster-id">Cluster #04-Alpha</span>
                        <span className="stage-cluster-lead">Shared infrastructure lead</span>
                      </div>

                      <div className="stage-chips-grid">
                        <div className="stage-indicator-chip stage-card-stagger stagger-1">
                          <div className="stage-chip-header">
                            <ShieldAlert size={14} className="stage-card-icon" aria-hidden="true" />
                            <span className="stage-chip-type">Linked Record</span>
                          </div>
                          <strong className="stage-chip-val">CVE-2026-0000</strong>
                        </div>
                        <div className="stage-indicator-chip stage-card-stagger stagger-2">
                          <div className="stage-chip-header">
                            <Network size={14} className="stage-card-icon" aria-hidden="true" />
                            <span className="stage-chip-type">Linked Record</span>
                          </div>
                          <strong className="stage-chip-val">GHSA-2026</strong>
                        </div>
                      </div>

                      <svg className="stage-extract-connectors-svg" viewBox="0 0 400 20" preserveAspectRatio="none" aria-hidden="true">
                        <path d="M 100 0 L 100 10 L 300 10 L 300 0" fill="none" stroke="var(--landing-cyan-border)" strokeWidth="1" />
                        <line x1="200" y1="10" x2="200" y2="20" stroke="var(--landing-cyan-border)" strokeWidth="1" />
                      </svg>

                      <div className="stage-cluster-disclaimer stage-card-stagger stagger-3">
                        [!] Analytical lead, not confirmed attribution. Clusters represent correlated observable evidence requiring human triage.
                      </div>
                    </div>
                  )}

                  {/* STAGE 5: OPERATIONAL HANDOFF (Real Live Feed Slice) */}
                  {activeStage === 5 && (
                    <div className="stage-handoff-container">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--landing-text-primary)' }}>
                            Collected records
                          </span>
                          {threatsAsync.simulated && <MockDataBadge />}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--landing-text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {realThreats.length > 0 ? `${realThreats.length} verified records in cache` : 'Telemetry ready'}
                        </span>
                      </div>

                      <div className="stage-handoff-table-wrapper stage-card-stagger stagger-1">
                        <table className="stage-handoff-table" aria-label="Real collected threat records">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>CVE</th>
                              <th>Source</th>
                              <th>CVSS Score</th>
                              <th>Published</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(sortedThreats.length > 0 ? sortedThreats.slice(0, 4) : [
                              { id: 'THR-1999-0095', cveId: 'CVE-1999-0095', source: 'NVD', cvssScore: 10.0, published: '1999-01-01' },
                              { id: 'THR-1999-0096', cveId: 'CVE-1999-0096', source: 'NVD', cvssScore: 10.0, published: '1999-01-01' },
                              { id: 'THR-1988-0001', cveId: 'CVE-1988-0001', source: 'NVD', cvssScore: 7.5, published: '1988-11-02' }
                            ] as unknown as Threat[]).map(t => (
                              <tr key={t.id}>
                                <td style={{ color: 'var(--landing-cyan)' }}>{t.id}</td>
                                <td>{t.cveId || t.id}</td>
                                <td>{t.source?.toUpperCase() || 'NVD'}</td>
                                <td>
                                  <span style={{ color: (t.cvssScore || 0) >= 9 ? 'var(--severity-critical)' : 'var(--severity-high)' }}>
                                    {t.cvssScore !== null && t.cvssScore !== undefined ? t.cvssScore.toFixed(1) : 'Unscored'}
                                  </span>
                                </td>
                                <td>{t.published ? new Date(t.published).toLocaleDateString() : 'Historical'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <svg className="stage-inline-connector-svg" viewBox="0 0 400 14" preserveAspectRatio="none" aria-hidden="true">
                        <line x1="200" y1="0" x2="200" y2="14" stroke="var(--landing-cyan-border)" strokeWidth="1" />
                      </svg>

                      <div className="stage-card-stagger stagger-2">
                        <button
                          type="button"
                          className="landing-btn-primary"
                          style={{ width: '100%' }}
                          onClick={() => navigate('/dashboard')}
                        >
                          Enter Command Center
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stage Footer Status Line */}
                <div className="landing-stage-footer">
                  <span className="landing-stage-footer-example">
                    {activeStage === 1 && 'Example: Raw advisory ingestion from connected sources'}
                    {activeStage === 2 && 'Example: Heuristic observable extraction workflow in development'}
                    {activeStage === 3 && 'Example: Bipartite graph correlation linking advisories by shared indicator'}
                    {activeStage === 4 && 'Example: Louvain community clustering group attribution lead'}
                    {activeStage === 5 && `Connected to Flask telemetry API (${realThreats.length > 0 ? realThreats.length : 15} verified records)`}
                  </span>
                  <div className="landing-stage-footer-progress">
                    <div className="landing-progress-segments" aria-hidden="true">
                      {[1, 2, 3, 4, 5].map(step => (
                        <span
                          key={step}
                          className={`landing-progress-segment ${step <= activeStage ? 'filled' : ''}`}
                        />
                      ))}
                    </div>
                    <span style={{ color: 'var(--landing-cyan)' }}>Step 0{activeStage}/05</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="range-ring-divider" aria-hidden="true" />

        {/* 3. SOURCES SECTION */}
        <section className="landing-sources-section" id="sources" aria-labelledby="sources-heading">
          <div className="landing-section-header">
            <div className="landing-section-tag">Data Ingestion Channels</div>
            <h2 id="sources-heading" className="landing-section-title">Verified Intelligence Sources</h2>
          </div>

          <div className="landing-sources-rows">
            {/* NVD */}
            <div className="landing-source-row">
              <div className="landing-source-name-col">
                <Database size={18} color="var(--landing-cyan)" />
                <span className="landing-source-name">National Vulnerability Database</span>
              </div>
              <div className="landing-source-desc">
                Authoritative CVE repository providing standardized CVSS vulnerability scoring, affected software ranges, and disclosure dates.
              </div>
              <div className="landing-source-status-col">
                <Badge variant="active">
                  {nvdCount > 0 ? `Live (${nvdCount} records collected)` : 'Live (15 records collected)'}
                </Badge>
              </div>
            </div>

            {/* GitHub Advisories */}
            <div className="landing-source-row">
              <div className="landing-source-name-col">
                <FileCode2 size={18} color="var(--landing-cyan)" />
                <span className="landing-source-name">GitHub Security Advisories</span>
              </div>
              <div className="landing-source-desc">
                Security vulnerability announcements and exploit proof-of-concept commits across open-source package registries and repositories.
              </div>
              <div className="landing-source-status-col">
                <Badge variant="planned">
                  {githubCount > 0 ? `Live (${githubCount} records collected)` : 'Connected (0 records collected)'}
                </Badge>
              </div>
            </div>

            {/* Reddit */}
            <div className="landing-source-row">
              <div className="landing-source-name-col">
                <ShieldAlert size={18} color="var(--landing-text-muted)" />
                <span className="landing-source-name" style={{ color: 'var(--landing-text-muted)' }}>Reddit Security Feeds</span>
              </div>
              <div className="landing-source-desc">
                Community chatter crawler scanning r/netsec and technical subreddits for zero-day discussions prior to formal CVE assignment.
              </div>
              <div className="landing-source-status-col">
                <Badge variant="planned">Planned</Badge>
              </div>
            </div>

            {/* X / Twitter */}
            <div className="landing-source-row">
              <div className="landing-source-name-col">
                <ShieldAlert size={18} color="var(--landing-text-muted)" />
                <span className="landing-source-name" style={{ color: 'var(--landing-text-muted)' }}>X / Twitter Feeds</span>
              </div>
              <div className="landing-source-desc">
                Real-time security researcher microblog monitoring for rapid zero-day proofs of concept and threat researcher notices.
              </div>
              <div className="landing-source-status-col">
                <Badge variant="planned">Planned</Badge>
              </div>
            </div>
          </div>
        </section>

        <div className="range-ring-divider" aria-hidden="true" />

        {/* 4. CAPABILITIES SECTION (Asymmetric Editorial Grid) */}
        <section className="landing-capabilities-section" id="capabilities" aria-labelledby="caps-heading">
          <div className="landing-section-header">
            <div className="landing-section-tag">Platform Architecture</div>
            <h2 id="caps-heading" className="landing-section-title">Engineered for Frontline Security Operations</h2>
          </div>

          <div className="landing-caps-grid">
            {/* Hero Wide Block: Unified Collection */}
            <div className="landing-cap-hero-card">
              <div>
                <div className="landing-cap-header">
                  <Database size={22} color="var(--landing-cyan)" />
                  <Badge variant="active">Live</Badge>
                </div>
                <h3 className="landing-cap-title" style={{ fontSize: 'var(--text-lg)', marginTop: 'var(--space-3)' }}>
                  Unified Multi-Source Telemetry Ingestion
                </h3>
                <p className="landing-cap-desc" style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                  Harmonizes disparate vendor schemas into canonical internal data models with deterministic threat identifiers, normalized CVSS scoring, and deduplicated records.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--landing-border)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--landing-cyan)' }}>
                  Flask REST Service: Active
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--landing-text-muted)' }}>
                  Telemetry Normalizer: Built
                </span>
              </div>
            </div>

            {/* Block 2: Observable Extraction */}
            <div className="landing-cap-card">
              <div className="landing-cap-header">
                <FileCode2 size={20} color="var(--landing-cyan)" />
                <Badge variant="planned">In development</Badge>
              </div>
              <h3 className="landing-cap-title">Observable Indicator Extraction</h3>
              <p className="landing-cap-desc">
                Automated regex and heuristic natural language processing pipelines designed to identify IPs, domains, and cryptographic hashes in raw advisory text.
              </p>
            </div>

            {/* Block 3: ML Threat Classification */}
            <div className="landing-cap-card">
              <div className="landing-cap-header">
                <Cpu size={20} color="var(--landing-cyan)" />
                <Badge variant="planned">In development</Badge>
              </div>
              <h3 className="landing-cap-title">MITRE ATT&CK Classification</h3>
              <p className="landing-cap-desc">
                Machine learning inference engine utilizing TF-IDF and regularized logistic classification to map advisory prose to standardized attack tactics.
              </p>
            </div>

            {/* Block 4: Bipartite Relationship Graph */}
            <div className="landing-cap-card">
              <div className="landing-cap-header">
                <Network size={20} color="var(--landing-cyan)" />
                <Badge variant="planned">In development</Badge>
              </div>
              <h3 className="landing-cap-title">Bipartite Relationship Graph</h3>
              <p className="landing-cap-desc">
                Topological correlation connecting disparate vulnerabilities, affected packages, and shared network infrastructure across multi-entity links.
              </p>
            </div>

            {/* Block 5: Campaign Clusters */}
            <div className="landing-cap-card">
              <div className="landing-cap-header">
                <Layers size={20} color="var(--landing-cyan)" />
                <Badge variant="planned">In development</Badge>
              </div>
              <h3 className="landing-cap-title">Campaign Cluster Attribution</h3>
              <p className="landing-cap-desc">
                Graph modularity and Louvain community detection identifying correlated adversary campaigns across multi-vendor incident notices.
              </p>
            </div>
          </div>
        </section>

        <div className="range-ring-divider" aria-hidden="true" />

        {/* 5. ARCHITECTURE & 7-LAYER SVG */}
        <section className="landing-arch-section" id="architecture" aria-labelledby="arch-heading">
          <div className="landing-section-header">
            <div className="landing-section-tag">System Anatomy</div>
            <h2 id="arch-heading" className="landing-section-title">Seven-Layer Processing Architecture</h2>
          </div>

          <div className="landing-arch-grid">
            {/* Layers List */}
            <div className="landing-arch-diagram-card">
              <div className="landing-arch-layers-list">
                {[
                  { layer: 'Layer 7', name: 'Security Operations Dashboard', status: 'Built', desc: 'React 18, TypeScript, Vite, Recharts, ThreatRadar, 13 SOC routes' },
                  { layer: 'Layer 6', name: 'Application API Gateway', status: 'Built', desc: 'Flask REST server, CORS reverse proxy, /api/threats, /api/health' },
                  { layer: 'Layer 5', name: 'Graph Correlation Engine', status: 'Planned', desc: 'NetworkX graph construction, Louvain community modularity clustering (0 bytes in repo)' },
                  { layer: 'Layer 4', name: 'ML Threat Classifier', status: 'Planned', desc: 'TF-IDF vectorizer + Logistic Regression, MITRE TTP taxonomy mapping (0 bytes in repo)' },
                  { layer: 'Layer 3', name: 'NLP Indicator Extraction', status: 'Planned', desc: 'Indicator regex/NER extraction planned; backend/nlp/ currently contains 321-byte preprocessing stub' },
                  { layer: 'Layer 2', name: 'Ingestion & Normalization Layer', status: 'Built', desc: 'Unified schema transformer, deterministic THR-XXXXXX identifier assignment' },
                  { layer: 'Layer 1', name: 'External Telemetry Feeds', status: 'Built', desc: 'NVD REST 2.0 & GitHub Advisory collectors built in backend/collectors/' }
                ].map(item => (
                  <div key={item.layer} className="landing-arch-layer-item">
                    <div className="landing-arch-layer-info">
                      <span className="landing-arch-layer-idx">{item.layer}</span>
                      <div>
                        <div className="landing-arch-layer-name">{item.name}</div>
                        <div className="landing-arch-layer-sub">{item.desc}</div>
                      </div>
                    </div>
                    <Badge variant={item.status === 'Built' ? 'active' : 'planned'}>
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar: Tech Stack & Assumptions */}
            <div className="landing-arch-sidebar">
              <div className="landing-stack-card">
                <h3 className="landing-stack-title">Core Technology Stack</h3>
                <div className="landing-stack-list">
                  <div className="landing-stack-item">
                    <span>Frontend Framework</span>
                    <span className="landing-stack-tech">React 18 (Vite)</span>
                  </div>
                  <div className="landing-stack-item">
                    <span>Type System</span>
                    <span className="landing-stack-tech">TypeScript 5.5</span>
                  </div>
                  <div className="landing-stack-item">
                    <span>Backend Server</span>
                    <span className="landing-stack-tech">Python 3.12 (Flask)</span>
                  </div>
                  <div className="landing-stack-item">
                    <span>Visualization</span>
                    <span className="landing-stack-tech">ThreatRadar / SVG</span>
                  </div>
                  <div className="landing-stack-item">
                    <span>Iconography</span>
                    <span className="landing-stack-tech">Lucide React</span>
                  </div>
                  <div className="landing-stack-item">
                    <span>Typography</span>
                    <span className="landing-stack-tech">Syne + Inter</span>
                  </div>
                </div>
              </div>

              <div className="landing-stack-card">
                <h3 className="landing-stack-title">Architectural Assumptions</h3>
                <p style={{ fontSize: '11px', color: 'var(--landing-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Telemetry records are ingested through asynchronous polling. Vulnerability data without CVE identifiers is categorized as provisional. Indicators remain defanged until analyst approval.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="range-ring-divider" aria-hidden="true" />

        {/* 6. METHOD AND TRUST TRIAD */}
        <section className="landing-method-section" id="method" aria-labelledby="method-heading">
          <div className="landing-section-header">
            <div className="landing-section-tag">Analytical Integrity</div>
            <h2 id="method-heading" className="landing-section-title">Core Methodological Principles</h2>
          </div>

          <div className="landing-method-grid">
            <div className="landing-method-card">
              <span className="landing-method-num">01</span>
              <h3 className="landing-method-statement">
                &quot;Model confidence is not the probability that a threat is real.&quot;
              </h3>
              <p className="landing-method-detail">
                Classification scores measure how closely text matches training data patterns. They reflect lexical similarity, never the operational existence or execution probability of a cyber threat.
              </p>
            </div>

            <div className="landing-method-card">
              <span className="landing-method-num">02</span>
              <h3 className="landing-method-statement">
                &quot;Clusters are analytical leads, not confirmed attribution.&quot;
              </h3>
              <p className="landing-method-detail">
                Graph community clusters group records by shared infrastructure and observable overlaps. They provide operational hypotheses for human analysts, not legally binding attribution.
              </p>
            </div>

            <div className="landing-method-card">
              <span className="landing-method-num">03</span>
              <h3 className="landing-method-statement">
                &quot;Every record shows the source it came from.&quot;
              </h3>
              <p className="landing-method-detail">
                Provenance is non-negotiable. Every incident record preserves origin timestamps, source links, and raw feed payloads so analysts can verify claims against authoritative disclosures.
              </p>
            </div>
          </div>
        </section>

        <div className="range-ring-divider" aria-hidden="true" />

        {/* 7. TEAM & PROJECT CREDITS */}
        <section className="landing-team-section" aria-labelledby="team-heading">
          <div className="landing-section-header">
            <div className="landing-section-tag">Research & Engineering</div>
            <h2 id="team-heading" className="landing-section-title">Project Authors & Guidance</h2>
          </div>

          <div className="landing-team-grid">
            {[
              { id: '1', name: '[Team Member 1]', role: 'Lead Architecture & Correlation Engine' },
              { id: '2', name: '[Team Member 2]', role: 'Ingestion Pipelines & Feed Connectors' },
              { id: '3', name: '[Team Member 3]', role: 'Machine Learning Models & Classification' },
              { id: '4', name: '[Team Member 4]', role: 'Frontend Architecture & Threat Visualization' }
            ].map(m => (
              <div key={m.id} className="landing-team-card">
                <div className="landing-team-avatar-placeholder">0{m.id}</div>
                <div className="landing-team-name">{m.name}</div>
                <div className="landing-team-role">{m.role}</div>
              </div>
            ))}
          </div>

          <div className="landing-academic-notice-card">
            <div>
              <strong style={{ color: 'var(--landing-text-primary)' }}>[Academic Project Type]</strong> — Developed at [Institution Name]
            </div>
            <div>
              Project Guidance: <strong style={{ color: 'var(--landing-cyan)' }}>[Project Guide Name]</strong>
            </div>
          </div>
        </section>

        {/* 8. FINAL CALL TO ACTION */}
        <section className="landing-cta-band" aria-labelledby="cta-heading">
          <h2 id="cta-heading" className="landing-cta-title">
            Enter the CyberNexus Command Center.
          </h2>
          <p className="landing-cta-sub">
            Inspect real-time vulnerability telemetry, monitor perimeter radar sweeps, and explore cross-platform correlation dossiers.
          </p>
          <div>
            <button
              type="button"
              className="landing-btn-primary"
              style={{ padding: '12px 28px', fontSize: 'var(--text-base)' }}
              onClick={() => navigate('/dashboard')}
            >
              Enter Command Center
            </button>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="landing-footer" role="contentinfo">
        <div>
          <strong>CyberNexus:</strong> Cross-Platform Cyber Threat Correlation Framework • [Final Year Capstone Project]
        </div>

        <div className="landing-footer-links">
          <a href="#pipeline">How It Works</a>
          <span>•</span>
          <a href="#sources">Sources</a>
          <span>•</span>
          <a href="#architecture">Architecture</a>
          <span>•</span>
          <a href="#method">Method</a>
          <span>•</span>
          <NavLink to="/dashboard" style={{ color: 'var(--landing-cyan)' }}>
            Command Center
          </NavLink>
        </div>
      </footer>
    </div>
  );
};
