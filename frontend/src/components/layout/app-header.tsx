import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Search, ShoppingCart, MapPin, LogOut, User, Settings, ShoppingBag, ChevronDown, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/auth-context'
import { useLocation } from '../../context/location-context'
import { api } from '../../lib/api'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

export const AppHeader = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, isAuthenticated, logout } = useAuth()
  const { location, setLocation, autoDetectLocation } = useLocation()
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '')
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [draftCity, setDraftCity] = useState(location.city === 'All Cities' ? '' : location.city)
  const [draftPincode, setDraftPincode] = useState(location.pincode)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cart item count badge
  const cartQuery = useQuery({
    queryKey: ['cart-count'],
    queryFn: api.getCart,
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
  const cartCount = cartQuery.data?.totalItems ?? 0

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '')
  }, [searchParams])

  useEffect(() => {
    if (!isLocationModalOpen) return
    setDraftCity(location.city === 'All Cities' ? '' : location.city)
    setDraftPincode(location.pincode)
  }, [isLocationModalOpen, location.city, location.pincode])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const onSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedQuery = query.trim()
    if (!trimmedQuery) { navigate('/'); return }
    navigate(`/?q=${encodeURIComponent(trimmedQuery)}`)
  }

  const onSaveLocation = () => {
    const city = draftCity.trim()
    const pincode = draftPincode.trim()
    setLocation({ city: city || 'All Cities', pincode })
    setIsLocationModalOpen(false)
  }

  const onAutoDetect = async () => {
    await autoDetectLocation()
    setIsLocationModalOpen(false)
  }

  return (
    <>
      <header className="navbar-fg sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center">
          {/* Brand */}
          <Link to="/" className="flex shrink-0 items-center gap-2 text-xl font-bold text-white">
            <span className="text-2xl">🥬</span>
            <span>Fresh Greens</span>
          </Link>

          {/* Search */}
          <form className="search-bar relative flex flex-1 items-center gap-2" onSubmit={onSearchSubmit}>
            <button
              type="button"
              className="location-bar hidden md:flex"
              onClick={() => setIsLocationModalOpen(true)}
              title="Choose delivery location"
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>{location.city}</span>
            </button>
            <div className="relative w-full">
              <Search className="search-icon h-4 w-4" />
              <Input
                className="h-10 rounded-full border-none bg-white/95 pl-9 pr-20"
                placeholder="Search fresh vegetables, fruits, groceries…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  type="button"
                  className="absolute right-16 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => { setQuery(''); navigate('/') }}
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <button type="submit" className="btn-fg absolute right-1 top-1/2 -translate-y-1/2 px-4 py-1.5 text-xs">
                Search
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Mobile location pill */}
            <Button
              variant="outline"
              size="sm"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 md:hidden"
              onClick={() => setIsLocationModalOpen(true)}
            >
              <MapPin className="mr-1 h-4 w-4" />
              {location.city}
            </Button>

            {/* Cart button with badge */}
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition hover:bg-white/20"
              onClick={() => navigate('/cart')}
              aria-label="Cart"
            >
              <ShoppingCart className="h-4 w-4" />
              {isAuthenticated && cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--fg-accent)] px-1 text-[10px] font-bold leading-none text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            {/* Auth section */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                {/* Avatar + name button */}
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 py-1 pl-1.5 pr-3 text-white transition hover:bg-white/20"
                  onClick={() => setDropdownOpen((v) => !v)}
                  aria-label="User menu"
                >
                  {user?.photoUrl ? (
                    <img
                      src={user.photoUrl}
                      alt={user.displayName || 'User'}
                      className="h-7 w-7 rounded-full border border-white/40 object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                      {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
                    </span>
                  )}
                  <span className="hidden max-w-[90px] overflow-hidden text-ellipsis whitespace-nowrap text-sm md:inline">
                    {user?.displayName?.split(' ')[0] || 'Account'}
                  </span>
                  <ChevronDown className="h-3 w-3 opacity-70" />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border bg-white py-1 shadow-[var(--fg-shadow-hover)]">
                    <div className="border-b border-border px-4 py-2.5">
                      <p className="truncate text-sm font-semibold text-foreground">{user?.displayName || 'User'}</p>
                      <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <DropdownItem icon={<User className="h-3.5 w-3.5" />} label="Profile" to="/profile" onClose={() => setDropdownOpen(false)} />
                    <DropdownItem icon={<ShoppingBag className="h-3.5 w-3.5" />} label="My Orders" to="/orders" onClose={() => setDropdownOpen(false)} />
                    <DropdownItem icon={<Settings className="h-3.5 w-3.5" />} label="Settings" to="/settings" onClose={() => setDropdownOpen(false)} />
                    <div className="mt-1 border-t border-border">
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-600 transition-colors hover:bg-rose-50"
                        onClick={() => { setDropdownOpen(false); void logout() }}
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button size="sm" className="btn-accent" onClick={() => navigate('/login')}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Location Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-brand-700">
                <MapPin className="h-5 w-5 text-[var(--fg-accent)]" />
                Set Your Location
              </h3>
              <button type="button" aria-label="Close" className="text-muted-foreground hover:text-foreground" onClick={() => setIsLocationModalOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Choose your city and pincode to see nearby fresh produce.</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">City</label>
                <Input
                  placeholder="e.g., Chennai"
                  value={draftCity}
                  onChange={(e) => setDraftCity(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') onSaveLocation() }}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pincode (optional)</label>
                <Input
                  placeholder="e.g., 600001"
                  value={draftPincode}
                  maxLength={6}
                  onChange={(e) => setDraftPincode(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                  onKeyDown={(e) => { if (e.key === 'Enter') onSaveLocation() }}
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setIsLocationModalOpen(false)}>Cancel</Button>
              <Button variant="outline" className="btn-fg-outline" onClick={() => void onAutoDetect()}>
                <MapPin className="mr-1 h-3.5 w-3.5" />
                Auto detect
              </Button>
              <Button className="btn-fg" onClick={onSaveLocation}>Apply</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const DropdownItem = ({
  icon,
  label,
  to,
  onClose,
}: {
  icon: React.ReactNode
  label: string
  to: string
  onClose: () => void
}) => (
  <Link
    to={to}
    className="flex items-center gap-2 px-4 py-2 text-sm text-foreground transition-colors hover:bg-brand-100"
    onClick={onClose}
  >
    {icon}
    {label}
  </Link>
)
