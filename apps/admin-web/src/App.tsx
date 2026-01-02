import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SitesProvider } from './context/SitesContext';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import WorkersPage from './pages/WorkersPage';
import AttendancePage from './pages/AttendancePage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <SitesProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="workers" element={<WorkersPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SitesProvider>
  );
}

export default App;
