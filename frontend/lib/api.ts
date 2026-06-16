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
export const createTailor = (data: object) => api.post<Tailor>('/tailors/', data)
export const getInvoices = (params?: object) => api.get<Invoice[]>('/invoices/', { params })
export const createInvoice = (data: object) => api.post('/invoices/', data)
export const getSummary = (params?: object) => api.get<Summary>('/invoices/summary/', { params })
export const getInvoice = (id: number) => api.get<Invoice>(`/invoices/${id}/`)
export const updateInvoice = (id: number, data: object) => api.put(`/invoices/${id}/`, data)
export const deleteInvoice = (id: number) => api.delete(`/invoices/${id}/`)



export interface RateSheet {
  id: number
  md_no: string
  tailor: number
  tailor_code: string
  tailor_name: string
  rate: number
  work_type: string
  notes: string
  is_active: boolean
}

export const getRateSheets = () => api.get<RateSheet[]>('/ratesheets/')
export const createRateSheet = (data: object) => api.post('/ratesheets/', data)
export const updateRateSheet = (id: number, data: object) => api.put(`/ratesheets/${id}/`, data)
export const deleteRateSheet = (id: number) => api.delete(`/ratesheets/${id}/`)
export const lookupRateSheet = (md_no: string) => api.get<{
  md_no: string
  tailor_id: number
  tailor_code: string
  tailor_name: string
  rate: number
  work_type: string
  inv_no: string
  source: string
}>(`/ratesheets/lookup/?md_no=${md_no}`)



export interface ShopStitching {
  id: number
  tailor: number
  tailor_code: string
  tailor_name: string
  md_no: string
  date: string
  pc_count: number
  rate: number
  total: number
  cloth: string
  mtr: number | null
  inv_no: string
  remarks: string
}

export const getStitchings = (params?: object) => api.get<ShopStitching[]>('/stitching/', { params })
export const createStitching = (data: object) => api.post('/stitching/', data)
export const updateStitching = (id: number, data: object) => api.put(`/stitching/${id}/`, data)
export const deleteStitching = (id: number) => api.delete(`/stitching/${id}/`)
export const getStitchingSummary = (params?: object) => api.get<{
  total_pieces: number
  total_amount: number
  total_records: number
}>('/stitching/summary/', { params })


export interface OrderReadymade {
  id: number
  md_no: string
  date: string
  ord_date: string
  ord_no: string
  inv_no: string
  barcode: string
  size: string
  rate: number
  qty_sm: number
  qty_a1: number
  qty_f2: number
  total_qty: number
  total_amount: number
  status: string
  remarks: string
}

export const getOrders = (params?: object) => api.get<OrderReadymade[]>('/orders/', { params })
export const createOrder = (data: object) => api.post('/orders/', data)
export const updateOrder = (id: number, data: object) => api.put(`/orders/${id}/`, data)
export const deleteOrder = (id: number) => api.delete(`/orders/${id}/`)
export const getOrderSummary = (params?: object) => api.get<{
  total_orders: number
  total_qty: number
  total_amount: number
}>('/orders/summary/', { params })


export interface TailorOrder {
  id: number
  tailor: number
  tailor_code: string
  tailor_name: string
  date: string
  quantity: number
  amount: number
  remarks: string
}

export const getTailorOrders = (params?: object) => api.get<TailorOrder[]>('/tailor-orders/', { params })
export const createTailorOrder = (data: object) => api.post('/tailor-orders/', data)
export const updateTailorOrder = (id: number, data: object) => api.put(`/tailor-orders/${id}/`, data)
export const deleteTailorOrder = (id: number) => api.delete(`/tailor-orders/${id}/`)


export interface Payment {
  id: number
  tailor: number
  tailor_code: string
  tailor_name: string
  date: string
  amount: number
  remarks: string
}

export const getPayments = (params?: object) => api.get<Payment[]>('/payments/', { params })
export const createPayment = (data: object) => api.post('/payments/', data)
export const updatePayment = (id: number, data: object) => api.put(`/payments/${id}/`, data)
export const deletePayment = (id: number) => api.delete(`/payments/${id}/`)


export interface JobInvoice {
  id: number
  inv_no: string
  model_no: string
  date: string
  pc_count: number
  rate: number
  amount: number
  tailor: number
  tailor_code: string
  tailor_name: string
  created_at: string
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export const getJobInvoices = (params?: object) =>
  api.get<Paginated<JobInvoice>>('/job-invoices/', { params })
export const createJobInvoice = (data: object) => api.post<JobInvoice>('/job-invoices/', data)
export const updateJobInvoice = (id: number, data: object) => api.put(`/job-invoices/${id}/`, data)
export const deleteJobInvoice = (id: number) => api.delete(`/job-invoices/${id}/`)
export const getNextInvNo = () => api.get<{ next_inv_no: string }>('/job-invoices/next_inv_no/')

export interface TailorJobSummary {
  tailor_id: number
  tailor_code: string
  tailor_name: string
  shop_amount: number
  order_amount: number
  total_amount: number
}

export const getTailorJobSummary = (params?: object) =>
  api.get<TailorJobSummary[]>('/job-invoices/tailor_summary/', { params })