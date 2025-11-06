import withToast from "../../utils/withToast";
import { User } from "../../types/index";
import axiosInstance from "../../configs/axios";

export interface LoginCredentials {
  email: string;
  password: string;
}
export interface SignUpCredentials {
  email: string;
  password: string;
  username: string;
  company: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

export const loginFn = async ({
  email,
  password,
}: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await withToast(() =>
      axiosInstance.post<AuthResponse>("login", { email, password })
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const registerFn = async (
  reqData: LoginCredentials
): Promise<AuthResponse> => {
  try {
    const response = await withToast(() =>
      axiosInstance.post<AuthResponse>("register", reqData)
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get current user
 *
 * @returns {Promise<{ user: User }>} - User details
 */
export const getCurrentUserFn = async (): Promise<{ user: User }> => {
  try {
    const response = await axiosInstance.get<{ user: User }>("auth/me");
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Logout user
 *
 * @returns {Promise<void>} - Logout response
 */
export const logoutFn = async (): Promise<void> => {
  try {
    await axiosInstance.post("/logout");
  } catch (error) {
    throw error;
  }
};

/**
 * Refresh token
 *
 * @returns {Promise<AuthResponse>} - Auth response
 */
export const refreshTokenFn = async (): Promise<AuthResponse> => {
  try {
    const response = await axiosInstance.post<AuthResponse>("refresh");
    return response.data;
  } catch (error) {
    throw error;
  }
};
