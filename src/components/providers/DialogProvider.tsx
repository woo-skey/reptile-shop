'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type ConfirmOptions = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
}

type AlertOptions = {
  title?: string
  message: string
  confirmLabel?: string
}

type PendingDialog =
  | { kind: 'confirm'; options: ConfirmOptions; resolve: (value: boolean) => void }
  | { kind: 'alert'; options: AlertOptions; resolve: () => void }

type DialogContextValue = {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>
  alert: (options: AlertOptions | string) => Promise<void>
}

const DialogContext = createContext<DialogContextValue | null>(null)

export function DialogProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingDialog | null>(null)
  const [mounted, setMounted] = useState(false)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const primaryRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const confirm = useCallback((options: ConfirmOptions | string) => {
    const normalized: ConfirmOptions = typeof options === 'string' ? { message: options } : options
    return new Promise<boolean>((resolve) => {
      setPending({ kind: 'confirm', options: normalized, resolve })
    })
  }, [])

  const alert = useCallback((options: AlertOptions | string) => {
    const normalized: AlertOptions = typeof options === 'string' ? { message: options } : options
    return new Promise<void>((resolve) => {
      setPending({ kind: 'alert', options: normalized, resolve })
    })
  }, [])

  const close = useCallback((result: boolean) => {
    setPending((current) => {
      if (!current) return null
      if (current.kind === 'confirm') current.resolve(result)
      else current.resolve()
      return null
    })
  }, [])

  useEffect(() => {
    if (!pending) return
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    const frame = window.requestAnimationFrame(() => {
      primaryRef.current?.focus()
    })

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close(false)
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', handleKey)
      const prev = previousFocusRef.current
      if (prev && prev.isConnected) {
        window.requestAnimationFrame(() => prev.focus())
      }
    }
  }, [pending, close])

  const dialog = pending && mounted ? (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={() => close(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="glass-modal w-full max-w-sm p-5 sm:p-6 bg-[#F5F0E8] dark:bg-[#1A1A0F]"
        onClick={(e) => e.stopPropagation()}
      >
        {pending.options.title && (
          <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
            {pending.options.title}
          </h3>
        )}
        <p className="text-sm break-keep mb-5" style={{ color: 'var(--foreground)', opacity: 0.85 }}>
          {pending.options.message}
        </p>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
          {pending.kind === 'confirm' && (
            <button
              type="button"
              onClick={() => close(false)}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ color: 'var(--foreground)', opacity: 0.6, border: '1px solid rgba(255,255,255,0.15)' }}
            >
              {pending.options.cancelLabel ?? '취소'}
            </button>
          )}
          <button
            ref={primaryRef}
            type="button"
            onClick={() => close(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={
              pending.kind === 'confirm' && pending.options.variant === 'danger'
                ? { backgroundColor: 'rgba(239,68,68,0.9)', color: '#F5F0E8', border: '1px solid rgba(239,68,68,0.35)' }
                : { backgroundColor: '#456132', color: '#F5F0E8', border: '1px solid #C9A227' }
            }
          >
            {pending.options.confirmLabel ?? '확인'}
          </button>
        </div>
      </div>
    </div>
  ) : null

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      {dialog && typeof document !== 'undefined' && createPortal(dialog, document.body)}
    </DialogContext.Provider>
  )
}

export function useDialogs() {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error('useDialogs must be used within DialogProvider')
  return ctx
}
