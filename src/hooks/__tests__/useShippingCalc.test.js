import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import useShippingCalc from '../useShippingCalc'

vi.mock('../../services', () => ({
  obtenerConfiguracionEnvio: vi.fn(() => Promise.resolve({
    arequipaFreeLimit: 30,
    nationalFreeLimit: 100,
    arequipaFee: 10,
    nationalFee: 15
  }))
}))

describe('useShippingCalc hook', () => {
  it('should calculate shipping costs correctly for Arequipa', async () => {
    // Arequipa, total = 20 (bajo el límite de 30) -> cobro 10 soles
    const { result } = renderHook(() => useShippingCalc('Arequipa', 20))

    await waitFor(() => {
      expect(result.current.costoEnvio).toBe(10)
    })
    expect(result.current.isArequipa).toBe(true)
  })

  it('should apply free shipping for Arequipa when limit is met', async () => {
    // Arequipa, total = 35 (sobre el límite de 30) -> gratis
    const { result } = renderHook(() => useShippingCalc('Arequipa', 35))

    await waitFor(() => {
      expect(result.current.costoEnvio).toBe(0)
    })
  })

  it('should calculate shipping costs correctly for Nacional', async () => {
    // Lima, total = 50 (bajo el límite de 100) -> cobro 15 soles
    const { result } = renderHook(() => useShippingCalc('Lima', 50))

    await waitFor(() => {
      expect(result.current.costoEnvio).toBe(15)
    })
    expect(result.current.isArequipa).toBe(false)
  })
})

