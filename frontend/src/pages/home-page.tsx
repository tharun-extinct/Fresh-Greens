import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { api } from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { LoadingState } from '../components/common/loading-state'
import { useLocation } from '../context/location-context'

export const HomePage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { location } = useLocation()
  const [page, setPage] = useState(0)
  const [categoryId, setCategoryId] = useState<number | null>(null)

  const keyword = (searchParams.get('q') || '').trim()
  const hasLocationFilter = location.city !== 'All Cities' || Boolean(location.pincode)

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: api.getCategories,
  })

  const productsQuery = useQuery({
    queryKey: ['products', page, categoryId, keyword, location.city, location.pincode],
    queryFn: () =>
      keyword
        ? api.searchProducts({
            q: keyword,
            city: location.city !== 'All Cities' ? location.city : undefined,
            pincode: location.pincode || undefined,
            page,
            size: 12,
          })
        : categoryId
          ? api.getProductsByCategory(categoryId, { page, size: 12 })
          : hasLocationFilter
            ? api.searchProducts({
                city: location.city !== 'All Cities' ? location.city : undefined,
                pincode: location.pincode || undefined,
                page,
                size: 12,
              })
            : api.getProducts({ page, size: 12 }),
  })

  const products = useMemo(() => {
    const list = productsQuery.data?.content ?? []
    if (!hasLocationFilter) {
      return list
    }

    return list.filter((item) => {
      const cityMatches = location.city === 'All Cities' || item.city?.toLowerCase() === location.city.toLowerCase()
      const pincodeMatches = !location.pincode || item.pincode === location.pincode
      return cityMatches && pincodeMatches
    })
  }, [productsQuery.data, hasLocationFilter, location.city, location.pincode])

  if (productsQuery.isLoading) {
    return <LoadingState label="Loading fresh products..." />
  }

  return (
    <section className="space-y-6">
      <div className="hero-section rounded-3xl p-7 md:p-9">
        <h1 className="hero-title">Farm fresh groceries for every home</h1>
        <p className="hero-subtitle mt-2">
          Fresh Greens brings city-wide farm produce to your doorstep with secure checkout and reliable delivery.
        </p>
        {hasLocationFilter && (
          <p className="mt-3 text-sm font-medium text-brand-700">
            Showing produce for {location.city}{location.pincode ? ` - ${location.pincode}` : ''}
          </p>
        )}
      </div>

      <div className="category-chips">
        <Button className="category-chip" variant={categoryId === null ? 'default' : 'outline'} size="sm" onClick={() => setCategoryId(null)}>
          All
        </Button>
        {categoriesQuery.data?.map((item) => (
          <Button
            key={item.id}
            className="category-chip"
            variant={categoryId === item.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setPage(0)
              setCategoryId(item.id)
            }}
          >
            {item.name}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <Card key={product.id} className="product-card overflow-hidden border-none">
            <img
              src={product.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=640'}
              alt={product.title}
              className="card-img-top h-44 w-full object-cover"
              loading="lazy"
            />
            <CardHeader className="pb-2">
              <CardTitle className="product-title line-clamp-1 text-base">{product.title}</CardTitle>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{product.categoryName || 'Produce'}</Badge>
                <span className="product-price text-sm">₹{product.price}</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="product-location text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {product.city}</span>
                <Button className="btn-fg" size="sm" onClick={() => navigate(`/products/${product.id}`)}>
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button variant="outline" disabled={page === 0} onClick={() => setPage((prev) => Math.max(0, prev - 1))}>
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">Page {page + 1}</span>
        <Button
          variant="outline"
          disabled={Boolean(productsQuery.data?.last)}
          onClick={() => setPage((prev) => prev + 1)}
        >
          Next
        </Button>
      </div>

      {products.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          {keyword ? `No products found for "${keyword}".` : 'No products found for this category.'}
        </div>
      )}
    </section>
  )
}
