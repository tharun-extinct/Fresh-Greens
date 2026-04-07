import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { MapPin, Phone, Lock } from 'lucide-react'
import type { AxiosError } from 'axios'
import { api } from '../lib/api'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'

type RazorpaySuccessResponse = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

type RazorpayInstance = {
  open: () => void
}

type RazorpayOptions = {
  key: string
  order_id: string
  amount: number
  currency: string
  name: string
  description: string
  handler: (response: RazorpaySuccessResponse) => Promise<void>
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

const loadRazorpayScript = async () => {
  if (window.Razorpay) return
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Razorpay script failed'))
    document.body.appendChild(script)
  })
}

export const CheckoutPage = () => {
  const navigate = useNavigate()
  const cartQuery = useQuery({ queryKey: ['cart'], queryFn: api.getCart })
  const userQuery = useQuery({ queryKey: ['me'], queryFn: api.getCurrentUser })
  const [form, setForm] = useState({ deliveryAddress: '', city: '', pincode: '' })

  const cart = cartQuery.data
  const user = userQuery.data

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      await loadRazorpayScript()
      const order = await api.createOrder(form)
      const key = await api.getRazorpayKey()

      const options = {
        key,
        order_id: order.razorpayOrderId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Fresh Greens',
        description: 'Fresh produce order',
        handler: async (response: RazorpaySuccessResponse) => {
          await api.verifyOrderPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          })
          toast.success('🎉 Payment successful! Order placed.')
          navigate('/orders')
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{ message?: string }>
      const serverMsg = axiosErr?.response?.data?.message
      toast.error(serverMsg || 'Checkout failed. Please try again.')
    },
  })

  const isPhoneVerified = !user || user.phoneVerified
  const isFormValid = form.deliveryAddress.trim() && form.city.trim() && form.pincode.trim().length === 6

  return (
    <div className="space-y-2">
      <h1 className="section-title">Checkout</h1>

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        {/* Delivery Address form */}
        <Card className="border-none shadow-[var(--fg-shadow)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[var(--fg-accent)]" />
              Delivery Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Full Address *</label>
              <textarea
                className="min-h-28 w-full rounded-xl border border-border bg-white p-3 text-sm transition focus:border-brand-700 focus:outline-none focus:ring-1 focus:ring-brand-700"
                placeholder="House / Flat no., Street, Landmark…"
                value={form.deliveryAddress}
                onChange={(e) => setForm((prev) => ({ ...prev, deliveryAddress: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">City *</label>
                <Input
                  placeholder="e.g., Chennai"
                  value={form.city}
                  onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pincode *</label>
                <Input
                  placeholder="6-digit pincode"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(e) => setForm((prev) => ({ ...prev, pincode: e.target.value.replace(/[^\d]/g, '').slice(0, 6) }))}
                />
              </div>
            </div>

            {/* Phone verification notice */}
            {user && !user.phoneVerified && (
              <div className="flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
                <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Phone number not verified. Please{' '}
                  <button type="button" className="font-semibold underline" onClick={() => navigate('/settings')}>
                    verify your phone
                  </button>{' '}
                  before placing an order.
                </span>
              </div>
            )}

            <Button
              className="btn-accent w-full"
              size="lg"
              onClick={() => checkoutMutation.mutate()}
              disabled={!isFormValid || !isPhoneVerified || checkoutMutation.isPending}
            >
              <Lock className="mr-1.5 h-4 w-4" />
              {checkoutMutation.isPending ? 'Processing…' : !isPhoneVerified ? 'Verify Phone to Pay' : 'Pay with Razorpay'}
            </Button>
          </CardContent>
        </Card>

        {/* Order summary */}
        <div className="space-y-4">
          <Card className="border-none shadow-[var(--fg-shadow)]">
            <CardHeader className="pb-3">
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cart?.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.productTitle} × {item.quantity}</span>
                  <span className="font-semibold">₹{item.subtotal}</span>
                </div>
              ))}
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Items ({cart?.totalItems ?? 0})</span>
                  <span className="font-semibold">₹{cart?.totalAmount ?? 0}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Delivery</span>
                  <span className="text-sm font-semibold text-emerald-600">FREE</span>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-brand-100 px-4 py-2.5">
                <span className="font-bold text-brand-700">Total</span>
                <span className="text-xl font-extrabold text-brand-700">₹{cart?.totalAmount ?? 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-emerald-200 bg-emerald-50">
            <CardContent className="flex items-start gap-2 p-3 text-xs text-emerald-700">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Secure payment powered by Razorpay. Your payment details are never stored.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

