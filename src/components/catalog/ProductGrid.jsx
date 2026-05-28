import ProductCard from './ProductCard'

// Productos mock para Fase 1 — se reemplazarán con datos de Firestore en Fase 2
const MOCK_PRODUCTS = [
  {
    id: '1', slug: 'collar-antipulgas-flores',
    nombre: 'Collar Antipulgas Flores Primavera',
    precio_regular: 45.00, precio_oferta: 35.00,
    imagen: null, ean: '7890001234567',
    categoria: 'Collares', rating: 5, reviews_count: 24, stock: 8,
  },
  {
    id: '2', slug: 'ropa-perro-abrigo-invernal',
    nombre: 'Abrigo Invernal Premium para Perro',
    precio_regular: 89.00, precio_oferta: 69.00,
    imagen: null, ean: '7890001234568',
    categoria: 'Ropa', rating: 4, reviews_count: 12, stock: 3,
  },
  {
    id: '3', slug: 'juguete-pelota-interactiva',
    nombre: 'Pelota Interactiva Dispensadora de Premios',
    precio_regular: 55.00, precio_oferta: null,
    imagen: null, ean: '7890001234569',
    categoria: 'Juguetes', rating: 4, reviews_count: 8, stock: 15,
  },
  {
    id: '4', slug: 'correa-retractil-5m',
    nombre: 'Correa Retráctil 5 Metros Resistente',
    precio_regular: 68.00, precio_oferta: 48.00,
    imagen: null, ean: '7890001234570',
    categoria: 'Accesorios', rating: 5, reviews_count: 31, stock: 0,
  },
  {
    id: '5', slug: 'cama-redonda-felpa',
    nombre: 'Cama Redonda Ultra Suave Felpa',
    precio_regular: 120.00, precio_oferta: 95.00,
    imagen: null, ean: '7890001234571',
    categoria: 'Accesorios', rating: 5, reviews_count: 19, stock: 6,
  },
  {
    id: '6', slug: 'comedero-automatico-digital',
    nombre: 'Comedero Automático Digital Programable',
    precio_regular: 199.00, precio_oferta: 159.00,
    imagen: null, ean: '7890001234572',
    categoria: 'Accesorios', rating: 4, reviews_count: 7, stock: 4,
  },
  {
    id: '7', slug: 'shampoo-natural-lavanda',
    nombre: 'Shampoo Natural de Lavanda sin Químicos',
    precio_regular: 38.00, precio_oferta: 29.00,
    imagen: null, ean: '7890001234573',
    categoria: 'Higiene', rating: 4, reviews_count: 45, stock: 20,
  },
  {
    id: '8', slug: 'arnés-paseo-rojo',
    nombre: 'Arnés de Paseo Ergonómico Color Rojo',
    precio_regular: 72.00, precio_oferta: null,
    imagen: null, ean: '7890001234574',
    categoria: 'Collares', rating: 3, reviews_count: 3, stock: 9,
  },
]

export default function ProductGrid({ products, title, subtitle }) {
  const displayProducts = products || MOCK_PRODUCTS

  return (
    <section
      className="gradient-catalog py-10 px-4"
      id="product-grid-section"
      aria-labelledby="catalog-title"
    >
      <div className="max-w-7xl mx-auto">
        {/* ENCABEZADO */}
        {(title || subtitle) && (
          <div className="text-center mb-8">
            {title && (
              <h2 id="catalog-title" className="section-title text-white drop-shadow">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="section-subtitle text-white/80">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* GRID */}
        {displayProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-white/80 font-body text-lg">
              No se encontraron productos 😔
            </p>
          </div>
        ) : (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
            id="products-grid"
          >
            {displayProducts.map((product, idx) => (
              <div
                key={product.id}
                className="animate-[fade-in-up_0.5s_ease-out_both]"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}

        {/* VER MÁS */}
        <div className="text-center mt-8">
          <a
            href="/tienda"
            className="inline-flex items-center gap-2 bg-white text-gray-800
                       font-ui font-semibold px-8 py-3 rounded-full shadow-md
                       hover:shadow-lg hover:scale-105 active:scale-95
                       transition-all duration-200"
            id="view-all-products"
          >
            Ver Todo el Catálogo
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
