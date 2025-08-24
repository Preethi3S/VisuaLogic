import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// Use environment variable or hardcoded URL
const API_URL = import.meta.env.VITE_API_URL || "https://visualogic-backend.onrender.com";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  // Automatically logout if token expired
  useEffect(() => {
    if (user?.expiry && Date.now() > user.expiry) {
      logout();
    }
  }, [user]);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/api/users/login`, { email, password });

      // Suppose backend returns { token, user, expiresIn }
      const { token, user: userData, expiresIn } = res.data;
      const expiry = Date.now() + expiresIn * 1000;

      const storedData = { ...userData, token, expiry };
      setUser(storedData);
      localStorage.setItem("user", JSON.stringify(storedData));

      return storedData;
    } catch (error) {
      throw error.response?.data?.message || "Login failed";
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await axios.post(`${API_URL}/api/users/register`, {
        name,
        email,
        password,
      });
      return res.data; // Could auto-login here if desired
    } catch (error) {
      throw error.response?.data?.message || "Registration failed";
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  // Optionally attach token to every request
  useEffect(() => {
    if (user?.token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${user.token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
