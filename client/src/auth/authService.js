// Temporary dummy auth logic using localStorage
const authService = {
  login: (email, password) => {
    const user = { email };
    localStorage.setItem("user", JSON.stringify(user));
    return user;
  },

  signup: (email, password) => {
    // In real app, you’d save to backend
    const user = { email };
    localStorage.setItem("user", JSON.stringify(user));
    return user;
  },

  logout: () => {
    localStorage.removeItem("user");
  },

  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("user");
  }
};

export default authService;
