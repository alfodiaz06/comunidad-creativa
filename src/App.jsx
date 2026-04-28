import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/student/StudentDashboard';
import CoursePage from './pages/student/CoursePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCourses from './pages/admin/AdminCourses';
import AdminPersonas from './pages/admin/AdminPersonas';
import AdminCuentas from './pages/admin/AdminCuentas';
import AdminTorre from './pages/admin/AdminTorre';
import AdminPapelera from './pages/admin/AdminPapelera';
import AdminCourseEditor from './pages/admin/AdminCourseEditor';
import ProtectedRoute from './components/shared/ProtectedRoute';
import AdminRoute from './components/shared/AdminRoute';
import LoadingScreen from './components/shared/LoadingScreen';

export default function App() {
  const { loading } = useAuth();
  if (loading) return <LoadingScreen/>;
  return (
    <Routes>
      <Route path="/login" element={<LoginPage/>}/>
      <Route element={<ProtectedRoute/>}>
        <Route path="/dashboard" element={<StudentDashboard/>}/>
        <Route path="/course/:courseId" element={<CoursePage/>}/>
        <Route path="/course/:courseId/lesson/:lessonId" element={<CoursePage/>}/>
      </Route>
      <Route element={<AdminRoute/>}>
        <Route path="/admin" element={<AdminDashboard/>}/>
        <Route path="/admin/personas" element={<AdminPersonas/>}/>
        <Route path="/admin/cuentas" element={<AdminCuentas/>}/>
        <Route path="/admin/torre" element={<AdminTorre/>}/>
        <Route path="/admin/papelera" element={<AdminPapelera/>}/>
        <Route path="/admin/courses" element={<AdminCourses/>}/>
        <Route path="/admin/courses/:courseId/edit" element={<AdminCourseEditor/>}/>
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
      <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
    </Routes>
  );
}
