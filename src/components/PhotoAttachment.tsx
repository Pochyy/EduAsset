import { useEffect, type ChangeEvent } from 'react'
import { Camera, Check, X } from 'lucide-react'

export interface PhotoValue {
  name: string
  previewUrl: string | null
}

interface PhotoAttachmentProps {
  id: string
  label: string
  value: PhotoValue | null
  onChange: (value: PhotoValue | null) => void
  required?: boolean
  error?: string
}

export function PhotoAttachment({
  id,
  label,
  value,
  onChange,
  required = false,
  error,
}: PhotoAttachmentProps) {
  useEffect(() => {
    return () => {
      if (value?.previewUrl) URL.revokeObjectURL(value.previewUrl)
    }
  }, [value])

  function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    onChange({ name: file.name, previewUrl: URL.createObjectURL(file) })
    event.target.value = ''
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted">
        {label}
        {required ? ' (required)' : ''}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <label
          htmlFor={id}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2.5 rounded-control border border-dashed border-rust bg-surface px-4 text-sm font-semibold text-rust transition-colors hover:bg-butter-soft focus-within:ring-2 focus-within:ring-rust/50"
        >
          <input
            id={id}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={choose}
            className="sr-only"
          />
          {value?.previewUrl ? (
            <img
              src={value.previewUrl}
              alt=""
              className="h-8 w-8 rounded object-cover"
            />
          ) : value ? (
            <Check className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Camera className="h-5 w-5" aria-hidden="true" />
          )}
          {value ? 'Replace photo' : 'Take or upload a photo'}
        </label>
        {value ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex min-h-11 items-center gap-1 rounded-control px-2 text-xs font-semibold text-neutral-text transition-colors hover:bg-paper"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Remove
          </button>
        ) : null}
      </div>
      {value ? (
        <span className="break-all text-xs text-muted">{value.name}</span>
      ) : null}
      {error ? (
        <span role="alert" className="text-xs font-medium text-danger">
          {error}
        </span>
      ) : null}
    </div>
  )
}
