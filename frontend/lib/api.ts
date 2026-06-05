import axios from 'axios'
import Cookies from 'js-cookie'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach token to every request
api.interceptors.request.use(config => {
  const token = Cookies.get('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// If 401, redirect to login
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      Cookies.remove('access_token')
      Cookies.remove('refresh_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export interface Tailor {
  id: number
  name: string
  code: string
  phone: string
}

export interface Invoice {
  id: number
  tailor: number
  tailor_code: string
  tailor_name: string
  inv_no: number
  md_no: string
  rcv_date: string
  pc_count: number
  rate: number
  amount: number
  remarks: string
  is_return: boolean
}

export interface Summary {
  total_pieces: number
  total_amount: number
  total_invoices: number
}

export default api

export const getTailors = () => api.get<Tailor[]>('/tailors/')
export const getInvoices = (params?: object) => api.get<Invoice[]>('/invoices/', { params })
export const createInvoice = (data: object) => api.post('/invoices/', data)
export const getSummary = (params?: object) => api.get<Summary>('/invoices/summary/', { params })
export const getInvoice = (id: number) => api.get<Invoice>(`/invoices/${id}/`)
export const updateInvoice = (id: number, data: object) => api.put(`/invoices/${id}/`, data)
export const deleteInvoice = (id: number) => api.delete(`/invoices/${id}/`)