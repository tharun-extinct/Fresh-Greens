import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { queryClient } from '../lib/query-client'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { LoadingState } from '../components/common/loading-state'

export const CartPage = () => {
  const navigate = useNavigate()
  const cartQuery = useQuery({ queryKey: ['cart'], queryFn: api.getCart })

  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) => api.updateCartItem(itemId, quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
    onError: () => toast.error('Unable to update cart item'),
  })

  const removeMutation = useMutation({
    mutationFn: (itemId: number) => api.removeCartItem(itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
    onError: () => toast.error('Unable to remove item'),
  })

  if (cartQuery.isLoading) return <LoadingState label="Loading your cart..." />

  const cart = cartQuery.data
  if (!cart || cart.items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Button className="mt-3" onClick={() => navigate('/')}>
          Continue Shopping
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-3">
        {cart.items.map((item) => (
          <Card key={item.id} className="overflow-hidden border-none shadow-[var(--fg-shadow)]">
            <CardContent className="cart-item flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <img
                  src={item.productImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=220'}
                  alt={item.productTitle}
                  className="h-20 w-20 rounded-xl object-cover"
                  loading="lazy"
                />
                <div>
                  <p className="font-semibold">{item.productTitle}</p>
                  <p className="text-sm text-muted-foreground">₹{item.price} x {item.quantity}</p>
                  <p className="text-xs text-muted-foreground">Subtotal: ₹{item.subtotal}</p>
                </div>
              </div>
              <div className="quantity-controls flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 rounded-full p-0"
                  onClick={() => updateMutation.mutate({ itemId: item.id, quantity: Math.max(1, item.quantity - 1) })}
                >
                  -
                </Button>
                <span className="w-6 text-center text-sm">{item.quantity}</span>
                <Button className="h-8 w-8 rounded-full p-0" variant="outline" size="sm" onClick={() => updateMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}>
                  +
                </Button>
                <Button variant="ghost" size="sm" onClick={() => removeMutation.mutate(item.id)}>
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Items</span>
            <span>{cart.totalItems}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>₹{cart.totalAmount}</span>
          </div>
          <Button className="btn-accent w-full" onClick={() => navigate('/checkout')}>
            Proceed to Checkout
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
