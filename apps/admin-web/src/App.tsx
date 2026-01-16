import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './context/AuthContext';
import { SitesProvider } from './context/SitesContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import WorkersPage from './pages/WorkersPage';
import AttendancePage from './pages/AttendancePage';
import SettingsPage from './pages/SettingsPage';
import RiskAssessmentPage from './pages/RiskAssessmentPage';
import CreateAssessmentPage from './pages/risk-assessment/CreateAssessmentPage';
import LoginPage from './pages/LoginPage';
import PasswordResetPage from './pages/PasswordResetPage';
import {
  OnboardingLayout,
  Step1Personal,
  Step2Company,
  Step3Site,
  Step4Password,
  Step5Loading,
  Step6Complete,
} from './pages/onboarding';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SitesProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/password-reset" element={<PasswordResetPage />} />

              {/* Onboarding Routes */}
              <Route path="/onboarding" element={<OnboardingLayout />}>
                <Route index element={<Navigate to="step1" replace />} />
                <Route path="step1" element={<Step1Personal />} />
                <Route path="step2" element={<Step2Company />} />
                <Route path="step3" element={<Step3Site />} />
                <Route path="step4" element={<Step4Password />} />
                <Route path="step5" element={<Step5Loading />} />
                <Route path="step6" element={<Step6Complete />} />
              </Route>

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="workers" element={<WorkersPage />} />
                <Route path="attendance" element={<AttendancePage />} />
                <Route path="safety/risk" element={<RiskAssessmentPage />} />
                <Route path="safety/risk/create/:type" element={<CreateAssessmentPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </SitesProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
