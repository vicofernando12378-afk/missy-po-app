import { useState, useEffect, useCallback } from 'react'
import { getOrdersByUser } from '../services/userProfile'

export default function useOrdersByUser(uid, { limite = 20 } = {}) {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchOrders = useCallback(async () => {
    if (!uid) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await getOrdersByUser(uid, { limite })
      setOrders(data)
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [uid, limite])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const refresh = useCallback(() => fetchOrders(), [fetchOrders])

  return { orders, isLoading, error, refresh }
}
