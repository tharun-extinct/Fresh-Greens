import { http } from './http'
import type {
  AdminOrder,
  AdminStats,
  AdminUser,
  ApiResponse,
  Cart,
  Category,
  Order,
  PageResponse,
  Product,
  User,
} from '../types/api'

export const api = {
  getCategories: async () => (await http.get<ApiResponse<Category[]>>('/api/categories')).data.data,
  getProducts: async (params?: Record<string, unknown>) =>
    (await http.get<ApiResponse<PageResponse<Product>>>('/api/products', { params })).data.data,
  getProductsByCategory: async (categoryId: number, params?: Record<string, unknown>) =>
    (await http.get<ApiResponse<PageResponse<Product>>>(`/api/products/category/${categoryId}`, { params })).data.data,
  searchProducts: async (params?: Record<string, unknown>) =>
    (await http.get<ApiResponse<PageResponse<Product>>>('/api/products/search', { params })).data.data,
  getProductById: async (id: string | number) =>
    (await http.get<ApiResponse<Product>>(`/api/products/${id}`)).data.data,
  getCart: async () => (await http.get<ApiResponse<Cart>>('/api/cart')).data.data,
  addToCart: async (productId: number, quantity = 1) =>
    (await http.post<ApiResponse<Cart>>('/api/cart/items', { productId, quantity })).data.data,
  updateCartItem: async (productId: number, quantity: number) =>
    (await http.put<ApiResponse<Cart>>(`/api/cart/items/${productId}`, null, { params: { quantity } })).data.data,
  removeCartItem: async (productId: number) =>
    (await http.delete<ApiResponse<Cart>>(`/api/cart/items/${productId}`)).data.data,
  createOrder: async (payload: { deliveryAddress: string; city: string; pincode: string }) =>
    (await http.post<ApiResponse<{ orderId: number; razorpayOrderId: string; amount: number; currency: string }>>('/api/orders', payload)).data.data,
  verifyOrderPayment: async (payload: {
    razorpayOrderId: string
    razorpayPaymentId: string
    razorpaySignature: string
  }) => (await http.post<ApiResponse<Order>>('/api/orders/verify-payment', payload)).data.data,
  getRazorpayKey: async () => (await http.get<ApiResponse<string>>('/api/orders/razorpay-key')).data.data,
  getOrders: async (params?: Record<string, unknown>) =>
    (await http.get<ApiResponse<PageResponse<Order>>>('/api/orders', { params })).data.data,
  getCurrentUser: async () => (await http.get<ApiResponse<User>>('/api/users/me')).data.data,
  updateCurrentUser: async (payload: Partial<User & { phone: string }>) =>
    (await http.put<ApiResponse<User>>('/api/users/me', payload)).data.data,
  sendPhoneOtp: async (phoneNumber: string) =>
    (await http.post<ApiResponse<unknown>>('/api/users/send-phone-otp', { phone: phoneNumber })).data,
  verifyPhoneOtp: async (phoneNumber: string, code: string) =>
    (await http.post<ApiResponse<unknown>>('/api/users/verify-phone', { phone: phoneNumber, otpCode: code })).data,

  getAdminStats: async () => (await http.get<ApiResponse<AdminStats>>('/api/admin/stats')).data.data,
  getAdminUsers: async (params?: Record<string, unknown>) =>
    (await http.get<ApiResponse<PageResponse<AdminUser>>>('/api/admin/users', { params })).data.data,
  updateAdminUserRole: async (id: number, role: 'BUYER' | 'ADMIN') =>
    (await http.put<ApiResponse<null>>(`/api/admin/users/${id}/role`, { role })).data,
  updateAdminUserStatus: async (id: number, active: boolean) =>
    (await http.put<ApiResponse<null>>(`/api/admin/users/${id}/status`, { active })).data,

  getAdminProducts: async (params?: Record<string, unknown>) =>
    (await http.get<ApiResponse<PageResponse<Product>>>('/api/admin/products', { params })).data.data,
  updateAdminProductStatus: async (id: number, status: 'ACTIVE' | 'SOLD_OUT' | 'EXPIRED' | 'REMOVED') =>
    (await http.put<ApiResponse<null>>(`/api/admin/products/${id}/status`, { status })).data,

  getAdminOrders: async (params?: Record<string, unknown>) =>
    (await http.get<ApiResponse<PageResponse<AdminOrder>>>('/api/admin/orders', { params })).data.data,
  updateAdminOrderStatus: async (
    id: number,
    status: 'CREATED' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED',
  ) => (await http.put<ApiResponse<null>>(`/api/admin/orders/${id}/status`, { status })).data,
}
