'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export function useTrendingSSE() {
  const queryClient = useQueryClient()
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'
    const es = new EventSource(`${apiUrl}/sse/trends`)

    es.addEventListener('trends-update', () => {
      queryClient.invalidateQueries({ queryKey: [['analytics', 'hotIngredients']] })
    })

    es.addEventListener('connected', () => {
      setIsConnected(true)
    })

    es.onerror = () => {
      setIsConnected(false)
    }

    return () => {
      es.close()
      setIsConnected(false)
    }
  }, [queryClient])

  return { isConnected }
}
