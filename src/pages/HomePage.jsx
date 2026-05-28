import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import HeroSlider from '../components/hero/HeroSlider'
import AnimatedTitle from '../components/hero/AnimatedTitle'
import ProductGrid from '../components/catalog/ProductGrid'
import CTABanner from '../components/cta/CTABanner'
import useCatalogStore from '../store/catalogStore'

export default function HomePage() {
  const { productos, fetchCatalog } = useCatalogStore()

  useEffect(() => {
    fetchCatalog()
  }, [fetchCatalog])

  // Mostrar los primeros 8 productos del catálogo real
  const destacados = productos.filter(p => p.destacado).slice(0, 8)
  const productosAMostrar = destacados.length > 0 ? destacados : productos.slice(0, 8)

  return (
    <>
      <Helmet>
        <title>Novedades y Productos Destacados | Missy & Po Pet Shop</title>
      </Helmet>

      {/* Hero Slider */}
      <HeroSlider />

      {/* Título animado "NOVEDADES MISSY & PO!!!!" */}
      <AnimatedTitle />

      {/* Grid de productos */}
      <ProductGrid
        title="Productos Destacados"
        subtitle="Los favoritos de nuestros clientes"
        products={productosAMostrar}
      />

      {/* Banner CTA amarillo con Yorkie */}
      <CTABanner />
    </>
  )
}
