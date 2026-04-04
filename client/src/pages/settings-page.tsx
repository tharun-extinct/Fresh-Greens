import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { queryClient } from '../lib/query-client'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'

export const SettingsPage = () => {
  const userQuery = useQuery({ queryKey: ['me'], queryFn: api.getCurrentUser })
  const [displayName, setDisplayName] = useState('')
  const [city, setCity] = useState('')
  const [pincode, setPincode] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')

  useEffect(() => {
    if (!userQuery.data) return
    setDisplayName(userQuery.data.displayName ?? '')
    setCity(userQuery.data.city ?? '')
    setPincode(userQuery.data.pincode ?? '')
    setPhoneNumber(userQuery.data.phoneNumber ?? '')
  }, [userQuery.data])

  const saveProfile = useMutation({
    mutationFn: () => api.updateCurrentUser({ displayName, city, pincode, phoneNumber }),
    onSuccess: () => {
      toast.success('Profile updated')
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
    onError: () => toast.error('Failed to update profile'),
  })

  const sendOtp = useMutation({
    mutationFn: () => api.sendPhoneOtp(phoneNumber),
    onSuccess: () => toast.success('OTP sent'),
    onError: () => toast.error('Could not send OTP'),
  })

  const verifyOtp = useMutation({
    mutationFn: () => api.verifyPhoneOtp(phoneNumber, otp),
    onSuccess: () => toast.success('Phone verified'),
    onError: () => toast.error('Invalid OTP'),
  })

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="settings-card border-none">
        <CardHeader><CardTitle>Profile Settings</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display Name" />
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
          <Input value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="Pincode" />
          <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Phone Number" />
          <Button className="btn-fg" onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}>Save</Button>
        </CardContent>
      </Card>

      <Card className="settings-card border-none">
        <CardHeader><CardTitle>Phone Verification</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Button className="btn-fg-outline" variant="outline" onClick={() => sendOtp.mutate()} disabled={!phoneNumber || sendOtp.isPending}>
            Send OTP
          </Button>
          <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" />
          <Button className="btn-fg" onClick={() => verifyOtp.mutate()} disabled={!otp || verifyOtp.isPending}>Verify OTP</Button>
        </CardContent>
      </Card>
    </div>
  )
}
