import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ShieldCheck, Users, Package, Boxes, IndianRupee, ArrowLeft, Phone, PhoneOff, Mail, MailCheck } from 'lucide-react'
import { QueryClientProvider } from '@tanstack/react-query'
import { toast, Toaster } from 'sonner'
import { api } from '@shared/lib/api'
import { http } from '@shared/lib/http'
import type { AdminOrder, AdminUser, Product, User } from '@shared/types/api'
import { queryClient } from './query-client'

type AdminTab = 'users' | 'products' | 'orders'

const PAGE_SIZE = 15
const customerPortalUrl = (import.meta.env.VITE_CUSTOMER_APP_URL || 'http://localhost:5173').trim()
const adminLoginUrl = (import.meta.env.VITE_ADMIN_LOGIN_URL || `${customerPortalUrl}/login`).trim()

const openExternal = (url: string) => {
	try {
		if (window.top !== window) {
			window.open(url, '_blank', 'noopener,noreferrer')
			return
		}

		window.location.href = url
	} catch {
		window.open(url, '_blank', 'noopener,noreferrer')
	}
}

const toINR = (value: number) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const formatDate = (value?: string) => {
	if (!value) return '—'
	const parsed = new Date(value)
	return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString()
}

const toneClass = (value?: string) => {
	const normalized = (value || '').toUpperCase()

	if (['ACTIVE', 'DELIVERED', 'PAID', 'CONFIRMED'].includes(normalized)) {
		return 'bg-emerald-100 text-emerald-700'
	}

	if (['PENDING', 'PROCESSING', 'CREATED', 'SHIPPED', 'SOLD_OUT'].includes(normalized)) {
		return 'bg-amber-100 text-amber-700'
	}

	if (['CANCELLED', 'REMOVED', 'FAILED', 'INACTIVE'].includes(normalized)) {
		return 'bg-rose-100 text-rose-700'
	}

	return 'bg-slate-100 text-slate-700'
}

const statusLabel = (value?: string) => (value || '—').replaceAll('_', ' ')

const StatusBadge = ({ label }: { label?: string }) => (
	<span className={`admin-badge ${toneClass(label)}`}>{statusLabel(label)}</span>
)

type SessionState = {
	status: 'loading' | 'authenticated' | 'anonymous' | 'error'
	user: User | null
	errorMessage: string | null
}

const useAdminSession = () => {
	const [session, setSession] = useState<SessionState>({
		status: 'loading',
		user: null,
		errorMessage: null,
	})

	const refresh = async () => {
		const controller = new AbortController()
		const timeout = window.setTimeout(() => controller.abort(), 5000)

		try {
			const response = await fetch('/api/users/me', {
				method: 'GET',
				credentials: 'include',
				headers: { Accept: 'application/json' },
				signal: controller.signal,
			})

			if (response.status === 401 || response.status === 403) {
				setSession({ status: 'anonymous', user: null, errorMessage: null })
				return
			}

			if (!response.ok) {
				setSession({
					status: 'error',
					user: null,
					errorMessage: `Server returned ${response.status}.`,
				})
				return
			}

			const payload = (await response.json()) as { success?: boolean; data?: User }

			if (!payload?.success || !payload.data) {
				setSession({ status: 'anonymous', user: null, errorMessage: null })
				return
			}

			setSession({ status: 'authenticated', user: payload.data, errorMessage: null })
		} catch (error) {
			const message = error instanceof DOMException && error.name === 'AbortError'
				? 'Request timed out while contacting the API server.'
				: 'Unable to reach API server. Ensure backend is running on localhost:8080.'

			setSession({ status: 'error', user: null, errorMessage: message })
		} finally {
			window.clearTimeout(timeout)
		}
	}

	useEffect(() => {
		void refresh()
	}, [])

	const signOut = async () => {
		try {
			await http.post('/api/auth/logout')
		} finally {
			setSession({ status: 'anonymous', user: null, errorMessage: null })
		}
	}

	return {
		session,
		refresh,
		signOut,
	}
}

