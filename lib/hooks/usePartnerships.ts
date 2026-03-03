import { useEffect, useState, useCallback } from "react"
import { partnershipsApi } from "@/lib/api/django-client"
import type { Partnership } from "@/lib/types/partnership"

export function usePartnerships() {
  const [items, setItems] = useState<Partnership[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await partnershipsApi.list()
      setItems(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e?.message || "Failed to load partnerships")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { items, loading, error, reload: load }
}

export function usePartnership(id: string | null) {
  const [item, setItem] = useState<Partnership | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await partnershipsApi.getDetail(id)
      setItem(data)
    } catch (e: any) {
      setError(e?.message || "Failed to load partnership")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  return { item, loading, error, reload: load }
}
