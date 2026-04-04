import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { queryClient } from '../lib/query-client'
import type { AdminOrder, AdminUser, Product } from '../types/api'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { LoadingState } from '../components/common/loading-state'

const PAGE_SIZE = 12

type AdminTab = 'users' | 'products' | 'orders'

const toINR = (value: number) => `₹${Number(value || 0).toLocaleString('en-IN')}`

const formatDate = (value?: string) => {
  if (!value) return '—'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString()
}

const statusTone = (value?: string) => {
  const normalized = (value || '').toUpperCase()
  if (['ACTIVE', 'DELIVERED', 'PAID', 'CONFIRMED'].includes(normalized)) return 'success'
  if (['PENDING', 'PROCESSING', 'CREATED', 'SHIPPED', 'SOLD_OUT'].includes(normalized)) return 'pending'
  return 'danger'
}

const StatusBadge = ({ label }: { label?: string }) => {
  const tone = statusTone(label)
  if (tone === 'success') return <Badge className="bg-emerald-600 text-white">{label || '—'}</Badge>
  if (tone === 'pending') return <Badge className="bg-amber-500 text-white">{label || '—'}</Badge>
  return <Badge className="bg-rose-600 text-white">{label || '—'}</Badge>
}

export const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users')
  const [usersPage, setUsersPage] = useState(0)
  const [productsPage, setProductsPage] = useState(0)
  const [ordersPage, setOrdersPage] = useState(0)

  const statsQuery = useQuery({ queryKey: ['admin-stats'], queryFn: api.getAdminStats })
  const usersQuery = useQuery({
    queryKey: ['admin-users', usersPage],
    queryFn: () => api.getAdminUsers({ page: usersPage, size: PAGE_SIZE }),
    enabled: activeTab === 'users',
  })
  const productsQuery = useQuery({
    queryKey: ['admin-products', productsPage],
    queryFn: () => api.getAdminProducts({ page: productsPage, size: PAGE_SIZE }),
    enabled: activeTab === 'products',
  })
  const ordersQuery = useQuery({
    queryKey: ['admin-orders', ordersPage],
    queryFn: () => api.getAdminOrders({ page: ordersPage, size: PAGE_SIZE }),
    enabled: activeTab === 'orders',
  })

  const userRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: 'BUYER' | 'ADMIN' }) => api.updateAdminUserRole(id, role),
    onSuccess: () => {
      toast.success('User role updated')
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: () => toast.error('Unable to update user role'),
  })

  const userStatusMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => api.updateAdminUserStatus(id, active),
    onSuccess: () => {
      toast.success('User status updated')
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: () => toast.error('Unable to update user status'),
  })

  const productStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'ACTIVE' | 'SOLD_OUT' | 'EXPIRED' | 'REMOVED' }) =>
      api.updateAdminProductStatus(id, status),
    onSuccess: () => {
      toast.success('Product status updated')
      void queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: () => toast.error('Unable to update product status'),
  })

  const orderStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number
      status: 'CREATED' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
    }) => api.updateAdminOrderStatus(id, status),
    onSuccess: () => {
      toast.success('Order status updated')
      void queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: () => toast.error('Unable to update order status'),
  })

  if (statsQuery.isLoading) return <LoadingState label="Loading admin dashboard..." />

  const stats = statsQuery.data
  if (!stats) return null

  const renderUsersTable = (users: AdminUser[]) => {
    if (!users.length) {
      return <p className="py-8 text-center text-sm text-muted-foreground">No users found.</p>
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="bg-brand-100 text-brand-700">
            <tr>
              <th className="p-3">User</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Joined</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border">
                <td className="p-3">
                  <p className="font-semibold">{user.displayName || 'Unknown User'}</p>
                  <p className="text-xs text-muted-foreground">#{user.id}</p>
                </td>
                <td className="p-3">
                  <p>{user.email || '—'}</p>
                  <p className="text-xs text-muted-foreground">{user.phone || 'No phone'}</p>
                </td>
                <td className="p-3">
                  <Badge variant="secondary">{user.role}</Badge>
                </td>
                <td className="p-3">
                  <StatusBadge label={user.active ? 'ACTIVE' : 'INACTIVE'} />
                </td>
                <td className="p-3 text-xs text-muted-foreground">{formatDate(user.createdAt)}</td>
                <td className="p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                      title="Update user role"
                      aria-label={`Update role for user ${user.displayName || user.email || user.id}`}
                      value={user.role}
                      onChange={(event) =>
                        userRoleMutation.mutate({ id: user.id, role: event.target.value as 'BUYER' | 'ADMIN' })
                      }
                      disabled={userRoleMutation.isPending}
                    >
                      <option value="BUYER">BUYER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                    <Button
                      size="sm"
                      variant={user.active ? 'destructive' : 'default'}
                      onClick={() => userStatusMutation.mutate({ id: user.id, active: !user.active })}
                      disabled={userStatusMutation.isPending}
                    >
                      {user.active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderProductsTable = (products: Product[]) => {
    if (!products.length) {
      return <p className="py-8 text-center text-sm text-muted-foreground">No products found.</p>
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-brand-100 text-brand-700">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Status</th>
              <th className="p-3">Created</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-border">
                <td className="p-3">
                  <p className="font-semibold">{product.title}</p>
                  <p className="text-xs text-muted-foreground">#{product.id} • {product.city}</p>
                </td>
                <td className="p-3">{product.categoryName || '—'}</td>
                <td className="p-3 font-semibold">{toINR(Number(product.price))}</td>
                <td className="p-3">{product.stockQuantity}</td>
                <td className="p-3"><StatusBadge label={product.status} /></td>
                <td className="p-3 text-xs text-muted-foreground">{formatDate(product.createdAt)}</td>
                <td className="p-3">
                  <select
                    className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                    title="Update product status"
                    aria-label={`Update status for product ${product.title || product.id}`}
                    value={product.status || 'ACTIVE'}
                    onChange={(event) =>
                      productStatusMutation.mutate({
                        id: product.id,
                        status: event.target.value as 'ACTIVE' | 'SOLD_OUT' | 'EXPIRED' | 'REMOVED',
                      })
                    }
                    disabled={productStatusMutation.isPending}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SOLD_OUT">SOLD_OUT</option>
                    <option value="EXPIRED">EXPIRED</option>
                    <option value="REMOVED">REMOVED</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderOrdersTable = (orders: AdminOrder[]) => {
    if (!orders.length) {
      return <p className="py-8 text-center text-sm text-muted-foreground">No orders found.</p>
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-brand-100 text-brand-700">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Buyer</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Fulfilment</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Created</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.orderId} className="border-b border-border">
                <td className="p-3">
                  <p className="font-semibold">#{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{order.city || '—'}</p>
                </td>
                <td className="p-3">
                  <p>{order.buyerName || '—'}</p>
                  <p className="text-xs text-muted-foreground">{order.buyerEmail || '—'}</p>
                </td>
                <td className="p-3"><StatusBadge label={order.paymentStatus} /></td>
                <td className="p-3"><StatusBadge label={order.orderStatus} /></td>
                <td className="p-3 font-semibold">{toINR(order.grandTotal)}</td>
                <td className="p-3 text-xs text-muted-foreground">{formatDate(order.createdAt)}</td>
                <td className="p-3">
                  <select
                    className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                    title="Update order status"
                    aria-label={`Update status for order ${order.orderNumber}`}
                    value={order.orderStatus}
                    onChange={(event) =>
                      orderStatusMutation.mutate({
                        id: order.orderId,
                        status: event.target.value as
                          | 'CREATED'
                          | 'CONFIRMED'
                          | 'PROCESSING'
                          | 'SHIPPED'
                          | 'DELIVERED'
                          | 'CANCELLED',
                      })
                    }
                    disabled={orderStatusMutation.isPending}
                  >
                    <option value="CREATED">CREATED</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const currentPage = activeTab === 'users' ? usersPage : activeTab === 'products' ? productsPage : ordersPage
  const currentQuery = activeTab === 'users' ? usersQuery : activeTab === 'products' ? productsQuery : ordersQuery
  const canPrev = currentPage > 0
  const canNext = Boolean(currentQuery.data && !currentQuery.data.last)

  const onPrev = () => {
    if (activeTab === 'users') setUsersPage((prev) => Math.max(0, prev - 1))
    if (activeTab === 'products') setProductsPage((prev) => Math.max(0, prev - 1))
    if (activeTab === 'orders') setOrdersPage((prev) => Math.max(0, prev - 1))
  }

  const onNext = () => {
    if (activeTab === 'users') setUsersPage((prev) => prev + 1)
    if (activeTab === 'products') setProductsPage((prev) => prev + 1)
    if (activeTab === 'orders') setOrdersPage((prev) => prev + 1)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Users</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalUsers}</p>
            <p className="text-xs text-muted-foreground">Buyer and admin accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Products</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalProducts}</p>
            <p className="text-xs text-muted-foreground">{stats.activeProducts} active products</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Orders</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalOrders}</p>
            <p className="text-xs text-muted-foreground">{stats.pendingOrders} pending payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Revenue</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{toINR(Number(stats.totalRevenue || 0))}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle>Operations</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant={activeTab === 'users' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('users')}>
              Users
            </Button>
            <Button
              variant={activeTab === 'products' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('products')}
            >
              Products
            </Button>
            <Button variant={activeTab === 'orders' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('orders')}>
              Orders
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeTab === 'users' && (usersQuery.isLoading ? <LoadingState label="Loading users..." /> : renderUsersTable(usersQuery.data?.content || []))}
          {activeTab === 'products' &&
            (productsQuery.isLoading ? <LoadingState label="Loading products..." /> : renderProductsTable(productsQuery.data?.content || []))}
          {activeTab === 'orders' &&
            (ordersQuery.isLoading ? <LoadingState label="Loading orders..." /> : renderOrdersTable(ordersQuery.data?.content || []))}

          <div className="flex items-center justify-between border-t border-border pt-3">
            <Button variant="outline" size="sm" onClick={onPrev} disabled={!canPrev}>
              Previous
            </Button>
            <p className="text-xs text-muted-foreground">Page {currentPage + 1}</p>
            <Button variant="outline" size="sm" onClick={onNext} disabled={!canNext}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
