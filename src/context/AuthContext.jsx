import { createContext, useContext, useState, useEffect } from "react";
import authService from "../auth/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const existingUser = authService.getCurrentUser();
    if (existingUser) setUser(existingUser);
  }, []);

  const login = (email, password) => {
    const loggedInUser = authService.login(email, password);
    setUser(loggedInUser);
  };

  const signup = (email, password) => {
    const newUser = authService.signup(email, password);
    setUser(newUser);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
