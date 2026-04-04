import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../context/auth-context'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

export const LoginPage = () => {
  const navigate = useNavigate()
  const { isAuthenticated, loginWithGithub, loginWithGoogle, isLoading } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  return (
    <div className="login-container rounded-2xl">
      <Card className="login-card border-none">
        <CardHeader className="pb-2 text-center">
          <div className="brand-logo">🥬</div>
          <CardTitle className="text-center text-2xl text-brand-700">Welcome to Fresh Greens</CardTitle>
          <p className="text-sm text-muted-foreground">Continue with your account to order fresh produce.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="social-btn w-full" onClick={() => void loginWithGoogle()} disabled={isLoading}>
            Continue with Google
          </Button>
          <Button className="social-btn github-btn w-full" variant="outline" onClick={() => void loginWithGithub()} disabled={isLoading}>
            Continue with GitHub
          </Button>
          <p className="text-center text-xs text-muted-foreground">Secure login powered by Firebase Authentication.</p>
        </CardContent>
      </Card>
    </div>
  )
}
