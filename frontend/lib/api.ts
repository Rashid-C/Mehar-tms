import axios from 'axios'
import Cookies from 'js-cookie'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  const token = Cookies.get('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let _refreshing: Promise<string> | null = null

api.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = Cookies.get('refresh_token')
      if (!refresh) {
        Cookies.remove('access_token')
        window.location.href = '/login'
        return Promise.reject(error)
      }
      try {
        if (!_refreshing) {
          _refreshing = axios
            .post(`${process.env.NEXT_PUBLIC_API_URL}/token/refresh/`, { refresh })
            .then(r => {
              Cookies.set('access_token', r.data.access, { expires: 1 })
              _refreshing = null
              return r.data.access
            })
        }
        const newToken = await _refreshing
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        Cookies.remove('access_token')
        Cookies.remove('refresh_token')
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

export interface Tailor {
  id: number
  name: string
  code: string
  phone: string
  opening_balance: number
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

export const getTailors = (params?: object) => api.get<Paginated<Tailor>>('/tailors/', { params })
export const createTailor = (data: object) => api.post<Tailor>('/tailors/', data)
export const updateTailor = (id: number, data: object) => api.put<Tailor>(`/tailors/${id}/`, data)
export const patchTailor = (id: number, data: object) => api.patch<Tailor>(`/tailors/${id}/`, data)
export const deleteTailor = (id: number) => api.delete(`/tailors/${id}/`)
export const getInvoices = (params?: object) => api.get<Invoice[]>('/invoices/', { params })
export const getSummary = (params?: object) => api.get<Summary>('/invoices/summary/', { params })



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



export interface AllocationMaterial {
  id: number
  reference: number
  name: string
  qty: number
  price: number
}

export interface StitchingWorkLine {
  id: number
  reference: number
  tailor: number
  tailor_code: string
  tailor_name: string
  rate: number
  date: string
}

export interface StitchingReference {
  id: number
  ref_no: string
  md_no: string
  tailor: number
  tailor_code: string
  tailor_name: string
  inv_no: string
  remarks: string
  created_at: string
  materials: AllocationMaterial[]
  work_lines: StitchingWorkLine[]
  materials_total: number
  work_total: number
}

export const getStitchingReferences = (params?: object) => api.get<StitchingReference[]>('/stitching-references/', { params })
export const getStitchingReference = (id: number) => api.get<StitchingReference>(`/stitching-references/${id}/`)
export const createStitchingReference = (data: object) => api.post<StitchingReference>('/stitching-references/', data)
export const updateStitchingReference = (id: number, data: object) => api.put<StitchingReference>(`/stitching-references/${id}/`, data)
export const deleteStitchingReference = (id: number) => api.delete(`/stitching-references/${id}/`)
export const getNextStitchingRefNo = () => api.get<{ next_ref_no: string }>('/stitching-references/next_ref_no/')
export const getStitchingSummary = (params?: object) => api.get<{
  total_amount: number
  total_records: number
}>('/stitching-references/summary/', { params })

export const createStitchingMaterial = (data: object) => api.post<AllocationMaterial>('/stitching-materials/', data)
export const updateStitchingMaterial = (id: number, data: object) => api.put<AllocationMaterial>(`/stitching-materials/${id}/`, data)
export const deleteStitchingMaterial = (id: number) => api.delete(`/stitching-materials/${id}/`)

export const createStitchingWorkLine = (data: object) => api.post<StitchingWorkLine>('/stitching-work-lines/', data)
export const updateStitchingWorkLine = (id: number, data: object) => api.put<StitchingWorkLine>(`/stitching-work-lines/${id}/`, data)
export const deleteStitchingWorkLine = (id: number) => api.delete(`/stitching-work-lines/${id}/`)



export interface TailorOrder {
  id: number
  inv_no: string
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
export const getNextOrderInvNo = () => api.get<{ next_inv_no: string }>('/tailor-orders/next_inv_no/')


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
  remarks: string
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
  opening_balance: number
  shop_amount: number
  shop_qty: number
  order_amount: number
  order_qty: number
  production_amount: number
  production_qty: number
  mat_issue_amount: number
  total_amount: number
  paid_amount: number
  balance: number
}

export interface MaterialIssue {
  id: number
  tailor: number
  tailor_code: string
  tailor_name: string
  date: string
  description: string
  amount: number
  remarks: string
}

export const getMaterialIssues = (params?: object) => api.get<MaterialIssue[]>('/material-issues/', { params })
export const createMaterialIssue = (data: object) => api.post<MaterialIssue>('/material-issues/', data)
export const updateMaterialIssue = (id: number, data: object) => api.put<MaterialIssue>(`/material-issues/${id}/`, data)
export const deleteMaterialIssue = (id: number) => api.delete(`/material-issues/${id}/`)

export const getTailorJobSummary = (params?: object) =>
  api.get<TailorJobSummary[]>('/job-invoices/tailor_summary/', { params })

export type ItemType = 'selling' | 'production'

export interface Item {
  id: number
  item_type: ItemType
  name: string
  code: string
  category: string
  roll_no: string
  model_no: string
  size: string
  color: string
  base_unit: string
  purchase_price: number
  selling_price: number
  price_includes_tax: boolean
  tax_percent: number
  discount_percent: number
  store: string
  track_inventory: boolean
  opening_stock: number | null
  warehouse: string
  description: string
}

export const getItems = (params?: object) => api.get<Item[]>('/items/', { params })
export const createItem = (data: object) => api.post<Item>('/items/', data)
export const updateItem = (id: number, data: object) => api.put<Item>(`/items/${id}/`, data)
export const deleteItem = (id: number) => api.delete(`/items/${id}/`)

