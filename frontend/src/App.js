import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Welcome from './components/Welcome';
import Login from './components/Login';
import Register from './components/Register';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import CalendarView from './components/CalendarView';
import MapView from './components/MapView';
import HoursView from './components/HoursView';
import ReportsView from './components/ReportsView';
import MessagesView from './components/MessagesView';
import ContactView from './components/ContactView';
import Users from './components/Users';
import UserReports from './components/UserReports';
import CollectionPoints from './components/CollectionPoints';
import SendMessage from './components/SendMessage';
import AddDate from './components/AddDate';
import AddSchedule from './components/AddSchedule';
import GenerateReports from './components/GenerateReports';
import ForgotPassword from './components/ForgotPassword';

const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};

const isAdmin = () => {
  return localStorage.getItem('userRole') === 'admin';
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Ruta Protegida: Admin Dashboard */}
        <Route 
          path="/admin-dashboard" 
          element={isAuthenticated() && isAdmin() ? <AdminDashboard /> : <Navigate to="/login" />} 
        />
        
        {/* Ruta Protegida: User Dashboard */}
        <Route 
          path="/user-dashboard" 
          element={isAuthenticated() && !isAdmin() ? <UserDashboard /> : <Navigate to="/login" />} 
        />

        {/* Rutas Protegidas de Ciudadano */}
        <Route 
          path="/map" 
          element={isAuthenticated() && !isAdmin() ? <MapView /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/calendar" 
          element={isAuthenticated() && !isAdmin() ? <CalendarView /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/hours" 
          element={isAuthenticated() && !isAdmin() ? <HoursView /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/reports" 
          element={isAuthenticated() && !isAdmin() ? <ReportsView /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/messages" 
          element={isAuthenticated() && !isAdmin() ? <MessagesView /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/contact" 
          element={isAuthenticated() && !isAdmin() ? <ContactView /> : <Navigate to="/login" />} 
        />

        {/* Rutas Protegidas de Administrador */}
        <Route 
          path="/users" 
          element={isAuthenticated() && isAdmin() ? <Users /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/send-message" 
          element={isAuthenticated() && isAdmin() ? <SendMessage /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/add-date" 
          element={isAuthenticated() && isAdmin() ? <AddDate /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/add-schedule" 
          element={isAuthenticated() && isAdmin() ? <AddSchedule /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/generate-reports" 
          element={isAuthenticated() && isAdmin() ? <GenerateReports /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/collection-points" 
          element={isAuthenticated() && isAdmin() ? <CollectionPoints /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/user-reports" 
          element={isAuthenticated() && isAdmin() ? <UserReports /> : <Navigate to="/login" />} 
        />

        {/* Ruta catch-all */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={5000} />
    </Router>
  );
}

export default App;