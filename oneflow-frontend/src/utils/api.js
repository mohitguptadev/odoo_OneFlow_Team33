import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    // Check both localStorage and sessionStorage for token
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses and errors
api.interceptors.response.use(
  (response) => {
    // Return response as-is (don't transform)
    return response;
  },
  (error) => {
    // Handle different error scenarios
    const requestUrl = error?.config?.url || '';

    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;

      // Do NOT force-redirect on auth endpoints themselves; show real error
      const isAuthEndpoint = /\/auth\/(login|register|forgot-password)/.test(requestUrl);
      
      if (status === 401) {
        if (isAuthEndpoint) {
          // Surface backend message like "Invalid email or password"
          return Promise.reject({ success: false, error: data.error || 'Unauthorized' });
        }
        // For other endpoints, clear session and redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject({ success: false, error: 'Session expired. Please login again.' });
      }
      
      if (status === 403) {
        return Promise.reject({ 
          success: false, 
          error: data.error || 'Access denied. Insufficient permissions.' 
        });
      }
      
      if (status === 404) {
        return Promise.reject({ 
          success: false, 
          error: data.error || 'Resource not found.' 
        });
      }
      
      if (status >= 500) {
        return Promise.reject({ 
          success: false, 
          error: data.error || 'Server error. Please try again later.' 
        });
      }
      
      return Promise.reject({ 
        success: false, 
        error: data.error || data.message || 'An error occurred' 
      });
    } else if (error.request) {
      // Request made but no response
      return Promise.reject({ 
        success: false, 
        error: 'Network error. Please check your connection.' 
      });
    } else {
      // Error setting up request
      return Promise.reject({ 
        success: false, 
        error: error.message || 'An unexpected error occurred' 
      });
    }
  }
);

export default api;
