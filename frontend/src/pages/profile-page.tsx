import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/badge'
import { api } from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

export const ProfilePage = () => {
  const userQuery = useQuery({ queryKey: ['me'], queryFn: api.getCurrentUser })
  const user = userQuery.data
  const roleLabel = user?.role ? user.role.replace('ROLE_', '') : '-'

  return (
    <Card className="border-none shadow-[var(--fg-shadow)]">
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p><span className="font-semibold">Name:</span> {user?.displayName ?? '-'}</p>
        <p><span className="font-semibold">Email:</span> {user?.email ?? '-'}</p>
        <div className="flex items-center gap-2">
          <span className="font-semibold">Role:</span>
          <Badge variant="secondary">{roleLabel}</Badge>
        </div>
        <div className="pt-2">
          <Link className="text-brand-700 underline" to="/orders">View orders</Link>
          <span className="px-2">•</span>
          <Link className="text-brand-700 underline" to="/settings">Account settings</Link>
        </div>
      </CardContent>
    </Card>
  )
}
