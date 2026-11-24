import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { usePageTitle } from '../lib/usePageTitle'
import { cn, portalHome } from '../lib/utils'
import type { Portal } from '../types'
import { Logo } from '../components/brand/Logo'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Field'

const portals: Array<{ id: Portal; title: string; sub: string }> = [
  { id: 'central', title: 'Central Property', sub: 'Property Custodian Office' },
  { id: 'lab', title: 'WIL Lab', sub: 'Lab Manager / Assistant' },
]

const facts = [
  'Restock alerts 14–28 days before stockout',
  '1-to-1 turnover for toner, drums and filament',
  'BER-based repair decisions and verified replacements',
]

export function Login() {
  usePageTitle('Sign in')
  const { user, login } = useAuth()
  const navigate = useNavigate()

  const [portal, setPortal] = useState<Portal>('central')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  if (user) return <Navigate to={portalHome(user.portal)} replace />

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: { email?: string; password?: string } = {}

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.'
    }
    if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.'
    }

    setErrors(nextErrors)
    if (nextErrors.email || nextErrors.password) return

    login(email.trim(), password, portal)
    navigate(portalHome(portal), { replace: true })
  }

  return (
    <main className="flex min-h-screen flex-col bg-paper lg:flex-row">
      <section className="flex flex-1 flex-col justify-center gap-7 border-b border-butter-line bg-butter px-6 py-12 sm:px-12 lg:border-b-0 lg:border-r lg:px-16 xl:px-24">
        <Logo size={56} hero subtitle="Property custodianship · predictive inventory" />
        <div className="h-1.5 w-16 rounded-full bg-amber" aria-hidden="true" />
        <h1 className="max-w-[620px] text-[clamp(30px,3vw,40px)] font-extrabold leading-[1.15] tracking-[-0.03em] text-ink">
          Every unit tracked.
          <br />
          Every replacement verified.
        </h1>
        <p className="max-w-[520px] text-base leading-relaxed text-[#3A342A]">
          Predictive inventory and property custodianship for the WildCat Innovation Labs and the
          CIT Property Office.
        </p>
        <ul className="flex max-w-[520px] list-none flex-col gap-2.5 p-0 text-sm text-[#3A342A]">
          {facts.map((fact) => (
            <li key={fact} className="flex items-center gap-2.5">
              <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-amber" />
              {fact}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex w-full max-w-[400px] flex-col gap-[18px]"
        >
          <div className="flex flex-col gap-1.5">
            <h2 className="text-[30px] font-semibold leading-tight tracking-[-0.02em] text-ink">
              Sign in
            </h2>
            <p className="text-sm text-muted">
              Choose your portal and sign in with your EduAsset account.
            </p>
          </div>

          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className="mb-2 text-xs font-medium text-muted">Portal</legend>
            <div className="grid grid-cols-2 gap-2.5">
              {portals.map((option) => {
                const selected = portal === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setPortal(option.id)}
                    className={cn(
                      'flex flex-col items-start gap-1 rounded-control border-2 px-3.5 py-3 text-left transition-colors',
                      selected
                        ? 'border-amber bg-butter-soft'
                        : 'border-line bg-surface hover:border-butter-line',
                    )}
                  >
                    <span className="text-sm font-semibold text-ink">{option.title}</span>
                    <span className="text-xs leading-snug text-muted">{option.sub}</span>
                  </button>
                )
              })}
            </div>
          </fieldset>

          <Field label="Email" htmlFor="login-email" error={errors.email}>
            <Input
              id="login-email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="name@cit.edu"
              value={email}
              aria-invalid={Boolean(errors.email)}
              onChange={(event) => {
                setEmail(event.target.value)
                if (errors.email) setErrors((current) => ({ ...current, email: undefined }))
              }}
              className={cn('h-11', errors.email && 'border-danger')}
            />
          </Field>

          <Field label="Password" htmlFor="login-password" error={errors.password}>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                aria-invalid={Boolean(errors.password)}
                onChange={(event) => {
                  setPassword(event.target.value)
                  if (errors.password) {
                    setErrors((current) => ({ ...current, password: undefined }))
                  }
                }}
                className={cn('h-11 pr-12', errors.password && 'border-danger')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-1 top-0 flex h-11 w-11 items-center justify-center rounded-field text-muted transition-colors hover:text-ink"
              >
                {showPassword ? (
                  <EyeOff className="h-[18px] w-[18px]" aria-hidden="true" />
                ) : (
                  <Eye className="h-[18px] w-[18px]" aria-hidden="true" />
                )}
              </button>
            </div>
          </Field>

          <Button type="submit" className="h-11 w-full text-[15px]">
            Sign in
          </Button>

          <p className="border-l-2 border-amber pl-3 text-xs leading-relaxed text-muted">
            <span className="font-semibold text-ink">Demo access.</span> Any valid email and a
            password of at least 8 characters is accepted. No account is checked.
          </p>

          <p className="text-xs leading-relaxed text-muted">
            Access is role-based. Lab users cannot approve disbursements, locked requisitions,
            replacements or condemnations.
          </p>
        </form>
      </section>
    </main>
  )
}
