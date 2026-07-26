import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { LockScreen } from './components/LockScreen';
import { logVisitAPI } from './services/api';

// Import Pages
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Deals from './pages/Deals';
import Admin from './pages/Admin';
import Academy from './pages/Academy';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import Marketing from './pages/Marketing';
import SpecimenTracker from './pages/SpecimenTracker';
import MasterData from './pages/MasterData';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Visits from './pages/Visits';

// Protected Route Component (Database-driven Dynamic RBAC)
const ProtectedRoute = ({ children, menuPath, action }) => {
  const { isAuthenticated, loading, user, permissions } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      let name = '';
      if (menuPath) {
        const perm = permissions.find(p => p.menu.path === menuPath);
        name = perm?.menu?.name || menuPath;
      } else {
        name = 'Profile Settings';
      }
      const currentPath = menuPath || '/profile';
      logVisitAPI(currentPath, name).catch((err) =>
        console.error('Visit logging failed:', err)
      );
    }
  }, [isAuthenticated, menuPath, permissions]);

  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div className="skeleton" style={{ width: '80px', height: '80px', borderRadius: '50%' }} />
        <p style={{ marginTop: '16px', color: '#94a3b8' }}>Verifying identity...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // SUPERADMIN always bypasses all checks
  if (user.role === 'SUPERADMIN') {
    return children;
  }

  // Look up permissions inside dynamic state loaded from the DB
  if (menuPath) {
    const perm = permissions.find(p => p.menu.path === menuPath);
    if (!perm) {
      return <Navigate to="/" replace />;
    }

    if (action) {
      if (!perm.actions || !perm.actions.includes(action)) {
        return <Navigate to="/" replace />;
      }
    } else {
      if (!perm.actions || !perm.actions.includes('canView')) {
        return <Navigate to="/" replace />;
      }
    }
  }

  return children;
};

const App = () => {
  return (
    <LockScreen>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Dashboard/App Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute menuPath="/">
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contacts"
          element={
            <ProtectedRoute menuPath="/contacts">
              <Contacts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/deals"
          element={
            <ProtectedRoute menuPath="/deals">
              <Deals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute menuPath="/admin">
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/academy"
          element={
            <ProtectedRoute menuPath="/academy">
              <Academy />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute menuPath="/products" action="canView">
              <Products />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/form"
          element={
            <ProtectedRoute menuPath="/products" action="canCreate">
              <ProductForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/form/:id"
          element={
            <ProtectedRoute menuPath="/products" action="canEdit">
              <ProductForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/visits"
          element={
            <ProtectedRoute menuPath="/visits">
              <Visits />
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketing"
          element={
            <ProtectedRoute menuPath="/marketing">
              <Marketing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/specimen"
          element={
            <ProtectedRoute menuPath="/specimen">
              <SpecimenTracker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/master-data"
          element={
            <ProtectedRoute menuPath="/master-data">
              <MasterData />
            </ProtectedRoute>
          }
        />

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </LockScreen>
  );
};

const loadingContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 'screen',
  height: '100vh',
  backgroundColor: '#0a0a0f',
};

export default App;
