export type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

export type PageResponse<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export type User = {
  id?: number
  userId?: number
  displayName: string
  email: string
  photoUrl?: string
  role: 'BUYER' | 'ADMIN' | 'SELLER' | string
  active?: boolean
  city?: string
  pincode?: string
  phoneNumber?: string
  phone?: string
  emailVerified?: boolean
  phoneVerified?: boolean
}

export type Category = {
  id: number
  name: string
  description?: string
  imageUrl?: string
}

export type Product = {
  id: number
  title: string
  description: string
  price: number
  unit: string
  stockQuantity: number
  city: string
  pincode: string
  imageUrl?: string
  categoryName?: string
  sellerName?: string
  active?: boolean
  status?: 'ACTIVE' | 'SOLD_OUT' | 'EXPIRED' | 'REMOVED' | string
  createdAt?: string
}

export type CartItem = {
  id: number
  productId: number
  productTitle: string
  productImage?: string
  sellerName?: string
  quantity: number
  price: number
  subtotal: number
  stockAvailable: number
}

export type Cart = {
  id: number
  items: CartItem[]
  totalItems: number
  totalAmount: number
}

export type OrderItem = {
  productId: number
  productTitle: string
  quantity: number
  price: number
  subtotal: number
  productImage?: string
}

export type Order = {
  id: number
  orderNumber: string
  status: string
  paymentStatus: string
  totalAmount: number
  deliveryAddress: string
  city: string
  pincode: string
  createdAt: string
  items: OrderItem[]
}

export type AdminStats = {
  totalUsers: number
  totalSellers: number
  totalProducts: number
  activeProducts: number
  totalOrders: number
  pendingOrders: number
  totalRevenue: number
}

export type AdminUser = {
  id: number
  displayName?: string
  email?: string
  phone?: string
  role: 'BUYER' | 'ADMIN' | 'SELLER' | string
  active: boolean
  phoneVerified: boolean
  emailVerified: boolean
  createdAt?: string
}

export type AdminOrder = {
  orderId: number
  orderNumber: string
  buyerName?: string
  buyerEmail?: string
  grandTotal: number
  paymentStatus: string
  orderStatus: string
  deliveryAddress?: string
  city?: string
  createdAt?: string
}
