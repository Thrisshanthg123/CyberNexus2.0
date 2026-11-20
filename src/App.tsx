import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { OverviewPage } from './pages/dashboard/Overview';
import { AnalyticsPage } from './pages/dashboard/Analytics';
import { MLIntelligencePage } from './pages/dashboard/MLIntelligence';
import { LiveFeedPage } from './pages/dashboard/LiveFeed';
import { ThreatDetailsPage } from './pages/dashboard/ThreatDetails';
import { IocExplorerPage } from './pages/dashboard/IocExplorer';
import { ThreatGraphPage } from './pages/dashboard/ThreatGraph';
import { ReportsPage } from './pages/dashboard/Reports';
import { CampaignsPage } from './pages/dashboard/Campaigns';
import { SourcesPage } from './pages/dashboard/Sources';
import { AlertsPage } from './pages/dashboard/Alerts';
import { InvestigationPage } from './pages/dashboard/Investigation';
import { DevChartsPage } from './pages/DevCharts';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
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

        {/* Phase 1 scratch dev route (removed at end of Phase 4) */}
        <Route path="/dev/charts" element={<DevChartsPage />} />

        {/* Root fallback */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
