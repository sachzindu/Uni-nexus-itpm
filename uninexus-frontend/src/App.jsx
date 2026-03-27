import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import MainLayout from './components/layout/MainLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import DiscoverPage from './pages/DiscoverPage';
import GroupsPage from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';
import CreatePostPage from './pages/CreatePostPage';
import PostDetailPage from './pages/PostDetailPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import StudentProfilePage from './pages/StudentProfilePage';
import FriendsPage from './pages/FriendsPage';
import DiscoverMatches from './pages/DiscoverMatches';
import MyGroupsPage from './pages/MyGroupsPage';
import MyEventsPage from './pages/MyEventsPage';

// Admin Pages
import AdminLoginPage from './pages/AdminLoginPage';
import AdminSignupPage from './pages/AdminSignupPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <ToastProvider>
              <Routes>
                {/* Public routes with layout */}
                <Route element={<MainLayout />}>
                  <Route path="/" element={<LandingPage />} />

                  {/* Protected routes */}
                  <Route
                    path="/onboarding"
                    element={
                      <ProtectedRoute>
                        <OnboardingPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/discovermatches"
                    element={
                      <ProtectedRoute>
                        <DiscoverMatches />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/my-groups"
                    element={
                      <ProtectedRoute>
                        <MyGroupsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/my-events"
                    element={
                      <ProtectedRoute>
                        <MyEventsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/discover"
                    element={
                      <ProtectedRoute>
                        <DiscoverPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/groups"
                    element={
                      <ProtectedRoute>
                        <GroupsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/groups/:id"
                    element={
                      <ProtectedRoute>
                        <GroupDetailPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/groups/:id/create-post"
                    element={
                      <ProtectedRoute>
                        <CreatePostPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/groups/:id/posts/:postId"
                    element={
                      <ProtectedRoute>
                        <PostDetailPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/events"
                    element={
                      <ProtectedRoute>
                        <EventsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/events/:id"
                    element={
                      <ProtectedRoute>
                        <EventDetailPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/chat"
                    element={
                      <ProtectedRoute>
                        <ChatPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/students/:id"
                    element={
                      <ProtectedRoute>
                        <StudentProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/friends"
                    element={
                      <ProtectedRoute>
                        <FriendsPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* Auth pages without layout */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                {/* Admin auth pages (no layout) */}
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/admin/signup" element={<AdminSignupPage />} />

                {/* Admin protected pages (no main layout — dashboard has its own nav) */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <AdminProtectedRoute>
                      <AdminDashboardPage />
                    </AdminProtectedRoute>
                  }
                />
              </Routes>
            </ToastProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;

