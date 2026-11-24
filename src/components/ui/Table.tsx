import type {
  HTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react'
import { cn } from '../../lib/utils'

export function TableWrap({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('relative overflow-x-auto rounded-card bg-surface', className)}
      {...props}
    />
  )
}

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={cn('w-full border-collapse text-left text-[13px] text-ink', className)}
      {...props}
    />
  )
}

export function THead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-butter-soft', className)} {...props} />
}

export function TBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-line-soft', className)} {...props} />
}

export function TR({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn('transition-colors hover:bg-[#FFFBEA]', className)}
      {...props}
    />
  )
}

interface ThProps extends ThHTMLAttributes<HTMLTableCellElement> {
  numeric?: boolean
}

export function TH({ numeric = false, className, ...props }: ThProps) {
  return (
    <th
      scope="col"
      className={cn(
        'whitespace-nowrap border-b border-line px-4 py-3 text-xs font-medium text-rust',
        numeric ? 'text-right' : 'text-left',
        className,
      )}
      {...props}
    />
  )
}

interface TdProps extends TdHTMLAttributes<HTMLTableCellElement> {
  numeric?: boolean
}

export function TD({ numeric = false, className, ...props }: TdProps) {
  return (
    <td
      className={cn(
        'px-4 py-3 align-middle',
        numeric && 'whitespace-nowrap text-right tabular-nums',
        className,
      )}
      {...props}
    />
  )
}
