import toast from 'react-hot-toast';

/**
 * Wraps a promise-returning function with a toast notification.
 *
 * @param {Function} fn - The function to wrap.
 * @returns {Function} A function that returns a promise with a toast notification.
 */
const withToast = (fn: () => Promise<any>) => {
  const toastOptions = {
    /**
     * The message to display when the promise is pending.
     */
    loading: 'Processing...',
    /**
     * A function that takes the response and returns the success message.
     *
     * @param {Object} response - The response object.
     * @param {string} response.message - The success message.
     * @returns {string} The success message.
     */
    success: (response: { data: PromiseLike<any>; message: string }): string => response.message,
    /**
     * A function that takes the error and returns the error message.
     *
     * @param {Object} error - The error object.
     * @param {Object} error.response - The response object.
     * @param {string} error.response.data.message - The error message.
     * @returns {string} The error message.
     */
    error: (error: any): string =>
      error?.response?.data?.message ||
      error?.message ||
      'An unexpected error occurred. Please try again.'
  };

  return toast.promise(fn(), toastOptions);
};

export default withToast;
