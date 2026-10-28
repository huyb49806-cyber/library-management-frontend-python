import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

let refreshPromise = null

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refresh = localStorage.getItem('refresh_token')

      if (!refresh) {
        throw new Error('Phiên đăng nhập đã hết hạn')
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, { refresh }, {
          headers: { 'Content-Type': 'application/json' }
        })

        const tokens = response.data
        localStorage.setItem('access_token', tokens.access)

        if (tokens.refresh) {
          localStorage.setItem('refresh_token', tokens.refresh)
        }

        return tokens.access
      } catch (error) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.dispatchEvent(new Event('library:session-expired'))
        throw new Error('Phiên đăng nhập đã hết hạn')
      }
    })().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token && !config.skipAuth) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => {
    if (response.status === 204) {
      return null
    }
    return response.data
  },
  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      !originalRequest?.skipAuth &&
      localStorage.getItem('access_token') &&
      originalRequest &&
      !originalRequest.url.startsWith('/auth/refresh/') &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true 
      try {
        const newToken = await refreshAccessToken()
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        return Promise.reject(refreshError)
      }
    }

    const payload = error.response?.data
    const detail = payload?.detail
      || (payload && typeof payload === 'object' && Object.entries(payload)
        .map(([key, value]) => {
          const message = Array.isArray(value)
            ? value.join(', ')
            : String(value)
          return `${key}: ${message}`
        })
        .join('; '))
      || 'Không thể kết nối máy chủ'

    return Promise.reject(new Error(detail))
  }
)

const query = (search) => (
  search ? `?search=${encodeURIComponent(search)}` : ''
)

export const authApi = {
  login: (data) => apiClient.post('/auth/login/', data),
  register: (data) => apiClient.post('/auth/register/', data),
  me: () => apiClient.get('/auth/me/'),
  updateMe: (data) => apiClient.patch('/auth/me/', data),
  logout: (refresh) => apiClient.post('/auth/logout/', { refresh }),
  users: () => apiClient.get('/auth/admin/users/'),
  createUser: (data) => apiClient.post('/auth/admin/users/', data),
  updateUser: (id, data) => apiClient.patch(`/auth/admin/users/${id}/`, data),
  deleteUser: (id) => apiClient.delete(`/auth/admin/users/${id}/`),
  requestPasswordReset: (email) =>
    apiClient.post('/auth/password-reset/', { email }, { skipAuth: true }),
  confirmPasswordReset: (data) =>
    apiClient.post('/auth/password-reset/confirm/', data, { skipAuth: true }),
}

export const circulationApi = {
  loans: () => apiClient.get('/circulation/loans/'),
  borrow: (data) => apiClient.post('/circulation/loans/borrow/', data),
  renew: (id, due_back) => apiClient.patch(`/circulation/loans/${id}/renew/`, { due_back }),
  returnBook: (id) => apiClient.post(`/circulation/loans/${id}/return/`),
}

export const catalogApi = {
  books: (search = '') => apiClient.get(`/catalog/books/${query(search)}`),
  createBook: (data) => apiClient.post('/catalog/books/', data),
  updateBook: (id, data) => apiClient.patch(`/catalog/books/${id}/`, data),
  authors: (search = '') => apiClient.get(`/catalog/authors/${query(search)}`),
  createAuthor: (data) => apiClient.post('/catalog/authors/', data),
  languages: () => apiClient.get('/catalog/languages/'),
  createLanguage: (data) => apiClient.post('/catalog/languages/', data),
  genres: () => apiClient.get('/catalog/genres/'),
  createGenre: (data) => apiClient.post('/catalog/genres/', data),
  instances: () => apiClient.get('/catalog/book-instances/'),
  createInstance: (data) => apiClient.post('/catalog/book-instances/', data),
  list: (resource, search = '') =>
    apiClient.get(`/catalog/${resource}/${query(search)}`),
  detail: (resource, id) => apiClient.get(`/catalog/${resource}/${id}/`),
  create: (resource, data) => apiClient.post(`/catalog/${resource}/`, data),
  update: (resource, id, data) =>
    apiClient.patch(`/catalog/${resource}/${id}/`, data),
  remove: (resource, id) => apiClient.delete(`/catalog/${resource}/${id}/`),
}
