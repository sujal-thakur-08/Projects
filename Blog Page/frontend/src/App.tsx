import { Navigate, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { useAuth } from './contexts/AuthContext';
import { AdminPage } from './pages/AdminPage';
import { AuthorPage } from './pages/AuthorPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { DashboardPage } from './pages/DashboardPage';
import { EditorPage } from './pages/EditorPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { PostPage } from './pages/PostPage';
import { ProfilePage } from './pages/ProfilePage';
import { RegisterPage } from './pages/RegisterPage';
import { SearchPage } from './pages/SearchPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="posts/:slug" element={<PostPage />} />
        <Route path="author/:username" element={<AuthorPage />} />
      </Route>

      <Route
        path="dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="dashboard/write"
        element={
          <ProtectedRoute>
            <EditorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="dashboard/write/:postId"
        element={
          <ProtectedRoute>
            <EditorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="dashboard/bookmarks"
        element={
          <ProtectedRoute>
            <BookmarksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="dashboard/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="dashboard/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
