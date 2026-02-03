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

// 🔥 Nuevos imports para recolector
import RecolectorDashboard from './components/RecolectorDashboard';
import RecolectorTracker from './components/RecolectorTracker';

// ✅✅✅ NUEVO: Admin - Comunidades por ruta
import AdminRouteCommunities from './components/AdminRouteCommunities';
// Si lo guardaste en /pages entonces usa:
// import AdminRouteCommunities from './pages/AdminRouteCommunities';

const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};

const isAdmin = () => {
  return localStorage.getItem('userRole') === 'admin';
};

const isRecolector = () => {
  return localStorage.getItem('userRole') === 'recolector';
};

function App() {
  return (
    <Router>
      <>
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
            element={isAuthenticated() && !isAdmin() && !isRecolector() ? <UserDashboard /> : <Navigate to="/login" />}
          />

          {/* 🔥 Ruta Protegida: Dashboard Recolector */}
          <Route
            path="/recolector-dashboard"
            element={isAuthenticated() && isRecolector() ? <RecolectorDashboard /> : <Navigate to="/login" />}
          />

          {/* 🔥 Vista para enviar ubicación */}
          <Route
            path="/recolector-tracker"
            element={isAuthenticated() && isRecolector() ? <RecolectorTracker /> : <Navigate to="/login" />}
          />

          {/* Rutas Protegidas de Ciudadano */}
          <Route
            path="/map"
            element={isAuthenticated() && !isAdmin() && !isRecolector() ? <MapView /> : <Navigate to="/login" />}
          />
          <Route
            path="/calendar"
            element={isAuthenticated() && !isAdmin() && !isRecolector() ? <CalendarView /> : <Navigate to="/login" />}
          />
          <Route
            path="/hours"
            element={isAuthenticated() && !isAdmin() && !isRecolector() ? <HoursView /> : <Navigate to="/login" />}
          />
          <Route
            path="/reports"
            element={isAuthenticated() && !isAdmin() && !isRecolector() ? <ReportsView /> : <Navigate to="/login" />}
          />
          <Route
            path="/messages"
            element={isAuthenticated() && !isAdmin() && !isRecolector() ? <MessagesView /> : <Navigate to="/login" />}
          />
          <Route
            path="/contact"
            element={isAuthenticated() && !isAdmin() && !isRecolector() ? <ContactView /> : <Navigate to="/login" />}
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

          {/* ✅✅✅ NUEVO: Admin - Lista de comunidades por ruta */}
          <Route
            path="/admin/route-communities"
            element={isAuthenticated() && isAdmin() ? <AdminRouteCommunities /> : <Navigate to="/login" />}
          />

          {/* Ruta catch-all */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>

        {/* ✅ LOGO FIJO EN ESQUINA (Opción 3) */}
        <div className="app-watermark" />

        {/* ✅ PLACA INSTITUCIONAL FIJA (ESQUINA IZQUIERDA) */}
        <div className="app-footer-badge">
          <div className="app-footer-dot" />
          <div>
            <span>ADMON</span> - LIC. MANUEL GUARCHAJ
          </div>
        </div>

        <ToastContainer position="top-right" autoClose={5000} />
      </>
    </Router>
  );
}

export default App;