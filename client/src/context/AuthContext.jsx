import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginAPI, registerAPI, getMeAPI, getMyPermissionsAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('crm_token'));
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = async () => {
    try {
      const res = await getMyPermissionsAPI();
      if (res.success) {
        setPermissions(res.data);
      }
    } catch (err) {
      console.error('Failed to load dynamic permissions context:', err);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const res = await getMeAPI();
          if (res.success) {
            setUser(res.user);
            const permRes = await getMyPermissionsAPI();
            if (permRes.success) {
              setPermissions(permRes.data);
            }
          } else {
            logout();
          }
        } catch (error) {
          console.error('Failed to load user info:', error);
          logout();
        }
      }
      setLoading(false);
    };

    loadUser();

    let intervalId;
    if (token) {
      intervalId = setInterval(async () => {
        try {
          const res = await getMeAPI();
          if (res.success) {
            setUser((prevUser) => {
              if (
                !prevUser ||
                prevUser.role !== res.user.role ||
                prevUser.name !== res.user.name ||
                prevUser.email !== res.user.email
              ) {
                return res.user;
              }
              return prevUser;
            });

            const permRes = await getMyPermissionsAPI();
            if (permRes.success) {
              setPermissions((prevPerms) => {
                if (JSON.stringify(prevPerms) !== JSON.stringify(permRes.data)) {
                  return permRes.data;
                }
                return prevPerms;
              });
            }
          }
        } catch (err) {
          console.error('Runtime sync error:', err);
          if (err.response && err.response.status === 401) {
            logout();
          }
        }
      }, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await loginAPI(email, password);
      if (res.success) {
        localStorage.setItem('crm_token', res.token);
        setToken(res.token);
        setUser(res.user);
        
        // Load permissions instantly on login success
        try {
          const permRes = await getMyPermissionsAPI();
          if (permRes.success) {
            setPermissions(permRes.data);
          }
        } catch (err) {
          console.error(err);
        }

        return { success: true };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await registerAPI(name, email, password);
      if (res.success) {
        localStorage.setItem('crm_token', res.token);
        setToken(res.token);
        setUser(res.user);
        
        try {
          const permRes = await getMyPermissionsAPI();
          if (permRes.success) {
            setPermissions(permRes.data);
          }
        } catch (err) {
          console.error(err);
        }

        return { success: true };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (error) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || 'Registration failed';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('crm_token');
    setToken(null);
    setUser(null);
    setPermissions([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        permissions,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        fetchPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
