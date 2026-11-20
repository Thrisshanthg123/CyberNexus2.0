import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Radio,
  Network,
  Cpu,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { Button, Badge } from '../components/ui';
import './LandingPage.css';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-root">
      {/* Navigation */}
      <header className="landing-nav" role="banner">
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', textDecoration: 'none' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', borderRadius: 'var(--radius-chip)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#060B14', fontWeight: 800, fontSize: '15px' }}>
            CN
          </div>
          <span style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
            CyberNexus
          </span>
        </NavLink>

        <nav className="landing-nav-links" aria-label="Landing section navigation">
          <a href="#about">About</a>
          <a href="#capabilities">Capabilities</a>
          <a href="#pipeline">How It Works</a>
          <a href="#sources">Sources</a>
          <a href="#stack">Stack</a>
          <a href="#team">Team</a>
        </nav>

        <div>
          <Button
            variant="primary"
            onClick={() => navigate('/dashboard')}
            icon={<ArrowRight size={14} />}
          >
            Open dashboard
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main id="main-content">
        <section className="landing-hero" aria-labelledby="hero-title">
          {/* Calm SVG Radar Motif */}
          <div className="hero-radar-motif" aria-hidden="true">
            <svg width="240" height="240" viewBox="0 0 240 240">
              <circle cx="120" cy="120" r="100" fill="none" stroke="var(--color-border)" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="120" cy="120" r="70" fill="none" stroke="var(--color-border)" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="120" cy="120" r="40" fill="none" stroke="var(--color-border)" strokeWidth="1" />
              <circle cx="120" cy="120" r="8" fill="var(--accent-cyan)" />
              <line x1="120" y1="20" x2="120" y2="220" stroke="var(--color-border)" strokeWidth="1" />
              <line x1="20" y1="120" x2="220" y2="120" stroke="var(--color-border)" strokeWidth="1" />
              <circle cx="160" cy="80" r="4" fill="var(--severity-critical)" />
              <circle cx="85" cy="150" r="4" fill="var(--severity-high)" />
              <circle cx="140" cy="170" r="3.5" fill="var(--severity-medium)" />
              <circle cx="70" cy="90" r="3" fill="var(--accent-green)" />
            </svg>
          </div>

          <h1 id="hero-title" className="landing-h1">
            From Fragmented Feeds to Unified Threat Intelligence.
          </h1>

          <p className="landing-hero-desc">
            A cross-platform cybersecurity correlation architecture designed to unify disparate telemetry
            across official vulnerability repositories, developer commits, and darknet communications into a single
            coherent defense picture.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="primary"
              onClick={() => navigate('/dashboard')}
              style={{ minHeight: '44px', padding: 'var(--space-3) var(--space-5)', fontSize: 'var(--text-base)' }}
              icon={<ArrowRight size={18} />}
            >
              Open dashboard
            </Button>
            <a
              href="#about"
              className="ui-btn ui-btn-outline"
              style={{ minHeight: '44px', padding: 'var(--space-3) var(--space-5)', fontSize: 'var(--text-base)' }}
            >
              Learn More
            </a>
          </div>
        </section>

        {/* Section 1: About */}
        <section id="about" className="landing-section" aria-labelledby="about-title">
          <div className="landing-section-inner">
            <div className="section-header">
              <div className="section-tag">Overview & Problem Statement</div>
              <h2 id="about-title" className="section-title">The Challenge of Telemetry Fragmentation</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-small)', lineHeight: 1.8, marginBottom: 'var(--space-4)' }}>
                  Modern cyber threat intelligence is severely fragmented. While NVD documents formal CVE records days after discovery,
                  functional exploit proofs-of-concept frequently emerge on GitHub within hours, and active exploitation campaigns are
                  first discussed inside underground Reddit and dark-web channels.
                </p>
                <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-small)', lineHeight: 1.8 }}>
                  <strong>CyberNexus</strong> closes this critical time-to-insight window. By harmonizing disparate ingestion feeds through
                  automated entity normalization, graph topology correlation, and transformer classification, security operations teams
                  gain immediate tactical visibility before mass weaponization occurs.
                </p>
              </div>

              <div style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-panel)', padding: 'var(--space-5)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-3)' }}>
                  CYBERNEXUS ARCHITECTURAL HIGHLIGHTS
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                    <CheckCircle2 size={16} color="var(--accent-green)" /> Deterministic Cross-Source Event Normalization
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                    <CheckCircle2 size={16} color="var(--accent-green)" /> Threat Perimeter Radar & 360° Sweep Horizon
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--accent-green)' }}>
                    <CheckCircle2 size={16} color="var(--accent-green)" /> Defanged Indicators of Compromise (IOC) Sandbox
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--accent-green)' }}>
                    <CheckCircle2 size={16} color="var(--accent-green)" /> Multi-Entity Force-Directed Topology Graph
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Capabilities */}
        <section id="capabilities" className="landing-section" aria-labelledby="cap-title">
          <div className="landing-section-inner">
            <div className="section-header">
              <div className="section-tag">Operational Capabilities</div>
              <h2 id="cap-title" className="section-title">Built for Frontline Cyber Defense</h2>
            </div>

            <div className="capabilities-grid">
              <div className="cap-card">
                <Radio size={24} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>Threat Perimeter Radar</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-small)', lineHeight: 1.6 }}>
                  Rotational radar sweep displaying critical incidents in concentric threat rings based on severity proximity and vector angles.
                </p>
              </div>

              <div className="cap-card">
                <Network size={24} color="var(--accent-blue)" />
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>Bipartite Correlation Graph</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-small)', lineHeight: 1.6 }}>
                  Force-directed topological network linking threat campaigns, exploited CVEs, IOC indicators, and adversary threat groups.
                </p>
              </div>

              <div className="cap-card">
                <Cpu size={24} color="var(--accent-green)" />
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>Machine Learning Intelligence</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-small)', lineHeight: 1.6 }}>
                  Automated MITRE ATT&CK categorization and natural language feature extraction with strict academic benchmark honesty.
                </p>
              </div>

              <div className="cap-card">
                <Lock size={24} color="var(--severity-high)" />
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>Defanged IOC Explorer</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-small)', lineHeight: 1.6 }}>
                  Exploration of threat indicators with safety defanging by default, raw payload reveal toggles, and bulk export capabilities.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: How It Works */}
        <section id="pipeline" className="landing-section" aria-labelledby="pipeline-title">
          <div className="landing-section-inner">
            <div className="section-header">
              <div className="section-tag">Processing Pipeline</div>
              <h2 id="pipeline-title" className="section-title">End-to-End Threat Intelligence Workflow</h2>
            </div>

            <div className="pipeline-steps">
              <div className="pipeline-step-card">
                <div className="step-number">STEP 01</div>
                <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Collect</h4>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', lineHeight: 1.5 }}>
                  Continuous asynchronous polling across NVD, GitHub advisories, and darknet community channels.
                </p>
              </div>

              <div className="pipeline-step-card">
                <div className="step-number">STEP 02</div>
                <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Normalise</h4>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', lineHeight: 1.5 }}>
                  Syntactic mapping into unified schema with deterministic THR-XXXXXX identifiers and defanged indicators.
                </p>
              </div>

              <div className="pipeline-step-card">
                <div className="step-number">STEP 03</div>
                <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Extract</h4>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', lineHeight: 1.5 }}>
                  Regex and heuristic parsing of IPv4, FQDNs, SHA-256 hashes, and vendor-affected software versions.
                </p>
              </div>

              <div className="pipeline-step-card">
                <div className="step-number">STEP 04</div>
                <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Classify</h4>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', lineHeight: 1.5 }}>
                  Transformer classification against MITRE ATT&CK techniques with confidence scores.
                </p>
              </div>

              <div className="pipeline-step-card">
                <div className="step-number">STEP 05</div>
                <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Correlate</h4>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', lineHeight: 1.5 }}>
                  Cross-platform link analysis connecting disparate vendor notices into cohesive adversary campaigns.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Sources */}
        <section id="sources" className="landing-section" aria-labelledby="sources-title">
          <div className="landing-section-inner">
            <div className="section-header">
              <div className="section-tag">Data Ingestion Streams</div>
              <h2 id="sources-title" className="section-title">Supported Intelligence Sources</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
              <div style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-panel)', padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>NVD</span>
                  <Badge variant="active">Active Feed</Badge>
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', lineHeight: 1.5 }}>
                  National Vulnerability Database 2.0 REST API sync for authoritative CVE metrics and CVSS vectors.
                </p>
              </div>

              <div style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-panel)', padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>GitHub Advisories</span>
                  <Badge variant="active">Active Feed</Badge>
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', lineHeight: 1.5 }}>
                  GraphQL security advisory stream tracking open-source dependency flaws and public exploit proofs-of-concept.
                </p>
              </div>

              <div style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-panel)', padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>Reddit Security Feeds</span>
                  <Badge variant="active">Active Feed</Badge>
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', lineHeight: 1.5 }}>
                  NLP crawler scanning technical security subreddits (r/netsec, r/cybersecurity) for zero-day chatter.
                </p>
              </div>

              <div style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-panel)', padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>X / Twitter Feeds</span>
                  <Badge variant="planned">Planned</Badge>
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', lineHeight: 1.5 }}>
                  Planned enterprise microblog connector for real-time security researcher alerts and threat drops.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Stack */}
        <section id="stack" className="landing-section" aria-labelledby="stack-title">
          <div className="landing-section-inner">
            <div className="section-header">
              <div className="section-tag">Architecture & Tech Stack</div>
              <h2 id="stack-title" className="section-title">Strict Production Framework Compliance</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
              {[
                { name: 'React 18', desc: 'Component architecture & state machine' },
                { name: 'TypeScript', desc: 'Strict static types & API interfaces' },
                { name: 'Vite', desc: 'High-speed build toolchain' },
                { name: 'Custom CSS', desc: 'Strict design tokens with zero hex leaks' },
                { name: 'React Router', desc: 'Client-side deep-linked routing' },
                { name: 'Lucide React', desc: 'Disciplined iconographic lexicon' },
                { name: 'Recharts', desc: 'SVG metric horizons & trend lines' },
                { name: 'React Force Graph', desc: 'Interactive 2D Canvas force topology' }
              ].map(item => (
                <div key={item.name} style={{ background: 'var(--color-panel)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-chip)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', marginTop: '2px' }}>
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 6: Team */}
        <section id="team" className="landing-section" aria-labelledby="team-title">
          <div className="landing-section-inner">
            <div className="section-header">
              <div className="section-tag">Project Authors & Guidance</div>
              <h2 id="team-title" className="section-title">Research & Engineering Team</h2>
            </div>

            <div className="team-grid">
              {[
                { name: 'Thrishanth', role: 'Engineering Lead & Correlation Architecture' },
                { name: 'Aasim', role: 'Data Ingestion & Feed Pipelines' },
                { name: 'Akash', role: 'Machine Learning Models & Classification' },
                { name: 'Shamil', role: 'Frontend Architecture & Threat Visualization' }
              ].map(member => (
                <div key={member.name} className="team-card">
                  <div style={{ width: '48px', height: '48px', background: 'var(--color-raised)', border: '1px solid var(--color-border)', borderRadius: '50%', margin: '0 auto var(--space-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    {member.name.charAt(0)}
                  </div>
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: '2px' }}>{member.name}</h3>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)' }}>{member.role}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 'var(--space-5)', background: 'var(--color-panel)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-panel)', padding: 'var(--space-4)', textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Academic Project Guidance
              </div>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-text)', marginTop: '2px' }}>
                Guide: Srinivas P M
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', marginTop: '2px' }}>
                Sahyadri College of Engineering and Management
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer" role="contentinfo">
        <div>
          <strong>CyberNexus:</strong> Cross-Platform Cyber Threat Correlation Framework
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <NavLink to="/dashboard" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>
            Open Operations Dashboard
          </NavLink>
          <span>•</span>
          <span>Sahyadri College of Engineering and Management</span>
        </div>
      </footer>
    </div>
  );
};
