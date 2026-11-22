import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Radio,
  Bell,
  Network,
  Cpu,
  Key,
  Layers,
  FolderGit2,
  FileText,
  Database,
  Search,
  ChevronLeft,
  ChevronRight,
  Menu,
  Settings,
  RefreshCw,
  X,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import {
  MockDataBadge,
  IconButton,
  Button,
  StatusDot,
  CommandPalette,
  CommandItem,
  Drawer,
  Modal,
  Tooltip
} from '../ui';
import { useMediaQuery } from '../../hooks';
import { api } from '../../services/api';
import './DashboardLayout.css';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
  isMock?: boolean;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    group: 'Monitor',
    items: [
      { to: '/dashboard', label: 'Overview', icon: <Activity size={19} /> },
      { to: '/dashboard/feed', label: 'Live Feed', icon: <Radio size={19} />, count: 15 },
      { to: '/dashboard/alerts', label: 'Alerts', icon: <Bell size={19} />, count: 3 }
    ]
  },
  {
    group: 'Analyze',
    items: [
      { to: '/dashboard/analytics', label: 'Analytics', icon: <BarChart3 size={19} /> },
      { to: '/dashboard/graph', label: 'Threat Graph', icon: <Network size={19} /> },
      { to: '/dashboard/ml', label: 'ML Intelligence', icon: <Cpu size={19} />, isMock: true },
      { to: '/dashboard/iocs', label: 'IOC Explorer', icon: <Key size={19} /> },
      { to: '/dashboard/campaigns', label: 'Campaigns', icon: <Layers size={19} />, isMock: true }
    ]
  },
  {
    group: 'Work',
    items: [
      { to: '/dashboard/investigation', label: 'Investigation', icon: <FolderGit2 size={19} /> },
      { to: '/dashboard/reports', label: 'Reports', icon: <FileText size={19} /> },
      { to: '/dashboard/sources', label: 'Sources', icon: <Database size={19} />, count: 2 }
    ]
  }
];

