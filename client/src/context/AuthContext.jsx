import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = "nova_auth";

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /*
  |--------------------------------------------------------------------------
  | Save authentication
  |--------------------------------------------------------------------------
  */

  const saveAuth = (authData) => {
    const auth = {
      token: authData.token,
      user: authData.user,
    };

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify(auth)
    );

    setToken(auth.token);
    setUser(auth.user);
  };

  /*
  |--------------------------------------------------------------------------
  | Clear authentication
  |--------------------------------------------------------------------------
  */

  const clearAuth = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);

    setToken(null);
    setUser(null);
  };

  /*
  |--------------------------------------------------------------------------
  | Restore existing authentication
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const restoreAuth = async () => {
      try {
        const storedAuth =
          localStorage.getItem(AUTH_STORAGE_KEY);

        if (!storedAuth) {
          setIsLoading(false);
          return;
        }

        const parsedAuth = JSON.parse(storedAuth);

        if (!parsedAuth?.token) {
          clearAuth();
          setIsLoading(false);
          return;
        }

        /*
        |--------------------------------------------------------------------------
        | Verify stored JWT with backend
        |--------------------------------------------------------------------------
        */

        const response = await api.get("/auth/me", {
          headers: {
            Authorization: `Bearer ${parsedAuth.token}`,
          },
        });

        if (response.data.success) {
          const auth = {
            token: parsedAuth.token,
            user: response.data.user,
          };

          localStorage.setItem(
            AUTH_STORAGE_KEY,
            JSON.stringify(auth)
          );

          setToken(parsedAuth.token);
          setUser(response.data.user);
        } else {
          clearAuth();
        }
      } catch (error) {
        console.error(
          "Authentication restore failed:",
          error
        );

        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    restoreAuth();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Login
  |--------------------------------------------------------------------------
  |
  | Accepts the same object format already used by Login.jsx:
  |
  | login({
  |   email,
  |   password
  | })
  |
  */

  const login = async ({ email, password }) => {
    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Login failed"
        );
      }

      saveAuth(response.data);

      return {
        success: true,
        token: response.data.token,
        user: response.data.user,
      };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to login";

      throw new Error(message);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Register
  |--------------------------------------------------------------------------
  |
  | Register.jsx can send the complete user object.
  |
  */

  const register = async (userData) => {
    try {
      const response = await api.post(
        "/auth/register",
        userData
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message ||
            "Registration failed"
        );
      }

      saveAuth(response.data);

      return {
        success: true,
        token: response.data.token,
        user: response.data.user,
      };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to create account";

      throw new Error(message);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */

  const logout = () => {
    clearAuth();
  };

  /*
  |--------------------------------------------------------------------------
  | Refresh current user
  |--------------------------------------------------------------------------
  */

  const refreshUser = async () => {
    try {
      if (!token) {
        return null;
      }

      const response = await api.get("/auth/me");

      if (!response.data.success) {
        return null;
      }

      const updatedUser = response.data.user;

      setUser(updatedUser);

      const storedAuth =
        localStorage.getItem(AUTH_STORAGE_KEY);

      if (storedAuth) {
        const parsedAuth = JSON.parse(storedAuth);

        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({
            ...parsedAuth,
            user: updatedUser,
          })
        );
      }

      return updatedUser;
    } catch (error) {
      console.error(
        "Unable to refresh user:",
        error
      );

      return null;
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Context value
  |--------------------------------------------------------------------------
  */

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/*
|--------------------------------------------------------------------------
| useAuth Hook
|--------------------------------------------------------------------------
*/

function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider"
    );
  }

  return context;
}

export {
  AuthProvider,
  useAuth,
};

export default AuthContext;