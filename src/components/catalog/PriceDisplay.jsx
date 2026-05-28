// Muestra precio tachado (regular) + precio oferta en verde
// Lógica: si no hay precio_oferta, solo muestra precio_regular sin tachar

export default function PriceDisplay({ regular, sale, currency = 'S/.' }) {
  const hasSale = sale && sale < regular

  return (
    <div className="flex items-baseline gap-2 flex-wrap" id="price-display">
      {hasSale ? (
        <>
          <span className="price-regular">
            {currency} {Number(regular).toFixed(2)}
          </span>
          <span className="price-sale text-lg">
            {currency} {Number(sale).toFixed(2)}
          </span>
        </>
      ) : (
        <span className="text-base font-bold" style={{ color: 'var(--color-text-dark)' }}>
          {currency} {Number(regular || sale || 0).toFixed(2)}
        </span>
      )}
    </div>
  )
}
