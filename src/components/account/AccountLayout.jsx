import { useState } from 'react'
import AccountSidebar from './AccountSidebar'

export default function AccountLayout({ children, activeSection = 'dashboard' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden sticky top-0 z-30 bg-white border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Abrir menú"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-ui font-bold text-sm" style={{ color: 'var(--color-text-dark)' }}>
            Mi Cuenta
          </span>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-10">
        <div className="flex gap-8">
          {/* Sidebar — desktop always visible, mobile overlay */}
          <aside className={`
            fixed lg:sticky top-0 lg:top-6 left-0 z-40 lg:z-0
            w-72 lg:w-64 xl:w-72 flex-shrink-0
            h-screen lg:h-auto lg:self-start
            bg-white lg:bg-transparent
            border-r lg:border-r-0
            transform transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `} style={{ borderColor: 'var(--color-border)' }}>
            <div className="p-4 lg:p-0">
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100"
                aria-label="Cerrar menú"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <AccountSidebar activeSection={activeSection} onNavigate={() => setSidebarOpen(false)} />
            </div>
          </aside>

          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
