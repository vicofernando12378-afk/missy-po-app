import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useCheckoutForm from '../useCheckoutForm'

describe('useCheckoutForm hook', () => {
  it('should initialize with default states', () => {
    const { result } = renderHook(() => useCheckoutForm())
    
    expect(result.current.nombre).toBe('')
    expect(result.current.apellido).toBe('')
    expect(result.current.email).toBe('')
    expect(result.current.celular).toBe('')
    expect(result.current.departamento).toBe('Arequipa')
    expect(result.current.tipoDocumento).toBe('DNI')
    expect(result.current.numeroDocumento).toBe('')
  })

  it('should handle document number edits correctly for DNI', () => {
    const { result } = renderHook(() => useCheckoutForm())

    act(() => {
      result.current.handleDocumentoChange({ target: { value: '1234abcd5678' } })
    })

    expect(result.current.numeroDocumento).toBe('12345678')
  })

  it('should validate form and set error message if invalid', () => {
    const { result } = renderHook(() => useCheckoutForm())

    act(() => {
      const ok = result.current.validateForm()
      expect(ok).toBe(false)
    })

    expect(result.current.errorMsg).not.toBe('')
  })
})
