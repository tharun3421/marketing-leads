import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('crm_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('crm_token') || null;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token and user match
    if (token && user) {
      localStorage.setItem('crm_token', token);
      localStorage.setItem('crm_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('crm_token');
      localStorage.removeItem('crm_user');
      setUser(null);
      setToken(null);
    }
    setLoading(false);
  }, [token, user]);

  const login = async (username, password) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      setToken(data.token);
      setUser({
        id: data._id,
        name: data.name,
        username: data.username,
        role: data.role
      });
      
      return { success: true, user: data };
    } catch (error) {
      console.error('Login request error:', error.message);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
  };

  const authFetch = async (url, options = {}) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${apiUrl}${url}`, {
      ...options,
      headers
    });

    if (res.status === 401) {
      // Auto logout if token expires/invalid
      logout();
    }

    return res;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, authFetch, loading }}>
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
