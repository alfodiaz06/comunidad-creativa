import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/student/StudentDashboard';
import CoursePage from './pages/student/CoursePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCourses from './pages/admin/AdminCourses';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCourseEditor from './pages/admin/AdminCourseEditor';

// Shared components
import ProtectedRoute from './components/shared/ProtectedRoute';
import AdminRoute from './components/shared/AdminRoute';
import LoadingScreen from './components/shared/LoadingScreen';

export default function App() {
  const { loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Student routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/course/:courseId" element={<CoursePage />} />
        <Route path="/course/:courseId/lesson/:lessonId" element={<CoursePage />} />
      </Route>

      {/* Admin routes */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/courses" element={<AdminCourses />} />
        <Route path="/admin/courses/:courseId/edit" element={<AdminCourseEditor />} />
        <Route path="/admin/users" element={<AdminUsers />} />
      </Route>

      {/* Fallback */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
