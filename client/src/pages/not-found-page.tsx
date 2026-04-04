import { Link } from 'react-router-dom'

export const NotFoundPage = () => {
  return (
    <div className="rounded-xl border border-border p-10 text-center">
      <h1 className="text-2xl font-bold text-brand-700">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">The page you requested does not exist.</p>
      <Link className="mt-4 inline-block text-brand-700 underline" to="/">
        Back to home
      </Link>
    </div>
  )
}
