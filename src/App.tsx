import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigationType } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout/MainLayout';
import { Home } from './pages/Home/Home';
import { AuthProvider } from './context/AuthContext';
import { AdminLayout } from './layouts/AdminLayout/AdminLayout';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';

// Lazy-loaded secondary & administrative routes for optimal code splitting
const About = lazy(() => import('./pages/About/About').then((m) => ({ default: m.About })));
const Training = lazy(() => import('./pages/Training/Training').then((m) => ({ default: m.Training })));
const Registration = lazy(() => import('./pages/Registration/Registration').then((m) => ({ default: m.Registration })));
const NotFound = lazy(() => import('./pages/NotFound/NotFound').then((m) => ({ default: m.NotFound })));
const AdminLogin = lazy(() => import('./pages/Admin/AdminLogin').then((m) => ({ default: m.AdminLogin })));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminLeads = lazy(() => import('./pages/Admin/AdminLeads').then((m) => ({ default: m.AdminLeads })));
const AdminKnowledge = lazy(() => import('./pages/Admin/AdminKnowledge').then((m) => ({ default: m.AdminKnowledge })));
const AdminMembers = lazy(() => import('./pages/Admin/AdminMembers').then((m) => ({ default: m.AdminMembers })));
const AdminAccessLogs = lazy(() => import('./pages/Admin/AdminAccessLogs').then((m) => ({ default: m.AdminAccessLogs })));
const AdminDoors = lazy(() => import('./pages/Admin/AdminDoors').then((m) => ({ default: m.AdminDoors })));
const Kiosk = lazy(() => import('./pages/Kiosk/Kiosk').then((m) => ({ default: m.Kiosk })));

const PageLoader = () => (
  <div className="min-h-[60vh] bg-[#080808] flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-[#FF5A1F] border-t-transparent animate-spin" />
  </div>
);

// In-memory scroll position cache keyed by location.key for popstate restoration
const scrollHistoryMap = new Map<string, number>();

function ScrollRestorationHandler() {
  const location = useLocation();
  const navigationType = useNavigationType();

  // Record scroll position continuously for current history entry
  useEffect(() => {
    const handleScroll = () => {
      scrollHistoryMap.set(location.key, window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.key]);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const smoothBehavior: ScrollBehavior = prefersReduced ? 'instant' : 'smooth';

    // Hash navigation (e.g. /#amenities, /#gallery, /#location)
    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      let attempts = 0;
      const scrollToHashElement = () => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: smoothBehavior, block: 'start' });
        } else if (attempts < 6) {
          attempts++;
          setTimeout(scrollToHashElement, 50 * attempts);
        }
      };
      scrollToHashElement();
      return;
    }

    // Back / Forward browser navigation: restore exact scroll offset
    if (navigationType === 'POP') {
      const savedY = scrollHistoryMap.get(location.key);
      if (typeof savedY === 'number') {
        window.scrollTo({ top: savedY, left: 0, behavior: 'instant' });
        return;
      }
    }

    // Fresh route push / replace: reset scroll immediately to top
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname, location.hash, location.key, navigationType]);

  return null;
}

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <ScrollRestorationHandler />
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

              {/* Face Recognition Attendance Kiosk (Fullscreen) */}
              <Route path="/kiosk" element={<Kiosk />} />

              {/* Admin Authentication & Management Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="members" element={<AdminMembers />} />
                <Route path="access-logs" element={<AdminAccessLogs />} />
                <Route path="doors" element={<AdminDoors />} />
                <Route path="leads" element={<AdminLeads />} />
                <Route path="knowledge" element={<AdminKnowledge />} />
              </Route>

              {/* 404 Handler */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
