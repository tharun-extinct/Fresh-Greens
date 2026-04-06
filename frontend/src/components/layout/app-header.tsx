import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Search, ShoppingCart, User, MapPin, LogOut, Shield } from 'lucide-react'
import { useAuth } from '../../context/auth-context'
import { useLocation } from '../../context/location-context'
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

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '')
  }, [searchParams])

  useEffect(() => {
    if (!isLocationModalOpen) return
    setDraftCity(location.city === 'All Cities' ? '' : location.city)
    setDraftPincode(location.pincode)
  }, [isLocationModalOpen, location.city, location.pincode])

  const onSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedQuery = query.trim()
    if (!trimmedQuery) {
      navigate('/')
      return
    }
    navigate(`/?q=${encodeURIComponent(trimmedQuery)}`)
  }

  const onSaveLocation = () => {
    const city = draftCity.trim()
    const pincode = draftPincode.trim()

    setLocation({
      city: city || 'All Cities',
      pincode,
    })
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
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white">
            <span className="text-2xl">🥬</span>
            Fresh Greens
          </Link>

          <form className="search-bar flex flex-1 items-center gap-2" onSubmit={onSearchSubmit}>
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
                placeholder="Search for fresh vegetables, fruits, and groceries"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                }}
              />
              <button type="submit" className="btn-fg absolute right-1 top-1/2 -translate-y-1/2 px-4 py-1.5 text-xs">
                Search
              </button>
            </div>
          </form>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 md:hidden"
              onClick={() => setIsLocationModalOpen(true)}
            >
              <MapPin className="mr-1 h-4 w-4" />
              {location.city}
            </Button>
            <Button variant="outline" size="icon" className="border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={() => navigate('/cart')} aria-label="Cart">
              <ShoppingCart className="h-4 w-4" />
            </Button>

            {isAuthenticated ? (
              <>
                {user?.role === 'ADMIN' && (
                  <Button variant="outline" size="sm" className="border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={() => navigate('/admin')}>
                    <Shield className="mr-1 h-4 w-4" />
                    Admin
                  </Button>
                )}
                <Button variant="outline" size="sm" className="border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={() => navigate('/profile')}>
                  <User className="mr-1 h-4 w-4" />
                  Profile
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                  onClick={() => {
                    void logout()
                  }}
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button size="sm" className="btn-accent" onClick={() => navigate('/login')}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {isLocationModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-brand-700">Set delivery location</h3>
            <p className="mt-1 text-sm text-muted-foreground">Choose your city and pincode for nearby produce.</p>

            <div className="mt-4 space-y-3">
              <Input
                placeholder="City (e.g., Chennai)"
                value={draftCity}
                onChange={(event) => setDraftCity(event.target.value)}
              />
              <Input
                placeholder="Pincode"
                value={draftPincode}
                onChange={(event) => setDraftPincode(event.target.value.replace(/[^\d]/g, '').slice(0, 6))}
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setIsLocationModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="outline" className="btn-fg-outline" onClick={() => void onAutoDetect()}>
                Auto detect
              </Button>
              <Button className="btn-fg" onClick={onSaveLocation}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
