import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DevChartsPage } from './pages/DevCharts';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dev/charts" element={<DevChartsPage />} />
        <Route path="*" element={<Navigate to="/dev/charts" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
