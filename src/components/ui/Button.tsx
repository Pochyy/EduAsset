import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'md' | 'sm' | 'icon'

export function buttonStyles(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
    size === 'md' && 'min-h-11 px-4 text-sm',
    size === 'sm' && 'min-h-11 px-3 text-[13px]',
    size === 'icon' && 'h-11 w-11',
    variant === 'primary' &&
      'border border-amber-press bg-amber text-ink hover:bg-amber-hover active:bg-amber-press',
    variant === 'secondary' &&
      'border border-amber-press bg-surface text-ink hover:bg-butter-soft',
    variant === 'ghost' && 'text-rust hover:bg-butter-soft',
    variant === 'danger' && 'bg-danger text-white hover:bg-[#9a1f19]',
    className,
  )
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return <button type={type} className={buttonStyles(variant, size, className)} {...props} />
}
