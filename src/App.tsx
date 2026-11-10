import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout/MainLayout';
import { Home } from './pages/Home/Home';
import { AuthProvider } from './context/AuthContext';
import { AdminLayout } from './layouts/AdminLayout/AdminLayout';

// Lazy-loaded secondary & administrative routes for optimal code splitting
const About = lazy(() => import('./pages/About/About').then((m) => ({ default: m.About })));
const Training = lazy(() => import('./pages/Training/Training').then((m) => ({ default: m.Training })));
const Registration = lazy(() => import('./pages/Registration/Registration').then((m) => ({ default: m.Registration })));
const NotFound = lazy(() => import('./pages/NotFound/NotFound').then((m) => ({ default: m.NotFound })));
const AdminLogin = lazy(() => import('./pages/Admin/AdminLogin').then((m) => ({ default: m.AdminLogin })));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminLeads = lazy(() => import('./pages/Admin/AdminLeads').then((m) => ({ default: m.AdminLeads })));
const AdminKnowledge = lazy(() => import('./pages/Admin/AdminKnowledge').then((m) => ({ default: m.AdminKnowledge })));

const PageLoader = () => (
  <div className="min-h-[60vh] bg-[#080808] flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-[#FF5A1F] border-t-transparent animate-spin" />
  </div>
);

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
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
