import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { LockScreen } from './components/LockScreen';

// Import Pages
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Deals from './pages/Deals';
import Admin from './pages/Admin';
import Academy from './pages/Academy';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import Login from './pages/Login';
import Register from './pages/Register';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

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

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
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

        {/* Protected CRM Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contacts"
          element={
            <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'EDITOR']}>
              <Contacts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/deals"
          element={
            <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'EDITOR', 'ACCOUNT', 'SALESMAN']}>
              <Deals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN']}>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/academy"
          element={
            <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'EDITOR']}>
              <Academy />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'EDITOR', 'SALESMAN']}>
              <Products />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/form"
          element={
            <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'EDITOR', 'SALESMAN']}>
              <ProductForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/form/:id"
          element={
            <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'EDITOR', 'SALESMAN']}>
              <ProductForm />
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
  minHeight: '100vh',
  width: '100vw',
  background: '#080810',
};

export default App;
