import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://visualogic-backend.onrender.com";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  // Auto logout if token expired
  useEffect(() => {
    if (user?.expiry && Date.now() > user.expiry) {
      logout();
    }
  }, [user]);

  // Login function
  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/api/users/login`, { email, password });
      const { token, _id, name, email: userEmail, expiresIn } = res.data;

      // Set expiry in ms
      const expiry = Date.now() + expiresIn * 1000;

      const storedUser = { _id, name, email: userEmail, token, expiry };
      setUser(storedUser);
      localStorage.setItem("user", JSON.stringify(storedUser));

      // Attach token to all future axios requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      return storedUser;
    } catch (err) {
      throw err.response?.data?.message || "Login failed";
    }
  };

  // Register function
  const register = async (data) => {
    try {
      const res = await axios.post(`${API_URL}/api/users/register`, data);
      return res.data;
    } catch (err) {
      throw err.response?.data?.message || "Registration failed";
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
  };

  // Ensure token is set in axios headers on reload
  useEffect(() => {
    if (user?.token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${user.token}`;
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
