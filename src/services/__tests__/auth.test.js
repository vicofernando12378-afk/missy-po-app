import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resetPassword } from '../auth'
import { sendPasswordResetEmail } from 'firebase/auth'

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  sendPasswordResetEmail: vi.fn(() => Promise.resolve()),
  GoogleAuthProvider: vi.fn()
}))

vi.mock('../firebase', () => ({
  db: {},
  auth: {}
}))

describe('resetPassword service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe invocar sendPasswordResetEmail de Firebase con el email correcto', async () => {
    const email = 'test@example.com'
    await resetPassword(email)
    
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1)
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(expect.any(Object), email)
  })

  it('debe propagar errores de Firebase Auth si el envío falla', async () => {
    const fakeError = new Error('Auth error')
    fakeError.code = 'auth/user-not-found'
    vi.mocked(sendPasswordResetEmail).mockRejectedValueOnce(fakeError)

    const email = 'nonexistent@example.com'
    await expect(resetPassword(email)).rejects.toThrow('Auth error')
  })
})
