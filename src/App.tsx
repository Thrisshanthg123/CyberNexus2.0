import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Skeleton } from './components/ui';

// Route-level code splitting via React.lazy
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const OverviewPage = lazy(() => import('./pages/dashboard/Overview').then(m => ({ default: m.OverviewPage })));
const AnalyticsPage = lazy(() => import('./pages/dashboard/Analytics').then(m => ({ default: m.AnalyticsPage })));
const MLIntelligencePage = lazy(() => import('./pages/dashboard/MLIntelligence').then(m => ({ default: m.MLIntelligencePage })));
const LiveFeedPage = lazy(() => import('./pages/dashboard/LiveFeed').then(m => ({ default: m.LiveFeedPage })));
const ThreatDetailsPage = lazy(() => import('./pages/dashboard/ThreatDetails').then(m => ({ default: m.ThreatDetailsPage })));
const IocExplorerPage = lazy(() => import('./pages/dashboard/IocExplorer').then(m => ({ default: m.IocExplorerPage })));
const ThreatGraphPage = lazy(() => import('./pages/dashboard/ThreatGraph').then(m => ({ default: m.ThreatGraphPage })));
const ReportsPage = lazy(() => import('./pages/dashboard/Reports').then(m => ({ default: m.ReportsPage })));
const CampaignsPage = lazy(() => import('./pages/dashboard/Campaigns').then(m => ({ default: m.CampaignsPage })));
const SourcesPage = lazy(() => import('./pages/dashboard/Sources').then(m => ({ default: m.SourcesPage })));
const AlertsPage = lazy(() => import('./pages/dashboard/Alerts').then(m => ({ default: m.AlertsPage })));
const InvestigationPage = lazy(() => import('./pages/dashboard/Investigation').then(m => ({ default: m.InvestigationPage })));

const RouteLoadingFallback = () => (
  <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: '1200px', margin: '0 auto' }}>
    <Skeleton height={36} width={260} />
    <Skeleton height={140} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
      <Skeleton height={240} />
      <Skeleton height={240} />
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Dashboard Shell with 12 module routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="ml" element={<MLIntelligencePage />} />
            <Route path="feed" element={<LiveFeedPage />} />
            <Route path="threats/:id" element={<ThreatDetailsPage />} />
            <Route path="iocs" element={<IocExplorerPage />} />
            <Route path="graph" element={<ThreatGraphPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="campaigns" element={<CampaignsPage />} />
            <Route path="sources" element={<SourcesPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="investigation" element={<InvestigationPage />} />
            {/* Fallback inside dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Global Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
