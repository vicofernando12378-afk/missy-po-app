import { useState, useEffect } from 'react'

// ============================================================
// useDebounce — Retrasa el valor N ms después del último cambio
// Uso: const debouncedQuery = useDebounce(query, 300)
// ============================================================

export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

export default useDebounce
