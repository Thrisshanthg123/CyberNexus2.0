import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { OverviewPage } from './pages/dashboard/Overview';
import { AnalyticsPage } from './pages/dashboard/Analytics';
import { MLIntelligencePage } from './pages/dashboard/MLIntelligence';
import { DevChartsPage } from './pages/DevCharts';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Dashboard nested shell */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="ml" element={<MLIntelligencePage />} />
          {/* Fallback inside dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* Phase 1 scratch dev route (removed at end of Phase 4) */}
        <Route path="/dev/charts" element={<DevChartsPage />} />

        {/* Root redirect to dashboard until Landing is built in Phase 4 */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
