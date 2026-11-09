import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { MainLayout } from './layouts/MainLayout/MainLayout';
import { Home } from './pages/Home/Home';
import { About } from './pages/About/About';
import { Training } from './pages/Training/Training';
import { Registration } from './pages/Registration/Registration';
import { NotFound } from './pages/NotFound/NotFound';
import { AuthProvider } from './context/AuthContext';
import { AdminLogin } from './pages/Admin/AdminLogin';
import { AdminLayout } from './layouts/AdminLayout/AdminLayout';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { AdminLeads } from './pages/Admin/AdminLeads';
import { AdminKnowledge } from './pages/Admin/AdminKnowledge';

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}

export function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Public Website Routes */}
          <Route
            path="/"
            element={
              <MainLayout>
                <Home />
              </MainLayout>
            }
          />
          <Route
            path="/about"
            element={
              <MainLayout>
                <About />
              </MainLayout>
            }
          />
          <Route
            path="/training"
            element={
              <MainLayout>
                <Training />
              </MainLayout>
            }
          />
          <Route
            path="/register"
            element={
              <MainLayout>
                <Registration />
              </MainLayout>
            }
          />

          {/* Admin Authentication & Management Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="leads" element={<AdminLeads />} />
            <Route path="knowledge" element={<AdminKnowledge />} />
          </Route>

          {/* 404 Handler */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
