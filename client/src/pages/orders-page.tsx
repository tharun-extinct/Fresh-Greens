import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { LoadingState } from '../components/common/loading-state'

export const OrdersPage = () => {
  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.getOrders({ page: 0, size: 20, sort: 'createdAt,desc' }),
  })

  if (ordersQuery.isLoading) return <LoadingState label="Loading your orders..." />

  return (
    <div className="space-y-3">
      {ordersQuery.data?.content?.map((order) => (
        <Card key={order.id} className="border-none shadow-[var(--fg-shadow)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Order #{order.orderNumber}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{order.status}</Badge>
              <Badge variant="secondary">{order.paymentStatus}</Badge>
            </div>
            <p>Total: ₹{order.totalAmount}</p>
            <p className="text-muted-foreground">{order.city}, {order.pincode}</p>
            <p className="text-xs text-muted-foreground">Placed on {new Date(order.createdAt).toLocaleString()}</p>
          </CardContent>
        </Card>
      ))}
      {(ordersQuery.data?.content?.length ?? 0) === 0 && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          No orders found.
        </div>
      )}
    </div>
  )
}
