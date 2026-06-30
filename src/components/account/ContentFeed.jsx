export default function ContentFeed() {
  const blogUrl = '/blog'
  const youtubeUrl = 'https://www.youtube.com/@MissyPoPetShop'
  const tvUrl = '/missypo-tv'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Blog Card */}
      <a
        href={blogUrl}
        className="group bg-white rounded-2xl border p-5 hover:shadow-md transition-all duration-200 block"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
               style={{ backgroundColor: '#fff5f5' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-coral)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <div>
            <h3 className="font-ui font-bold text-sm" style={{ color: 'var(--color-text-dark)' }}>
              Blog Missy & Po
            </h3>
            <p className="text-xs font-body" style={{ color: 'var(--color-text-gray)' }}>
              Consejos y guías para tu mascota
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm font-ui font-semibold transition-all group-hover:translate-x-1"
             style={{ color: 'var(--color-coral)' }}>
          Ver artículos
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </a>

      {/* YouTube Card */}
      <a
        href={tvUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group bg-white rounded-2xl border p-5 hover:shadow-md transition-all duration-200 block"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
               style={{ backgroundColor: '#fef2f2' }}>
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
          <div>
            <h3 className="font-ui font-bold text-sm" style={{ color: 'var(--color-text-dark)' }}>
              Missy & Po TV
            </h3>
            <p className="text-xs font-body" style={{ color: 'var(--color-text-gray)' }}>
              Videos exclusivos en YouTube
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm font-ui font-semibold transition-all group-hover:translate-x-1 text-red-500">
          Ver canal
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </a>
    </div>
  )
}
