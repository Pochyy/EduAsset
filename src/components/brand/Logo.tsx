import { cn } from '../../lib/utils'

interface LogoProps {
  size?: number
  subtitle?: string
  subtitleClassName?: string
  hero?: boolean
  className?: string
}

export function Logo({ size = 40, subtitle, subtitleClassName, hero = false, className }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        role="img"
        aria-label="EduAsset"
        className="shrink-0"
      >
        <rect
          x="2"
          y="2"
          width="116"
          height="116"
          rx="28"
          fill="#FFFFFF"
          stroke="#E7E2D6"
          strokeWidth="2"
        />
        <rect x="28" y="30" width="14" height="60" rx="3" fill="#171717" />
        <rect x="28" y="30" width="44" height="13" rx="3" fill="#171717" />
        <rect x="28" y="53.5" width="34" height="13" rx="3" fill="#171717" />
        <rect x="28" y="77" width="44" height="13" rx="3" fill="#171717" />
        <rect
          x="80.5"
          y="31.5"
          width="13"
          height="13"
          rx="2"
          fill="none"
          stroke="#F5A623"
          strokeWidth="3"
        />
        <rect x="84.5" y="35.5" width="5" height="5" rx="1" fill="#F5A623" />
        <rect x="80" y="54" width="6" height="6" rx="1" fill="#F5A623" />
        <rect x="88" y="62" width="6" height="6" rx="1" fill="#F5A623" />
        <rect x="80" y="70" width="6" height="6" rx="1" fill="#F5A623" />
        <rect x="88" y="78" width="6" height="6" rx="1" fill="#F5A623" />
        <rect x="80" y="84" width="6" height="6" rx="1" fill="#F5A623" />
      </svg>
      <span className="flex min-w-0 flex-col gap-1">
        <span
          className={cn(
            'font-extrabold leading-none tracking-[-0.03em] text-rust',
            hero ? 'text-[40px]' : 'text-[22px]',
          )}
        >
          EduAsset
        </span>
        {subtitle ? (
          <span
            className={cn(
              'font-medium leading-tight text-warm-muted',
              hero ? 'text-xs tracking-[0.1em] uppercase' : 'text-xs',
              subtitleClassName,
            )}
          >
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  )
}
