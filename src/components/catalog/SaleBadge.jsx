// Componente simple: círculo verde "Sale!" en esquina superior derecha
// Equivalente al badge de WooCommerce

export default function SaleBadge({ percentage }) {
  return (
    <div
      className="badge-sale"
      id="sale-badge"
      aria-label={percentage ? `${percentage}% de descuento` : 'En oferta'}
    >
      {percentage ? (
        <span className="text-center leading-tight">
          <div className="text-[8px] font-ui">-{percentage}%</div>
          <div className="text-[9px]">OFF</div>
        </span>
      ) : (
        <span className="text-[10px] font-ui">Sale!</span>
      )}
    </div>
  )
}