const AdminDashboard = ({ user, onSignOut }: { user: User; onSignOut: () => Promise<void> }) => {
	const [activeTab, setActiveTab] = useState<AdminTab>('users')
	const [usersPage, setUsersPage] = useState(0)
	const [productsPage, setProductsPage] = useState(0)
	const [ordersPage, setOrdersPage] = useState(0)

	const statsQuery = useQuery({
		queryKey: ['admin-stats'],
		queryFn: api.getAdminStats,
	})

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
			toast.success('Role updated')
			void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
			void queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
		},
		onError: () => toast.error('Unable to update role'),
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

	const lastRefreshed = useMemo(() => {
		if (!statsQuery.dataUpdatedAt) return '—'
		return new Date(statsQuery.dataUpdatedAt).toLocaleTimeString()
	}, [statsQuery.dataUpdatedAt])

	const currentQuery =
		activeTab === 'users'
			? usersQuery
			: activeTab === 'products'
				? productsQuery
				: ordersQuery

	const currentPage = activeTab === 'users' ? usersPage : activeTab === 'products' ? productsPage : ordersPage
	const totalPages = currentQuery.data?.totalPages || 1
	const totalElements = currentQuery.data?.totalElements || 0
	const canPrev = currentPage > 0
	const canNext = currentPage + 1 < totalPages

	const onPrev = () => {
		if (!canPrev) return
		if (activeTab === 'users') setUsersPage((prev) => Math.max(0, prev - 1))
		if (activeTab === 'products') setProductsPage((prev) => Math.max(0, prev - 1))
		if (activeTab === 'orders') setOrdersPage((prev) => Math.max(0, prev - 1))
	}

	const onNext = () => {
		if (!canNext) return
		if (activeTab === 'users') setUsersPage((prev) => prev + 1)
		if (activeTab === 'products') setProductsPage((prev) => prev + 1)
		if (activeTab === 'orders') setOrdersPage((prev) => prev + 1)
	}

	const goToCustomerPortal = () => {
		openExternal(customerPortalUrl)
	}

	return (
		<div className="min-h-screen bg-background text-foreground">
			<nav className="navbar-fg sticky top-0 z-40 border-b border-white/10">
				<div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-3">
					<p className="text-lg font-bold text-white">🥬 Fresh Greens Admin</p>
					<div className="flex items-center gap-2">
						<button
							className="rounded-md border border-white/30 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
							onClick={goToCustomerPortal}
						>
							<ArrowLeft className="mr-1 inline h-3.5 w-3.5" />
							Back to Site
						</button>
						<button
							className="rounded-md border border-white/30 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
							onClick={() => void onSignOut()}
						>
							Sign Out
						</button>
					</div>
				</div>
			</nav>

			<header className="admin-header">
				<div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4">
					<div>
						<h1 className="text-2xl font-extrabold text-white">
							🛠️ Admin Dashboard <span className="admin-role-pill">ADMIN</span>
						</h1>
						<p className="mt-1 text-sm text-white/80">Welcome back, {user?.displayName || user?.email || 'Admin'}</p>
					</div>
					<p className="hidden text-xs text-white/70 md:block">Last refreshed: {lastRefreshed}</p>
				</div>
			</header>

			<main className="mx-auto w-full max-w-[1600px] space-y-4 px-4 pb-8">
				<section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<article className="admin-stat-card border-l-brand-600">
						<p className="admin-stat-label"><Users className="inline h-3.5 w-3.5" /> Total Users</p>
						<p className="admin-stat-value text-brand-700">{(statsQuery.data?.totalUsers || 0).toLocaleString('en-IN')}</p>
						<p className="admin-stat-sub">{(statsQuery.data?.totalSellers || 0).toLocaleString('en-IN')} sellers</p>
					</article>
					<article className="admin-stat-card border-l-orange-500">
						<p className="admin-stat-label"><Package className="inline h-3.5 w-3.5" /> Products</p>
						<p className="admin-stat-value text-orange-600">{(statsQuery.data?.totalProducts || 0).toLocaleString('en-IN')}</p>
						<p className="admin-stat-sub">{(statsQuery.data?.activeProducts || 0).toLocaleString('en-IN')} active</p>
					</article>
					<article className="admin-stat-card border-l-sky-600">
						<p className="admin-stat-label"><Boxes className="inline h-3.5 w-3.5" /> Orders</p>
						<p className="admin-stat-value text-sky-700">{(statsQuery.data?.totalOrders || 0).toLocaleString('en-IN')}</p>
						<p className="admin-stat-sub">{(statsQuery.data?.pendingOrders || 0).toLocaleString('en-IN')} pending payment</p>
					</article>
					<article className="admin-stat-card border-l-violet-700">
						<p className="admin-stat-label"><IndianRupee className="inline h-3.5 w-3.5" /> Revenue</p>
						<p className="admin-stat-value text-violet-700">{toINR(Number(statsQuery.data?.totalRevenue || 0))}</p>
						<p className="admin-stat-sub">Total paid orders</p>
					</article>
				</section>

				<section className="rounded-xl border border-border bg-white">
					<div className="flex flex-wrap gap-2 border-b border-border p-3">
						<button className={`admin-tab-btn ${activeTab === 'users' ? 'is-active' : ''}`} onClick={() => setActiveTab('users')}>
							Users
						</button>
						<button className={`admin-tab-btn ${activeTab === 'products' ? 'is-active' : ''}`} onClick={() => setActiveTab('products')}>
							Products
						</button>
						<button className={`admin-tab-btn ${activeTab === 'orders' ? 'is-active' : ''}`} onClick={() => setActiveTab('orders')}>
							Orders
						</button>
					</div>

					<div className="p-3">
						{activeTab === 'users' && (
							<AdminUsersTable
								isLoading={usersQuery.isLoading}
								rows={usersQuery.data?.content || []}
								onRoleChange={(id, role) => userRoleMutation.mutate({ id, role })}
								onToggleStatus={(id, active) => userStatusMutation.mutate({ id, active })}
								isMutating={userRoleMutation.isPending || userStatusMutation.isPending}
							/>
						)}
						{activeTab === 'products' && (
							<AdminProductsTable
								isLoading={productsQuery.isLoading}
								rows={productsQuery.data?.content || []}
								onStatusChange={(id, status) => productStatusMutation.mutate({ id, status })}
								isMutating={productStatusMutation.isPending}
							/>
						)}
						{activeTab === 'orders' && (
							<AdminOrdersTable
								isLoading={ordersQuery.isLoading}
								rows={ordersQuery.data?.content || []}
								onStatusChange={(id, status) => orderStatusMutation.mutate({ id, status })}
								isMutating={orderStatusMutation.isPending}
							/>
						)}
					</div>

					<div className="flex items-center justify-between border-t border-border px-3 py-2">
						<button className="admin-page-btn" disabled={!canPrev} onClick={onPrev}>Previous</button>
						<p className="text-xs text-muted-foreground">
							Page {currentPage + 1} of {totalPages} — {totalElements} total
						</p>
						<button className="admin-page-btn" disabled={!canNext} onClick={onNext}>Next</button>
					</div>
				</section>
			</main>
			<Toaster richColors position="top-right" />
		</div>
	)
}

