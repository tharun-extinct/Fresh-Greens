import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
      void queryClient.invalidateQueries({ queryKey: ['cart-count'] })
    },
    onError: () => toast.error('Unable to update cart item'),
  })

  const removeMutation = useMutation({
    mutationFn: (itemId: number) => api.removeCartItem(itemId),
    onSuccess: () => {
      toast.success('Item removed')
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
      void queryClient.invalidateQueries({ queryKey: ['cart-count'] })
    },
    onError: () => toast.error('Unable to remove item'),
  })

  if (cartQuery.isLoading) return <LoadingState label="Loading your cart…" />

  const cart = cartQuery.data

  if (!cart || cart.items.length === 0) {
    return (
      <div className="empty-state rounded-2xl border border-dashed border-border py-16">
        <div className="text-6xl">🛒</div>
        <h5 className="mt-4 text-lg font-semibold text-foreground">Your cart is empty</h5>
        <p className="mt-1 text-sm text-muted-foreground">Add some fresh produce to get started!</p>
        <Button className="btn-fg mt-5" onClick={() => navigate('/')}>
          Browse Products
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h1 className="section-title flex items-center gap-2">
        <ShoppingBag className="h-5 w-5" /> My Cart
      </h1>

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        {/* Cart items */}
        <div className="space-y-3">
          {cart.items.map((item) => (
            <Card key={item.id} className="overflow-hidden border-none shadow-[var(--fg-shadow)]">
              <CardContent className="flex items-center gap-4 p-4">
                <img
                  src={item.productImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=220'}
                  alt={item.productTitle}
                  className="h-20 w-20 shrink-0 rounded-xl object-cover"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-tight">{item.productTitle}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">₹{item.price} per unit</p>
                  <p className="text-sm font-semibold text-brand-700">Subtotal: ₹{item.subtotal}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <div className="quantity-controls flex items-center gap-1.5 rounded-full border border-border px-2 py-1">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition hover:bg-brand-100 hover:text-brand-700 disabled:opacity-40"
                      onClick={() => updateMutation.mutate({ itemId: item.productId, quantity: Math.max(1, item.quantity - 1) })}
                      disabled={updateMutation.isPending || item.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition hover:bg-brand-100 hover:text-brand-700 disabled:opacity-40"
                      onClick={() => updateMutation.mutate({ itemId: item.productId, quantity: item.quantity + 1 })}
                      disabled={updateMutation.isPending}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs text-rose-500 transition hover:text-rose-700"
                    onClick={() => removeMutation.mutate(item.productId)}
                    disabled={removeMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order summary */}
        <Card className="h-fit border-none shadow-[var(--fg-shadow)]">
          <CardHeader className="pb-3">
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="divide-y divide-border rounded-xl border border-border">
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-muted-foreground">{item.productTitle} × {item.quantity}</span>
                  <span className="font-semibold">₹{item.subtotal}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-xl bg-brand-100 px-4 py-2.5">
              <span className="font-semibold text-brand-700">Total ({cart.totalItems} items)</span>
              <span className="text-xl font-extrabold text-brand-700">₹{cart.totalAmount}</span>
            </div>
            <Button className="btn-accent w-full" size="lg" onClick={() => navigate('/checkout')}>
              Proceed to Checkout <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
            <button
              type="button"
              className="w-full text-center text-sm text-brand-700 underline hover:text-brand-600"
              onClick={() => navigate('/')}
            >
              Continue Shopping
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

