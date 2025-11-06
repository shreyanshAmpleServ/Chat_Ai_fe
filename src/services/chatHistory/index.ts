/**
 * Service for interacting with categories API
 */
import axiosInstance from "../../configs/axios";
// import { Category } from "../../types/Category";

/**
 * Fetch categories list
 * @param {Object} params - request parameters
 * @param {number} [params.page=1] - page number
 * @param {number} [params.limit=10] - number of records per page
 * @param {string} [params.search] - search query
 * @returns {Promise<Object>} - response data
 */
export const chatHistoryFn = async (params: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  try {
    const response = await axiosInstance.get("/chat-history", { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch category by id
 * @param {number} id - category id
 * @returns {Promise<Category>} - response data
 */
export const chatDetailFn = async (id: number): Promise<any> => {
  try {
    const response = await axiosInstance.get(`/chat-details/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Create category
 * @param {Category} body - category data
 * @returns {Promise<Category>} - response data
 */
export const askQuestionFn = async (body: any) => {
  try {
    const response = await axiosInstance.post("/ask-question", body);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const deleteChatHistoryFn = async (id: any) => {
  try {
    const response = await axiosInstance.delete("/chat-history/" + id);
    return response.data;
  } catch (error) {
    throw error;
  }
};