const AdminUsersTable = ({
	isLoading,
	rows,
	onRoleChange,
	onToggleStatus,
	isMutating,
}: {
	isLoading: boolean
	rows: AdminUser[]
	onRoleChange: (id: number, role: 'BUYER' | 'ADMIN') => void
	onToggleStatus: (id: number, active: boolean) => void
	isMutating: boolean
}) => {
	if (isLoading) return <p className="py-12 text-center text-sm text-muted-foreground">Loading users...</p>
	if (!rows.length) return <p className="py-12 text-center text-sm text-muted-foreground">No users found.</p>

	return (
		<div className="overflow-x-auto">
			<table className="w-full min-w-[1080px] text-left text-sm">
				<thead className="bg-slate-900 text-xs uppercase tracking-wide text-white">
					<tr>
						<th className="p-3">ID</th>
						<th className="p-3">Name</th>
						<th className="p-3">Email</th>
						<th className="p-3">Phone</th>
						<th className="p-3">Role</th>
						<th className="p-3">Status</th>
						<th className="p-3">Verified</th>
						<th className="p-3">Joined</th>
						<th className="p-3">Actions</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((user) => (
						<tr key={user.id} className="border-b border-border last:border-b-0">
							<td className="p-3 text-xs text-muted-foreground">#{user.id}</td>
							<td className="p-3 font-semibold">{user.displayName || '—'}</td>
							<td className="p-3">{user.email || '—'}</td>
							<td className="p-3">{user.phone || '—'}</td>
							<td className="p-3">
								<select
									className="h-8 rounded-md border border-border bg-background px-2 text-xs"
									aria-label={`Update role for user ${user.displayName || user.email || user.id}`}
									title="Update user role"
									value={user.role === 'ADMIN' ? 'ADMIN' : 'BUYER'}
									onChange={(event) => onRoleChange(user.id, event.target.value as 'BUYER' | 'ADMIN')}
									disabled={isMutating}
								>
									<option value="BUYER">BUYER</option>
									<option value="ADMIN">ADMIN</option>
								</select>
							</td>
							<td className="p-3"><StatusBadge label={user.active ? 'ACTIVE' : 'INACTIVE'} /></td>
							<td className="p-3">
								<div className="flex items-center gap-2 text-xs">
									{user.phoneVerified ? <Phone className="h-3.5 w-3.5 text-emerald-600" /> : <PhoneOff className="h-3.5 w-3.5 text-slate-400" />}
									{user.emailVerified ? <MailCheck className="h-3.5 w-3.5 text-emerald-600" /> : <Mail className="h-3.5 w-3.5 text-slate-400" />}
								</div>
							</td>
							<td className="p-3 text-xs text-muted-foreground">{formatDate(user.createdAt)}</td>
							<td className="p-3">
								<button
									className={`rounded-md px-2.5 py-1 text-xs font-semibold ${user.active ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
									onClick={() => onToggleStatus(user.id, !user.active)}
									disabled={isMutating}
								>
									{user.active ? 'Deactivate' : 'Activate'}
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

const AdminProductsTable = ({
	isLoading,
	rows,
	onStatusChange,
	isMutating,
}: {
	isLoading: boolean
	rows: Product[]
	onStatusChange: (id: number, status: 'ACTIVE' | 'SOLD_OUT' | 'EXPIRED' | 'REMOVED') => void
	isMutating: boolean
}) => {
	if (isLoading) return <p className="py-12 text-center text-sm text-muted-foreground">Loading products...</p>
	if (!rows.length) return <p className="py-12 text-center text-sm text-muted-foreground">No products found.</p>

	return (
		<div className="overflow-x-auto">
			<table className="w-full min-w-[1080px] text-left text-sm">
				<thead className="bg-slate-900 text-xs uppercase tracking-wide text-white">
					<tr>
						<th className="p-3">ID</th>
						<th className="p-3">Title</th>
						<th className="p-3">Seller</th>
						<th className="p-3">Price</th>
						<th className="p-3">City</th>
						<th className="p-3">Category</th>
						<th className="p-3">Stock</th>
						<th className="p-3">Status</th>
						<th className="p-3">Created</th>
						<th className="p-3">Action</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((product) => (
						<tr key={product.id} className="border-b border-border last:border-b-0">
							<td className="p-3 text-xs text-muted-foreground">#{product.id}</td>
							<td className="p-3 font-semibold">{product.title}</td>
							<td className="p-3">{product.sellerName || '—'}</td>
							<td className="p-3 font-semibold text-emerald-700">{toINR(Number(product.price || 0))}</td>
							<td className="p-3">{product.city || '—'}</td>
							<td className="p-3">{product.categoryName || '—'}</td>
							<td className="p-3">{product.stockQuantity}</td>
							<td className="p-3"><StatusBadge label={product.status} /></td>
							<td className="p-3 text-xs text-muted-foreground">{formatDate(product.createdAt)}</td>
							<td className="p-3">
								<select
									className="h-8 rounded-md border border-border bg-background px-2 text-xs"
									aria-label={`Update status for product ${product.title || product.id}`}
									title="Update product status"
									value={product.status || 'ACTIVE'}
									onChange={(event) => onStatusChange(product.id, event.target.value as 'ACTIVE' | 'SOLD_OUT' | 'EXPIRED' | 'REMOVED')}
									disabled={isMutating}
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

const AdminOrdersTable = ({
	isLoading,
	rows,
	onStatusChange,
	isMutating,
}: {
	isLoading: boolean
	rows: AdminOrder[]
	onStatusChange: (id: number, status: 'CREATED' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED') => void
	isMutating: boolean
}) => {
	if (isLoading) return <p className="py-12 text-center text-sm text-muted-foreground">Loading orders...</p>
	if (!rows.length) return <p className="py-12 text-center text-sm text-muted-foreground">No orders yet.</p>

	return (
		<div className="overflow-x-auto">
			<table className="w-full min-w-[1080px] text-left text-sm">
				<thead className="bg-slate-900 text-xs uppercase tracking-wide text-white">
					<tr>
						<th className="p-3">Order #</th>
						<th className="p-3">Buyer</th>
						<th className="p-3">Total</th>
						<th className="p-3">Payment</th>
						<th className="p-3">Status</th>
						<th className="p-3">City</th>
						<th className="p-3">Date</th>
						<th className="p-3">Update Status</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((order) => (
						<tr key={order.orderId} className="border-b border-border last:border-b-0">
							<td className="p-3 font-semibold">{order.orderNumber}</td>
							<td className="p-3">
								<p className="font-medium">{order.buyerName || '—'}</p>
								<p className="text-xs text-muted-foreground">{order.buyerEmail || ''}</p>
							</td>
							<td className="p-3 font-semibold text-emerald-700">{toINR(Number(order.grandTotal || 0))}</td>
							<td className="p-3"><StatusBadge label={order.paymentStatus} /></td>
							<td className="p-3"><StatusBadge label={order.orderStatus} /></td>
							<td className="p-3">{order.city || '—'}</td>
							<td className="p-3 text-xs text-muted-foreground">{formatDate(order.createdAt)}</td>
							<td className="p-3">
								<select
									className="h-8 rounded-md border border-border bg-background px-2 text-xs"
									aria-label={`Update status for order ${order.orderNumber}`}
									title="Update order status"
									value={order.orderStatus}
									onChange={(event) =>
										onStatusChange(
											order.orderId,
											event.target.value as 'CREATED' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED',
										)
									}
									disabled={isMutating}
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

const AdminConsoleGate = () => {
	const { session, refresh, signOut } = useAdminSession()

	if (session.status === 'loading') {
		return (
			<main className="flex min-h-screen items-center justify-center bg-background p-4">
				<div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm text-center">
					<p className="text-sm text-muted-foreground">Checking admin session...</p>
				</div>
			</main>
		)
	}

	if (session.status === 'error') {
		return (
			<main className="flex min-h-screen items-center justify-center bg-background p-4">
				<div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6">
					<h1 className="text-lg font-bold text-amber-900">Admin console unavailable</h1>
					<p className="mt-2 text-sm text-amber-900/80">{session.errorMessage}</p>
					<div className="mt-4 flex gap-2">
						<button className="admin-page-btn" onClick={() => void refresh()}>Retry</button>
						<button className="admin-page-btn" onClick={() => openExternal(customerPortalUrl)}>
							Back to Site
						</button>
					</div>
				</div>
			</main>
		)
	}

	if (session.status !== 'authenticated' || !session.user) {
		return (
			<main className="flex min-h-screen items-center justify-center bg-background p-4">
				<div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
					<div className="mb-4 text-center">
						<ShieldCheck className="mx-auto mb-2 h-8 w-8 text-brand-600" />
						<h1 className="text-xl font-bold">Admin Console Login</h1>
						<p className="text-sm text-muted-foreground">Sign in through customer portal, then return to admin console.</p>
					</div>
					<div className="space-y-2">
						<button className="admin-login-btn" onClick={() => openExternal(adminLoginUrl)}>
							Open Login Page
						</button>
						<button className="admin-login-btn admin-login-btn-dark" onClick={() => void refresh()}>I already signed in</button>
					</div>
				</div>
			</main>
		)
	}

	if (session.user.role !== 'ADMIN') {
		return (
			<main className="flex min-h-screen items-center justify-center bg-background p-4">
				<div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6">
					<h1 className="text-lg font-bold text-amber-900">Access denied</h1>
					<p className="mt-2 text-sm text-amber-900/80">Your account is authenticated but does not have admin privileges.</p>
					<div className="mt-4 flex gap-2">
						<button className="admin-page-btn" onClick={() => openExternal(customerPortalUrl)}>
							Back to Site
						</button>
						<button className="admin-page-btn" onClick={() => void signOut()}>
							Sign Out
						</button>
					</div>
				</div>
			</main>
		)
	}

	return <AdminDashboard user={session.user} onSignOut={signOut} />
}

export const AdminConsoleApp = () => {
	return (
		<QueryClientProvider client={queryClient}>
			<AdminConsoleGate />
		</QueryClientProvider>
	)
}
