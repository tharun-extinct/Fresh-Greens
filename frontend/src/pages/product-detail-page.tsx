import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { LoadingState } from '../components/common/loading-state'

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
    onSuccess: () => toast.success('Added to cart'),
    onError: () => toast.error('Could not add to cart'),
  })

  if (productQuery.isLoading) {
    return <LoadingState label="Loading product..." />
  }

  const product = productQuery.data
  if (!product) {
    return <div className="text-sm text-muted-foreground">Product not found.</div>
  }

  return (
    <Card className="overflow-hidden border-none shadow-[var(--fg-shadow-hover)]">
      <CardContent className="grid gap-6 p-0 md:grid-cols-2">
        <img
          src={product.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800'}
          alt={product.title}
          className="h-full min-h-[280px] w-full object-cover"
        />
        <div className="space-y-4 p-6">
          <h1 className="text-2xl font-bold text-brand-700">{product.title}</h1>
          <p className="text-sm text-muted-foreground">{product.description}</p>
          <p className="text-2xl font-bold text-brand-700">₹{product.price} <span className="text-sm font-medium text-muted-foreground">/ {product.unit}</span></p>
          <p className="text-sm">Available stock: <span className="font-semibold">{product.stockQuantity}</span></p>
          <p className="text-sm text-muted-foreground">Delivery area: {product.city} - {product.pincode}</p>
          <div className="flex gap-2">
            <Button className="btn-fg" onClick={() => addMutation.mutate(product.id)} disabled={addMutation.isPending}>
              Add to Cart
            </Button>
            <Button className="btn-fg-outline" variant="outline" onClick={() => navigate('/cart')}>
              Go to Cart
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
