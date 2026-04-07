import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import type { AxiosError } from 'axios'
import { MapPin, ShoppingCart, ChevronLeft, Package, Tag } from 'lucide-react'
import { api } from '../lib/api'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { LoadingState } from '../components/common/loading-state'
import { queryClient } from '../lib/query-client'

export const ProductDetailPage = () => {
  const { id = '' } = useParams()
  const navigate = useNavigate()

  const productQuery = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.getProductById(id),
    enabled: Boolean(id),
  })

  const addMutation = useMutation({
    mutationFn: (productId: number) => api.addToCart(productId, 1),
    onSuccess: () => {
      toast.success('Added to cart 🛒')
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
      void queryClient.invalidateQueries({ queryKey: ['cart-count'] })
    },
    onError: (err) => {
      const axiosErr = err as AxiosError<{ message?: string }>
      const msg = axiosErr?.response?.data?.message ?? 'Could not add to cart. Please try again.'
      toast.error(msg)
    },
  })

  if (productQuery.isLoading) return <LoadingState label="Loading product…" />

  const product = productQuery.data
  if (!product) {
    return (
      <div className="empty-state py-16">
        <div className="text-5xl">🔍</div>
        <h5 className="mt-3 text-base font-semibold">Product not found</h5>
        <p className="text-sm text-muted-foreground">This product may have been removed or expired.</p>
        <Button className="btn-fg mt-4" onClick={() => navigate('/')}>Back to Home</Button>
      </div>
    )
  }

  const isOutOfStock = product.status === 'SOLD_OUT' || product.status === 'EXPIRED' || product.stockQuantity === 0

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/" className="flex items-center gap-1 hover:text-brand-700">
          <ChevronLeft className="h-3.5 w-3.5" />Home
        </Link>
        {product.categoryName && (
          <>
            <span>/</span>
            <span>{product.categoryName}</span>
          </>
        )}
        <span>/</span>
        <span className="font-medium text-foreground line-clamp-1">{product.title}</span>
      </nav>

      <Card className="overflow-hidden border-none shadow-[var(--fg-shadow-hover)]">
        <CardContent className="grid gap-0 p-0 md:grid-cols-2">
          {/* Image */}
          <div className="relative">
            <img
              src={product.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800'}
              alt={product.title}
              className="h-full min-h-[300px] w-full object-cover md:max-h-[480px]"
            />
            {product.categoryName && (
              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm">
                {product.categoryName}
              </span>
            )}
            {isOutOfStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-rose-600">Out of Stock</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4 p-6 md:p-8">
            <h1 className="text-2xl font-extrabold leading-tight text-brand-700">{product.title}</h1>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-brand-700">₹{product.price}</span>
              <span className="text-base font-medium text-muted-foreground">/ {product.unit}</span>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
            )}

            {/* Meta info */}
            <div className="space-y-2 rounded-xl border border-border p-3 text-sm">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-brand-700" />
                <span className="text-muted-foreground">Stock:</span>
                <span className={`font-semibold ${isOutOfStock ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {isOutOfStock ? 'Out of stock' : `${product.stockQuantity} ${product.unit} available`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[var(--fg-accent)]" />
                <span className="text-muted-foreground">Delivery area:</span>
                <span className="font-semibold">{product.city}{product.pincode ? ` – ${product.pincode}` : ''}</span>
              </div>
              {product.categoryName && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-purple-500" />
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-semibold">{product.categoryName}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button
                className="btn-fg flex-1"
                size="lg"
                onClick={() => addMutation.mutate(product.id)}
                disabled={addMutation.isPending || isOutOfStock}
              >
                <ShoppingCart className="mr-1.5 h-4 w-4" />
                {addMutation.isPending ? 'Adding…' : 'Add to Cart'}
              </Button>
              <Button className="btn-fg-outline" variant="outline" size="lg" onClick={() => navigate('/cart')}>
                Go to Cart
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
