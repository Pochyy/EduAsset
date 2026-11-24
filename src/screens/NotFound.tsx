import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePageTitle } from '../lib/usePageTitle'
import { portalHome } from '../lib/utils'
import { Logo } from '../components/brand/Logo'
import { buttonStyles } from '../components/ui/Button'

export function NotFound() {
  usePageTitle('Page not found')
  const { user } = useAuth()
  const home = user ? portalHome(user.portal) : '/login'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-paper px-6 py-12 text-center">
      <Logo size={56} hero subtitle="Property custodianship · predictive inventory" />
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium tracking-[0.02em] text-rust">404</p>
        <h1 className="text-[clamp(28px,4vw,40px)] font-semibold tracking-[-0.02em] text-ink">
          Page not found
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-muted">
          The screen or link does not exist in this prototype. Use the portal navigation to return
          to a working view.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {user ? (
          <Link to={home} className={buttonStyles('primary')}>
            Back to dashboard
          </Link>
        ) : (
          <Link to="/login" className={buttonStyles('primary')}>
            Go to sign in
          </Link>
        )}
        <Link to="/central/dashboard" className={buttonStyles('secondary')}>
          Central portal
        </Link>
      </div>
    </div>
  )
}
