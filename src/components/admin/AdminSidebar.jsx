import React from 'react';
import { NavLink } from 'react-router-dom';

export default function AdminSidebar({
  user,
  menuItems,
  onLogout,
  isOpen,
  onClose,
  isMobile = false,
}) {
  const containerClasses = isMobile
    ? `fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-white border-r border-gray-100 shadow-xl transition-transform duration-350 ease-out lg:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`
    : 'hidden lg:flex flex-col w-72 bg-white border-r border-gray-100 shadow-sm shrink-0';

  return (
    <>
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={containerClasses}>
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🐶</span>
            <div>
              <h2 className="font-brand text-xl text-gray-800 leading-tight">Missy & Po</h2>
              <span className="text-xs text-coral font-semibold uppercase tracking-wider">Control Panel</span>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-150 text-gray-500"
            >
              ✕
            </button>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={isMobile ? onClose : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-2xl font-semibold transition-all duration-250 ${
                  isActive
                    ? 'bg-coral/10 text-coral shadow-sm shadow-coral/5'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
            >
              <span className="text-xl">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge > 0 && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-coral text-white text-[10px] font-bold animate-pulse">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-50 space-y-2">
          {user && (
            <div className="p-3 bg-gray-50 rounded-2xl text-xs space-y-1">
              <p className="text-gray-400">Usuario:</p>
              <p className="font-semibold text-gray-800 truncate" title={user.email}>
                {user.email}
              </p>
            </div>
          )}
          <a
            href="/"
            onClick={isMobile ? onClose : undefined}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 text-gray-500 hover:text-gray-850 text-sm font-semibold transition-all"
          >
            🏠 Ir a la Tienda
          </a>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-red-50 text-red-500 text-sm font-semibold transition-all"
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}
