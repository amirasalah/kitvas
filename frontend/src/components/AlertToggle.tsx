'use client'

import { trpc } from '@/app/providers'

export function AlertToggle() {
  const { data, isLoading } = trpc.alerts.getStatus.useQuery()
  const utils = trpc.useUtils()

  const subscribe = trpc.alerts.subscribe.useMutation({
    onSuccess: () => utils.alerts.getStatus.invalidate(),
  })
  const unsubscribe = trpc.alerts.unsubscribe.useMutation({
    onSuccess: () => utils.alerts.getStatus.invalidate(),
  })

  const enabled = data?.enabled ?? false
  const isMutating = subscribe.isPending || unsubscribe.isPending

  function toggle() {
    if (enabled) {
      unsubscribe.mutate()
    } else {
      subscribe.mutate()
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={isLoading || isMutating}
      className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
    >
      <span className="flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        Trend alerts
      </span>
      <span
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          enabled ? 'bg-[#10B981]' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-4' : 'translate-x-1'
          }`}
        />
      </span>
    </button>
  )
}
