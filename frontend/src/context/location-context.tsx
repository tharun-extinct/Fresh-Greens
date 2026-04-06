import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

type LocationState = {
  city: string
  pincode: string
}

type LocationContextValue = {
  location: LocationState
  setLocation: (next: LocationState) => void
  autoDetectLocation: () => Promise<void>
}

const STORAGE_KEY = 'fg_location'
const DEFAULT_LOCATION: LocationState = { city: 'All Cities', pincode: '' }

const LocationContext = createContext<LocationContextValue | null>(null)

const normalizeLocation = (city?: string, pincode?: string): LocationState | null => {
  const normalizedCity = (city || '').trim()
  const normalizedPincode = (pincode || '').trim()

  if (!normalizedCity || normalizedCity.toLowerCase() === 'all cities') {
    return null
  }

  return {
    city: normalizedCity,
    pincode: normalizedPincode,
  }
}

const fetchWithTimeout = async (url: string, timeoutMs = 3000) => {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    window.clearTimeout(timeout)
  }
}

export const LocationProvider = ({ children }: PropsWithChildren) => {
  const [location, setLocationState] = useState<LocationState>(DEFAULT_LOCATION)

  const setLocation = useCallback((next: LocationState) => {
    setLocationState(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const autoDetectLocation = useCallback(async () => {
    const providers = [
      async () => {
        const response = await fetchWithTimeout('https://ipapi.co/json/')
        if (!response.ok) return null
        const data = (await response.json()) as { city?: string; postal?: string }
        return normalizeLocation(data.city, data.postal)
      },
      async () => {
        const response = await fetchWithTimeout('https://ipwho.is/')
        if (!response.ok) return null
        const data = (await response.json()) as { success?: boolean; city?: string; postal?: string }
        if (data.success === false) return null
        return normalizeLocation(data.city, data.postal)
      },
    ]

    try {
      for (const provider of providers) {
        const detected = await provider()
        if (detected) {
          setLocation(detected)
          return
        }
      }
    } catch {
      // ignore
    }
  }, [setLocation])

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as LocationState
        setLocationState(parsed)

        // If a placeholder value got persisted from an earlier failed attempt,
        // retry auto-detection on next app load.
        if (normalizeLocation(parsed.city, parsed.pincode) === null) {
          void autoDetectLocation()
        }
        return
      } catch {
        // ignore
      }
    }
    void autoDetectLocation()
  }, [autoDetectLocation])

  const value = useMemo(() => ({ location, setLocation, autoDetectLocation }), [location, setLocation, autoDetectLocation])

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export const useLocation = () => {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider')
  }
  return context
}
