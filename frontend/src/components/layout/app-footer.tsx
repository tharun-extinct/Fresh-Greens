export const AppFooter = () => {
  return (
    <footer className="footer-fg mt-14">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:grid-cols-3">
        <div>
          <p className="mb-2 text-base font-bold text-white">🥬 Fresh Greens</p>
          <p className="text-sm text-white/80">Farm-fresh produce delivered quickly with secure payments and trusted quality.</p>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-white">Customer</p>
          <ul className="space-y-1 text-sm text-white/80">
            <li>Orders</li>
            <li>Cart</li>
            <li>Support</li>
          </ul>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-white">Platform</p>
          <ul className="space-y-1 text-sm text-white/80">
            <li>Secure Checkout</li>
            <li>Phone Verification</li>
            <li>Admin Monitoring</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15 py-3 text-center text-xs text-white/70">
        © {new Date().getFullYear()} Fresh Greens. All rights reserved.
      </div>
    </footer>
  )
}
