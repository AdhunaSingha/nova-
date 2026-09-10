import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",

  headers: {
    "Content-Type": "application/json",
  },

  timeout: 10000,
});

/*
|--------------------------------------------------------------------------
| Request Interceptor
|--------------------------------------------------------------------------
*/

api.interceptors.request.use(
  (config) => {
    try {
      const storedAuth =
        localStorage.getItem("nova_auth");

      if (storedAuth) {
        const auth = JSON.parse(storedAuth);

        if (auth?.token) {
          config.headers.Authorization =
            `Bearer ${auth.token}`;
        }
      }
    } catch (error) {
      console.error(
        "Unable to attach authentication token:",
        error
      );
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/*
|--------------------------------------------------------------------------
| Response Interceptor
|--------------------------------------------------------------------------
*/

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("nova_auth");
    }

    return Promise.reject(error);
  }
);

export default api;