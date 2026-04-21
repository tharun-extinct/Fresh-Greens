import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { AxiosError } from 'axios'
import { User, Phone, CheckCircle2, AlertCircle } from 'lucide-react'
import { api } from '../lib/api'
import { queryClient } from '../lib/query-client'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { LoadingState } from '../components/common/loading-state'

export const SettingsPage = () => {
  const userQuery = useQuery({ queryKey: ['me'], queryFn: api.getCurrentUser })
  const [displayName, setDisplayName] = useState('')
  const [city, setCity] = useState('')
  const [pincode, setPincode] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  useEffect(() => {
    if (!userQuery.data) return
    setDisplayName(userQuery.data.displayName ?? '')
    setCity(userQuery.data.city ?? '')
    setPincode(userQuery.data.pincode ?? '')
    setPhoneNumber(userQuery.data.phone ?? '')
  }, [userQuery.data])

  const saveProfile = useMutation({
    mutationFn: () => api.updateCurrentUser({ displayName, city, pincode, phone: phoneNumber }),
    onSuccess: () => {
      toast.success('Profile updated successfully')
      void queryClient.invalidateQueries({ queryKey: ['me'] })
    },
    onError: () => toast.error('Failed to update profile'),
  })

  const verifyPhone = useMutation({
    mutationFn: () => api.verifyPhone(phoneNumber),
    onSuccess: () => {
      toast.success('Phone verified successfully! ✅')
      void queryClient.invalidateQueries({ queryKey: ['me'] })
    },
    onError: (err: unknown) => {
      const msg = (err as AxiosError<{ message?: string }>)?.response?.data?.message
      toast.error(msg || 'Could not verify phone. Please try again.')
    },
  })

  if (userQuery.isLoading) return <LoadingState label="Loading settings…" />

  const user = userQuery.data
  const isPhoneVerified = user?.phoneVerified

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="section-title">Account Settings</h1>

      {/* Profile settings */}
      <Card className="settings-card border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4 text-brand-700" />
            Profile Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Display Name</label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your full name" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</label>
            <Input value={user?.email ?? ''} disabled className="cursor-not-allowed opacity-60" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">City</label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Your city" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pincode</label>
              <Input value={pincode} onChange={(e) => setPincode(e.target.value.replace(/[^\d]/g, '').slice(0, 6))} placeholder="6-digit pincode" maxLength={6} />
            </div>
          </div>
          <Button className="btn-fg" onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}>
            {saveProfile.isPending ? 'Saving…' : 'Save Profile'}
          </Button>
        </CardContent>
      </Card>

      {/* Phone verification */}
      <Card className="settings-card border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-brand-700" />
            Phone Verification
            {isPhoneVerified
              ? <span className="ml-1 flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"><CheckCircle2 className="h-3 w-3" />Verified</span>
              : <span className="ml-1 flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700"><AlertCircle className="h-3 w-3" />Not verified</span>
            }
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isPhoneVerified && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
              Phone verification is required to complete orders. Please verify your number below.
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone Number</label>
            <div className="flex gap-2">
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 xxxxxxxxxx"
                className="flex-1"
              />
              <Button
                className="btn-fg-outline shrink-0"
                variant="outline"
                onClick={() => verifyPhone.mutate()}
                disabled={!phoneNumber.trim() || verifyPhone.isPending}
              >
                {verifyPhone.isPending ? 'Verifying…' : 'Verify Phone'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

