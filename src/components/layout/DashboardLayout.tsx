import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  BarChart3,
  Cpu,
  Radio,
  Network,
  FileText,
  Boxes,
  Database,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  Menu,
  User,
  Key,
  FolderGit2,
  ExternalLink,
  Command
} from 'lucide-react';
import { Tooltip, Badge, IconButton } from '../ui';
import { useAsync, useMediaQuery } from '../../hooks';
import { api } from '../../services/api';
import './DashboardLayout.css';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeVariant?: 'critical' | 'high' | 'medium' | 'low' | 'simulated' | 'planned';
}

const mainNavItems: NavItem[] = [
  { to: '/dashboard', label: 'Overview', icon: <Radio size={18} /> },
  { to: '/dashboard/analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
  { to: '/dashboard/ml', label: 'ML Intelligence', icon: <Cpu size={18} />, badge: 'Simulated', badgeVariant: 'simulated' },
  { to: '/dashboard/feed', label: 'Live Feed', icon: <ShieldAlert size={18} /> },
  { to: '/dashboard/iocs', label: 'IOC Explorer', icon: <Key size={18} /> },
  { to: '/dashboard/graph', label: 'Threat Graph', icon: <Network size={18} /> },
  { to: '/dashboard/campaigns', label: 'Campaigns', icon: <Boxes size={18} /> },
  { to: '/dashboard/sources', label: 'Sources', icon: <Database size={18} /> },
  { to: '/dashboard/alerts', label: 'Alerts', icon: <Bell size={18} /> },
  { to: '/dashboard/investigation', label: 'Investigation', icon: <FolderGit2 size={18} /> },
  { to: '/dashboard/reports', label: 'Reports', icon: <FileText size={18} /> }
];

export const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isMobile = useMediaQuery('(max-width: 768px)');
  const location = useLocation();
  const navigate = useNavigate();

  const alertsAsync = useAsync(() => api.getAlerts());
  const threatsAsync = useAsync(() => api.getThreats());

  const unreadAlerts = alertsAsync.data?.filter(a => !a.read) || [];

  // Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setCmdOpen(false);
        setNotifOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const breadcrumbs = location.pathname
    .split('/')
    .filter(Boolean)
    .map((seg, idx, arr) => {
      const url = `/${arr.slice(0, idx + 1).join('/')}`;
      const name = seg.charAt(0).toUpperCase() + seg.slice(1);
      return { name, url };
    });

  const filteredCmdThreats = (threatsAsync.data || [])
    .filter(t => 
      t.title.toLowerCase().includes(cmdQuery.toLowerCase()) ||
      t.cveId.toLowerCase().includes(cmdQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(cmdQuery.toLowerCase()) ||
      t.actor.toLowerCase().includes(cmdQuery.toLowerCase())
    )
    .slice(0, 8);

  return (
    <div className="dashboard-root">
      {/* Skip to Content for WCAG keyboard accessibility */}
      <a href="#dashboard-main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Desktop Collapsible Sidebar */}
      <aside className={`dashboard-sidebar ${collapsed ? 'collapsed' : ''}`} aria-label="Sidebar navigation">
        <div className="sidebar-header">
          <NavLink to="/" className="sidebar-brand">
            <div className="sidebar-brand-icon">CN</div>
            {!collapsed && <span>CyberNexus</span>}
          </NavLink>
          <IconButton
            icon={collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            variant="outline"
            onClick={() => setCollapsed(prev => !prev)}
          />
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">{!collapsed ? 'Intelligence Suite' : '•••'}</div>
          {mainNavItems.map(item => {
            const linkContent = (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                {item.icon}
                {!collapsed && (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span>{item.label}</span>
                    {item.badge && <Badge variant={item.badgeVariant}>{item.badge}</Badge>}
                  </span>
                )}
              </NavLink>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.to} content={item.label}>
                  {linkContent}
                </Tooltip>
              );
            }
            return linkContent;
          })}
        </nav>

        <div className="sidebar-footer">
          <NavLink
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              color: 'var(--color-text-small)',
              fontSize: 'var(--text-xs)',
              textDecoration: 'none'
            }}
          >
            <ExternalLink size={14} />
            {!collapsed && <span>Landing Portal</span>}
          </NavLink>
        </div>
      </aside>

      {/* Mobile Drawer Navigation (<768px) */}
      {isMobile && mobileDrawerOpen && (
        <div className="ui-overlay-backdrop" onClick={() => setMobileDrawerOpen(false)} role="dialog" aria-modal="true">
          <div className="ui-drawer" onClick={e => e.stopPropagation()} style={{ width: '280px' }}>
            <div className="sidebar-header" style={{ padding: 0, marginBottom: 'var(--space-4)' }}>
              <div className="sidebar-brand">
                <div className="sidebar-brand-icon">CN</div>
                <span>CyberNexus</span>
              </div>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {mainNavItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/dashboard'}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  {item.icon}
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span>{item.label}</span>
                    {item.badge && <Badge variant={item.badgeVariant}>{item.badge}</Badge>}
                  </span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="dashboard-main-container">
        {/* Topbar */}
        <header className="dashboard-topbar" role="banner">
          <div className="topbar-left">
            {isMobile && (
              <IconButton
                icon={<Menu size={20} />}
                aria-label="Open navigation menu"
                variant="outline"
                onClick={() => setMobileDrawerOpen(true)}
              />
            )}
            <nav className="breadcrumb-nav" aria-label="Breadcrumb">
              {breadcrumbs.map((b, i) => (
                <React.Fragment key={b.url}>
                  {i > 0 && <span style={{ color: 'var(--color-text-muted)' }}>/</span>}
                  <NavLink to={b.url}>{b.name}</NavLink>
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div className="topbar-right">
            {/* Command Palette Trigger */}
            <button
              className="topbar-search-trigger"
              onClick={() => setCmdOpen(true)}
              aria-label="Open command search palette (Ctrl+K)"
            >
              <Search size={14} />
              <span>Search threats, CVEs, IOCs...</span>
              <kbd style={{
                background: 'var(--color-panel)',
                padding: '2px 5px',
                borderRadius: '3px',
                fontSize: '10px',
                border: '1px solid var(--color-border)',
                fontFamily: 'var(--font-mono)',
                marginLeft: 'auto'
              }}>
                Ctrl+K
              </kbd>
            </button>

            {/* Notifications Alert Popover */}
            <div style={{ position: 'relative' }}>
              <IconButton
                icon={
                  <div style={{ position: 'relative' }}>
                    <Bell size={18} />
                    {unreadAlerts.length > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        width: '8px',
                        height: '8px',
                        background: 'var(--severity-critical)',
                        borderRadius: '50%'
                      }} />
                    )}
                  </div>
                }
                aria-label={`Security alerts (${unreadAlerts.length} unread)`}
                variant="outline"
                onClick={() => setNotifOpen(prev => !prev)}
              />

              {notifOpen && (
                <div className="notifications-popover" role="region" aria-label="Recent Security Alerts">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>Active Intel Alerts</span>
                    <Badge variant="critical">{unreadAlerts.length} New</Badge>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: '300px', overflowY: 'auto' }}>
                    {alertsAsync.data?.slice(0, 5).map(alert => (
                      <div
                        key={alert.id}
                        style={{
                          padding: 'var(--space-2)',
                          background: 'var(--color-raised)',
                          borderRadius: 'var(--radius-chip)',
                          fontSize: 'var(--text-xs)',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          setNotifOpen(false);
                          if (alert.threatId) navigate(`/dashboard/threats/${alert.threatId}`);
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{alert.title}</span>
                          <Badge variant={alert.severity}>{alert.severity}</Badge>
                        </div>
                        <p style={{ color: 'var(--color-text-small)', margin: '2px 0' }}>{alert.message}</p>
                        <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                          {alert.source} • {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Analyst Profile Menu */}
            <div style={{ position: 'relative' }}>
              <IconButton
                icon={<User size={18} />}
                aria-label="Analyst profile options"
                variant="outline"
                onClick={() => setProfileOpen(prev => !prev)}
              />

              {profileOpen && (
                <div className="profile-popover" role="menu">
                  <div style={{ paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--space-2)' }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>SecOps Analyst</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', fontFamily: 'var(--font-mono)' }}>SOC Tier-3 • ID-9821</div>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', marginBottom: 'var(--space-2)' }}>
                    <div>Active Workspace: <strong>CyberNexus Global</strong></div>
                    <div style={{ marginTop: '4px' }}>API Engine: <Badge variant="simulated">MOCK MODE</Badge></div>
                  </div>
                  <NavLink
                    to="/dashboard/investigation"
                    style={{
                      display: 'block',
                      padding: 'var(--space-2)',
                      borderRadius: 'var(--radius-chip)',
                      color: 'var(--accent-cyan)',
                      fontSize: 'var(--text-xs)',
                      textDecoration: 'none'
                    }}
                    onClick={() => setProfileOpen(false)}
                  >
                    Active Cases (3)
                  </NavLink>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Global Command Palette Modal */}
        {cmdOpen && (
          <div className="cmd-palette-backdrop" onClick={() => setCmdOpen(false)}>
            <div className="cmd-palette" onClick={e => e.stopPropagation()}>
              <input
                autoFocus
                type="text"
                className="cmd-search-input"
                placeholder="Search threats, CVEs, actors, techniques..."
                value={cmdQuery}
                onChange={e => setCmdQuery(e.target.value)}
              />
              <div className="cmd-results-list">
                {filteredCmdThreats.length === 0 ? (
                  <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-small)' }}>
                    No correlated threats matching &quot;{cmdQuery}&quot;
                  </div>
                ) : (
                  filteredCmdThreats.map(threat => (
                    <div
                      key={threat.id}
                      className="cmd-item"
                      onClick={() => {
                        setCmdOpen(false);
                        navigate(`/dashboard/threats/${threat.id}`);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <Command size={14} color="var(--accent-cyan)" />
                        <div>
                          <div style={{ fontWeight: 500 }}>{threat.title}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', fontFamily: 'var(--font-mono)' }}>
                            {threat.id} • {threat.cveId} • {threat.actor}
                          </div>
                        </div>
                      </div>
                      <Badge variant={threat.severity}>{threat.severity}</Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content Viewport */}
        <main id="dashboard-main-content" className="dashboard-viewport" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
