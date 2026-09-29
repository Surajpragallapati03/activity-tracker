import type { AxiosError } from 'axios'

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }

  const axiosError = error as AxiosError<any>
  if (axiosError?.response?.data?.error) {
    return axiosError.response.data.error
  }

  if (axiosError?.response?.status === 401) {
    return 'Your session has expired. Please log in again.'
  }

  if (axiosError?.response?.status === 403) {
    return 'You do not have permission to perform this action.'
  }

  if (axiosError?.response?.status === 404) {
    return 'The requested resource was not found.'
  }

  if (axiosError?.response?.status === 409) {
    return 'This item already exists.'
  }

  if (axiosError?.response?.status === 500) {
    return 'Something went wrong on the server. Please try again.'
  }

  if (axiosError?.message === 'Network Error') {
    return 'Unable to reach the server. Please check your connection.'
  }

  return 'Something went wrong. Please try again.'
}
