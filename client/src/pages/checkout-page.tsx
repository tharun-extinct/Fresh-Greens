import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
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
  const [form, setForm] = useState({ deliveryAddress: '', city: '', pincode: '' })

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
          toast.success('Payment verified. Order placed.')
          navigate('/orders')
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    },
    onError: () => toast.error('Checkout failed. Verify address and phone verification status.'),
  })

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <Card className="border-none shadow-[var(--fg-shadow)]">
        <CardHeader>
          <CardTitle>Delivery Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            className="min-h-28 w-full rounded-xl border border-border bg-white p-3 text-sm"
            placeholder="Address"
            value={form.deliveryAddress}
            onChange={(event) => setForm((prev) => ({ ...prev, deliveryAddress: event.target.value }))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="City"
              value={form.city}
              onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
            />
            <Input
              placeholder="Pincode"
              value={form.pincode}
              onChange={(event) => setForm((prev) => ({ ...prev, pincode: event.target.value }))}
            />
          </div>
          <Button
            className="btn-accent"
            onClick={() => checkoutMutation.mutate()}
            disabled={!form.deliveryAddress || !form.city || !form.pincode || checkoutMutation.isPending}
          >
            Pay with Razorpay
          </Button>
        </CardContent>
      </Card>

      <Card className="h-fit border-none shadow-[var(--fg-shadow)]">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Items: {cartQuery.data?.totalItems ?? 0}</p>
          <p className="text-lg font-semibold">Total: ₹{cartQuery.data?.totalAmount ?? 0}</p>
          <p className="text-xs text-muted-foreground">Phone verification is required before payment completion.</p>
        </CardContent>
      </Card>
    </div>
  )
}
