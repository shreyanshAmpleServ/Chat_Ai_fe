import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
// dotenv.config();
/**
 * Base URL for API requests.
 * @type {string}
 */
// const baseURL: string = "https://ticketing_app_api.dcctz.com/api/v1/";

const baseURL: string = "https://chatbot_api.dcctz.com/api/v1/";
// const baseURL: string = (import.meta as any).env?.API_BASE_URL || "http://localhost:5000/api/v1/";
// console.log("API Base URL:", (import.meta as any).env?.API_BASE_URL);
/**
 * Creates and configures an Axios instance with baseURL and request/response interceptors.
 * @param {string} baseURL - The base URL for API requests.
 * @returns {import("axios").AxiosInstance} - The configured Axios instance.
 */
const createAxiosInstance = (baseURL: string): AxiosInstance => {
  const instance = axios.create({ baseURL });

  // Request interceptor
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig<any>) => {
      const Authorization = "Bearer " + localStorage.getItem("auth_token");
      config.headers.set("Authorization", Authorization);
      return config;
    },

    (error: AxiosError) => Promise.reject(error)
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      // if (error.response?.status === 401) {
      //   // Clear all stored auth data
      //   localStorage.removeItem("auth_token");
      //   localStorage.removeItem("user");
      //   // localStorage.clear();
      //   window.location.href = "/login";
      //   return Promise.reject({
      //     status: 401,
      //     message: "Session expired. Please login again.",
      //   });
      // }
      // Handle 403 Forbidden - User doesn't have permission
      // if (error.response?.status === 403) {
      //   console.error("Access Forbidden:", error.response.data);
      //   return Promise.reject({
      //     status: 403,
      //     message: "You do not have permission to access this resource.",
      //   });
      // }
      // Handle 404 Not Found
      if (error.response?.status === 404) {
        return Promise.reject({
          status: 404,
          message: "Resource not found.",
        });
      }
      // Handle 500 Internal Server Error
      const status = error.response?.status ?? 0;
      if (status >= 500) {
        console.error("Server Error:", error.response?.data);
        return Promise.reject({
          status,
          message: "Server error. Please try again later.",
        });
      }
      console.log(
        "API Error:",
        (error?.response?.data as any)?.message || error.message
      );
      // Extract error message from response or use default
      const errorMessage =
        (error.response?.data as any)?.message ||
        error.message ||
        (error.response?.data as any)?.error ||
        "An unexpected error occurred";

      console.error("API Error:", errorMessage);

      return Promise.reject({
        status: error.response?.status || "UNKNOWN",
        message: errorMessage,
        data: error.response?.data,
      });
      // return Promise.reject((error?.response?.data as any)?.error);
    }
  );

  return instance;
};

/**
 * Axios instance with baseURL set and request/response interceptors configured.
 * @type {import("axios").AxiosInstance}
 */
const axiosInstance: AxiosInstance = createAxiosInstance(baseURL);

export default axiosInstance;