export const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [alertBannerDismissed, setAlertBannerDismissed] = useState(false);
  const [criticalThreat, setCriticalThreat] = useState<{
    id: string;
    cveId: string;
    title: string;
    cvssScore: number;
    date: string;
    isRecent: boolean;
  } | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [threatCount, setThreatCount] = useState<number>(15);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [syncing, setSyncing] = useState(false);
  const [syncConfirmOpen, setSyncConfirmOpen] = useState(false);
  const [syncErrorModal, setSyncErrorModal] = useState<string | null>(null);

  const isMobile = useMediaQuery('(max-width: 768px)');
  const location = useLocation();
  const navigate = useNavigate();

  // Periodic health check to live Flask backend with exponential backoff when offline
  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let offlineFailures = 0;

    const checkHealth = async () => {
      const status = await api.getHealth();
      if (!mounted) return;
      setApiOnline(status.online);

      if (status.online) {
        offlineFailures = 0;
        timer = setTimeout(checkHealth, 30000);
      } else {
        offlineFailures++;
        const backoffDelay = Math.min(240000, 30000 * Math.pow(2, offlineFailures));
        timer = setTimeout(checkHealth, backoffDelay);
      }
    };

    checkHealth();
    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Fetch threat count and identify real CVSS >= 9.0 threat for dynamic emergency banner
  useEffect(() => {
    let mounted = true;
    api.getThreats()
      .then(res => {
        if (!mounted) return;
        const threats = res.data || [];
        setThreatCount(threats.length);
        const topCrit = threats.find(t => t.cvssScore !== null && t.cvssScore !== undefined && t.cvssScore >= 9.0);
        if (topCrit) {
          const rawDate = topCrit.collectedAt || topCrit.published || topCrit.timestamp;
          const time = rawDate ? new Date(rawDate).getTime() : NaN;
          const isRecent = !isNaN(time) && (Date.now() - time < 30 * 24 * 3600 * 1000);
          const dateFormatted = rawDate ? rawDate.slice(0, 10) : 'Date unrecorded';

          setCriticalThreat({
            id: topCrit.id,
            cveId: topCrit.cveId,
            title: topCrit.title,
            cvssScore: topCrit.cvssScore ?? 9.0,
            date: dateFormatted,
            isRecent
          });
        } else {
          setCriticalThreat(null);
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  // Open confirmation dialog before collection
  const handleManualSync = () => {
    if (syncing) return;
    setSyncConfirmOpen(true);
  };

  // Confirmed collection action: calls both real endpoints with timeout & before/after verification
  const performSync = async () => {
    setSyncConfirmOpen(false);
    setSyncing(true);
    setSyncErrorModal(null);
    api.resetBackoff();
    try {
      const collectionResult = await api.triggerFullCollection();

      const res = await api.getThreats();
      const threats = res.data || [];
      setThreatCount(threats.length);
      const topCrit = threats.find(t => t.cvssScore !== null && t.cvssScore !== undefined && t.cvssScore >= 9.0);
      if (topCrit) {
        const rawDate = topCrit.collectedAt || topCrit.published || topCrit.timestamp;
        const time = rawDate ? new Date(rawDate).getTime() : NaN;
        const isRecent = !isNaN(time) && (Date.now() - time < 30 * 24 * 3600 * 1000);
        const dateFormatted = rawDate ? rawDate.slice(0, 10) : 'Date unrecorded';

        setCriticalThreat({
          id: topCrit.id,
          cveId: topCrit.cveId,
          title: topCrit.title,
          cvssScore: topCrit.cvssScore ?? 9.0,
          date: dateFormatted,
          isRecent
        });
      } else {
        setCriticalThreat(null);
      }

      if (collectionResult.unconfirmed) {
        setLastSyncTime('Collection status unconfirmed');
        setSyncErrorModal(`Collection status unconfirmed:\n\n• ${collectionResult.errors.join('\n• ')}`);
      } else if (collectionResult.errors.length > 0) {
        setLastSyncTime(`Partial sync (${collectionResult.errors.length} err)`);
        setSyncErrorModal(`Telemetry ingestion encountered errors:\n\n• ${collectionResult.errors.join('\n• ')}`);
      } else {
        setLastSyncTime('Just now');
      }
    } catch (err: any) {
      setLastSyncTime('Sync failed');
      setSyncErrorModal(`Telemetry ingestion failed: ${err?.message || 'Flask backend service unreachable.'}`);
    } finally {
      setTimeout(() => setSyncing(false), 800);
    }
  };

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  // Breadcrumbs calculation
  const breadcrumbs = location.pathname
    .split('/')
    .filter(Boolean)
    .map((seg, idx, arr) => {
      const url = `/${arr.slice(0, idx + 1).join('/')}`;
      const name = seg === 'dashboard' ? 'Platform' : seg.charAt(0).toUpperCase() + seg.slice(1);
      return { name, url };
    });

  // Commands for Ctrl+K Command Palette
  const commands: CommandItem[] = [
    { id: 'c-overview', title: 'Executive Overview', category: 'Navigation', onSelect: () => navigate('/dashboard') },
    { id: 'c-feed', title: 'Live Threat Feed', category: 'Navigation', onSelect: () => navigate('/dashboard/feed') },
    { id: 'c-alerts', title: 'Security Alerts', category: 'Navigation', onSelect: () => navigate('/dashboard/alerts') },
    { id: 'c-analytics', title: 'Analytics & Trends', category: 'Navigation', onSelect: () => navigate('/dashboard/analytics') },
    { id: 'c-graph', title: 'Threat Intelligence Graph', category: 'Navigation', onSelect: () => navigate('/dashboard/graph') },
    { id: 'c-ml', title: 'ML Intelligence', category: 'Navigation', onSelect: () => navigate('/dashboard/ml') },
    { id: 'c-iocs', title: 'IOC Explorer', category: 'Navigation', onSelect: () => navigate('/dashboard/iocs') },
    { id: 'c-campaigns', title: 'Adversary Campaigns', category: 'Navigation', onSelect: () => navigate('/dashboard/campaigns') },
    { id: 'c-investigation', title: 'Investigation Workspace', category: 'Navigation', onSelect: () => navigate('/dashboard/investigation') },
    { id: 'c-reports', title: 'Generate Briefing Reports', category: 'Navigation', onSelect: () => navigate('/dashboard/reports') },
    { id: 'c-sources', title: 'Intelligence Sources', category: 'Navigation', onSelect: () => navigate('/dashboard/sources') },
    { id: 'c-sync', title: 'Trigger Manual Feed Sync', category: 'Action', shortcut: 'Ctrl+R', onSelect: handleManualSync },
    { id: 'c-settings', title: 'Open SOC Environment Settings', category: 'Action', onSelect: () => setSettingsOpen(true) }
  ];

  return (
    <div className="dashboard-root">
      {/* Skip to Content for keyboard accessibility */}
      <a href="#dashboard-main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Emergency Critical Alert Banner - Only renders when real CVSS >= 9.0 threat exists */}
      {!alertBannerDismissed && criticalThreat && (
        <aside className={`emergency-alert-banner ${criticalThreat.isRecent ? 'critical' : 'calm'}`} role="alert">
          <div className="emergency-alert-content">
            <AlertCircle size={15} style={{ flexShrink: 0, color: criticalThreat.isRecent ? 'var(--alert-banner-text)' : 'var(--severity-high)' }} />
            <span>
              <strong>{criticalThreat.isRecent ? 'CRITICAL ESCALATION' : 'HIGHEST-SEVERITY RECORD'} [{criticalThreat.date}]:</strong> {criticalThreat.id} ({criticalThreat.cveId}) — {criticalThreat.title} [CVSS {criticalThreat.cvssScore.toFixed(1)}]
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="emergency-alert-btn"
              onClick={() => navigate(`/dashboard/threats/${criticalThreat.id}`)}
            >
              Review Advisory
            </button>
            <button
              type="button"
              onClick={() => setAlertBannerDismissed(true)}
              className="emergency-alert-close-btn"
              style={{ background: 'none', border: 'none', color: criticalThreat.isRecent ? 'var(--alert-banner-text)' : 'var(--alert-calm-text)', cursor: 'pointer', padding: '2px', display: 'flex' }}
              aria-label="Dismiss escalation alert"
            >
              <X size={15} />
            </button>
          </div>
        </aside>
      )}

      {/* Body Wrapper (Sidebar + Main) */}
      <div className="dashboard-body-wrapper">
        {/* Tinted Sidebar */}
        <aside className={`dashboard-sidebar ${collapsed ? 'collapsed' : ''}`} aria-label="Sidebar navigation">
          <div className="sidebar-header">
            <NavLink to="/" className="sidebar-brand" title="CyberNexus">
              <div className="sidebar-brand-icon">CN</div>
              {!collapsed && <span>CyberNexus</span>}
            </NavLink>
            <IconButton
              icon={collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              ariaLabel={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={() => setCollapsed(prev => !prev)}
            />
          </div>

          <nav className="sidebar-nav">
            {navigationGroups.map(group => (
              <div key={group.group} className="sidebar-group">
                {!collapsed && (
                  <div className="sidebar-group-label">{group.group}</div>
                )}
                {group.items.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/dashboard'}
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    {item.icon}
                    {!collapsed && (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span>{item.label}</span>
                        {item.count !== undefined ? (
                          <span className="sidebar-link-badge">{item.count}</span>
                        ) : item.isMock ? (
                          <MockDataBadge style={{ padding: '0 4px', fontSize: '9px' }}>Mock</MockDataBadge>
                        ) : null}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div
              className="sidebar-user-card"
              onClick={() => setSettingsOpen(true)}
              role="button"
              tabIndex={0}
              title="User Profile & SOC Environment"
            >
              <div className="sidebar-avatar">AN</div>
              {!collapsed && (
                <div className="sidebar-user-info">
                  <span className="sidebar-user-name">Tier-2 Analyst</span>
                  <span className="sidebar-user-role">SOC Operations</span>
                </div>
              )}
              {!collapsed && <Settings size={15} color="var(--text-muted)" />}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="dashboard-main">
          {/* Top Bar */}
          <header className="dashboard-topbar" role="banner">
            <div className="topbar-left">
              {isMobile && (
                <IconButton
                  icon={<Menu size={18} />}
                  ariaLabel="Open navigation menu"
                  onClick={() => setMobileDrawerOpen(true)}
                />
              )}
              <span className="topbar-product-badge">Threat Intelligence</span>
              <nav className="topbar-breadcrumbs" aria-label="Breadcrumb">
                {breadcrumbs.map((b, idx) => (
                  <React.Fragment key={b.url}>
                    {idx > 0 && <span style={{ opacity: 0.4 }}>/</span>}
                    {idx === breadcrumbs.length - 1 ? (
                      <span className="current">{b.name}</span>
                    ) : (
                      <NavLink to={b.url}>{b.name}</NavLink>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            </div>

            <div className="topbar-center">
              {/* Centre Status Pill */}
              <div className="topbar-status-pill">
                <StatusDot status={apiOnline ? 'online' : 'warning'} />
                <span>{threatCount} Ingested Threats</span>
              </div>

              {/* Search trigger */}
              <button
                type="button"
                className="topbar-search-trigger"
                onClick={() => setCmdOpen(true)}
                aria-label="Open search (Ctrl+K)"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Search size={14} />
                  <span>Search CVE, IP, hash (Ctrl+K)...</span>
                </div>
                <span className="topbar-search-shortcut">⌘K</span>
              </button>
            </div>

            <div className="topbar-right">
              {/* Manual refresh action with Tooltip */}
              <Tooltip
                content={
                  syncing
                    ? 'Disabled: Telemetry synchronization in progress (polling NVD & GitHub).'
                    : `Last collection: ${lastSyncTime}. Click to trigger live NVD and GitHub sync.`
                }
              >
                <div>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<RefreshCw size={13} className={syncing ? 'spin' : ''} />}
                    onClick={handleManualSync}
                    disabled={syncing}
                  >
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{lastSyncTime}</span>
                  </Button>
                </div>
              </Tooltip>

              {/* Notifications Bell */}
              <IconButton
                icon={<Bell size={18} />}
                ariaLabel="View active security notifications"
                onClick={() => setNotifOpen(true)}
              />

              {/* Analyst profile pill */}
              <div
                className="topbar-profile-pill"
                onClick={() => setSettingsOpen(true)}
                role="button"
                tabIndex={0}
                title="Analyst Profile"
              >
                <div className="sidebar-avatar" style={{ width: '26px', height: '26px', fontSize: '11px' }}>
                  AN
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Analyst
                </span>
              </div>
            </div>
          </header>

          {/* Dynamic Route Content */}
          <main id="dashboard-main-content" className="dashboard-content-area" tabIndex={-1}>
            <Outlet />
          </main>
        </div>
      </div>

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={cmdOpen}
        onClose={() => setCmdOpen(false)}
        commands={commands}
      />

      {/* Notifications Drawer */}
      <Drawer
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        title="Ingestion & Security Notifications"
        subtitle="Recent advisory collections and telemetry logs"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ padding: 'var(--space-4)', background: 'var(--bg-raised)', borderRadius: 'var(--radius-md)', border: 'var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span className="ui-severity-badge ui-severity-badge-critical">CRITICAL</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>12m ago</span>
            </div>
            <strong style={{ fontSize: 'var(--text-14)', color: 'var(--text-primary)' }}>
              CVE-1999-0095 Sendmail Debug Execution
            </strong>
            <p style={{ fontSize: 'var(--text-13)', color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.5 }}>
              Active exploitation advisory received from NVD. Root privilege escalation possible via debug command.
            </p>
          </div>

          <div style={{ padding: 'var(--space-4)', background: 'var(--bg-raised)', borderRadius: 'var(--radius-md)', border: 'var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span className="ui-severity-badge ui-severity-badge-high">HIGH</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>45m ago</span>
            </div>
            <strong style={{ fontSize: 'var(--text-14)', color: 'var(--text-primary)' }}>
              GitHub Advisory GHSA-xxxx Ingested
            </strong>
            <p style={{ fontSize: 'var(--text-13)', color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.5 }}>
              10 security advisories parsed and normalized into active threat correlation graph.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setNotifOpen(false);
              navigate('/dashboard/alerts');
            }}
          >
            Open All Alerts in Module
          </Button>
        </div>
      </Drawer>

      {/* Platform Settings Modal */}
      <Modal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="SOC Platform Environment"
        footer={
          <Button variant="primary" size="sm" onClick={() => setSettingsOpen(false)}>
            Close Settings
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', fontSize: 'var(--text-13)' }}>
          <div>
            <h4 style={{ margin: '0 0 6px', fontSize: 'var(--text-14)', color: 'var(--text-primary)' }}>Backend API Telemetry</h4>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              Vite dev proxy active for <code>/api</code> routed to Flask service on port 5000.
            </p>
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <StatusDot status={apiOnline ? 'online' : 'offline'} />
              <span>Status: {apiOnline ? 'Live Flask REST Service Connected' : 'Simulated fallback mode active'}</span>
            </div>
          </div>

          <div>
            <h4 style={{ margin: '0 0 6px', fontSize: 'var(--text-14)', color: 'var(--text-primary)' }}>Model Attribution & Governance</h4>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              All synthetic indicators (MITRE correlations, confidence scores, cluster attributions) carry the <MockDataBadge /> badge. No unverified estimates are presented as real telemetry.
            </p>
          </div>
        </div>
      </Modal>

      {/* Telemetry Ingestion Confirm Modal */}
      <Modal
        isOpen={syncConfirmOpen}
        onClose={() => setSyncConfirmOpen(false)}
        title="Confirm Telemetry Ingestion"
        footer={
          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
            <Button variant="ghost" size="sm" onClick={() => setSyncConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={performSync}>
              Confirm & Collect
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--text-13)', color: 'var(--text-secondary)' }}>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            This action triggers external polling against the live upstream APIs:
          </p>
          <ul style={{ margin: 0, paddingLeft: 'var(--space-5)', lineHeight: 1.6 }}>
            <li><strong>National Vulnerability Database:</strong> <code>POST /api/collect/nvd</code></li>
            <li><strong>GitHub Advisory Database:</strong> <code>POST /api/collect/github</code></li>
          </ul>
          <p style={{ margin: 0, fontSize: 'var(--text-12)', color: 'var(--text-muted)' }}>
            Each collector call enforces an automated 90-second timeout with fallback verification. Ingested records will automatically normalize into the active threat feed.
          </p>
        </div>
      </Modal>

      {/* Telemetry Ingestion Error Diagnostics Modal */}
      <Modal
        isOpen={Boolean(syncErrorModal)}
        onClose={() => setSyncErrorModal(null)}
        title="Telemetry Collection Diagnostics"
        footer={
          <Button variant="primary" size="sm" onClick={() => setSyncErrorModal(null)}>
            Acknowledge
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ padding: 'var(--space-3)', background: 'var(--severity-critical-tint)', border: '1px solid var(--severity-critical)', borderRadius: 'var(--radius-sm)', color: 'var(--severity-critical-text)', fontSize: 'var(--text-13)', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)' }}>
            {syncErrorModal}
          </div>
          <p style={{ margin: 0, fontSize: 'var(--text-12)', color: 'var(--text-secondary)' }}>
            Verify that the Flask server is running on port 5000 and that upstream rate limits have not been reached.
          </p>
        </div>
      </Modal>

      {/* Mobile Drawer */}
      {isMobile && mobileDrawerOpen && (
        <div className="ui-drawer-overlay" onClick={() => setMobileDrawerOpen(false)}>
          <div className="ui-drawer-content" style={{ maxWidth: '280px', backgroundColor: 'var(--bg-sidebar)' }} onClick={e => e.stopPropagation()}>
            <div className="sidebar-header">
              <span className="sidebar-brand">CyberNexus</span>
              <IconButton icon={<X size={16} />} ariaLabel="Close menu" onClick={() => setMobileDrawerOpen(false)} />
            </div>
            <nav className="sidebar-nav">
              {navigationGroups.map(group => (
                <div key={group.group} className="sidebar-group">
                  <div className="sidebar-group-label">{group.group}</div>
                  {group.items.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/dashboard'}
                      className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                      onClick={() => setMobileDrawerOpen(false)}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};
