// Botones flotantes WhatsApp + Telegram — esquina inferior derecha

import { useState, useEffect } from 'react';

const WHATSAPP_NUMBER = '51913249330';
const TELEGRAM_BOT = 'https://t.me/Missypo_bot';

export default function WhatsAppFloat() {
  const [whatsappUrl, setWhatsappUrl] = useState(`https://wa.me/${WHATSAPP_NUMBER}`);

  useEffect(() => {
    const currentPath = window.location.pathname;
    const baseMessage = '¡Hola! Vi su tienda Missy & Po y me gustaría consultar sobre un producto 🐾';
    const trackingSuffix = ` (Origen: Web Float Button | Sección: ${currentPath})`;
    const fullMessage = encodeURIComponent(baseMessage + trackingSuffix);
    setWhatsappUrl(`https://wa.me/${WHATSAPP_NUMBER}?text=${fullMessage}`);
  }, []);

  return (
    <>
      {/* ── Telegram ── */}
      <a
        href={TELEGRAM_BOT}
        target="_blank"
        rel="noopener noreferrer"
        className="float-btn right-[4.5rem] bottom-6 group"
        style={{ backgroundColor: '#0088CC', zIndex: 10001 }}
        id="telegram-float"
        aria-label="Contactar por Telegram"
        title="Chatea con Missy por Telegram"
      >
        <svg
          className="w-7 h-7 text-white"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>

        <span className="absolute right-16 bg-gray-800 text-white text-xs font-ui
                         px-3 py-1.5 rounded-full whitespace-nowrap opacity-0
                         group-hover:opacity-100 transition-opacity duration-200 shadow-lg pointer-events-none">
          Chatea con Missy por Telegram
        </span>

        <span
          className="absolute inset-0 rounded-full animate-ping opacity-30 pointer-events-none"
          style={{ backgroundColor: '#0088CC' }}
          aria-hidden="true"
        />
      </a>

      {/* ── WhatsApp ── */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="float-btn right-5 bottom-6 group"
        style={{ backgroundColor: 'var(--color-whatsapp)', zIndex: 10000 }}
        id="whatsapp-float"
        aria-label="Contactar por WhatsApp"
        title="Chatea con nosotros por WhatsApp"
      >
        <svg
          className="w-7 h-7 text-white"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15
                   -.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463
                   -2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606
                   .134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371
                   -.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51
                   -.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016
                   -1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487
                   .709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719
                   2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.112 1.522 5.84L.057 23.54
                   a.75.75 0 00.916.95l5.87-1.487A11.944 11.944 0 0012 24c6.627 0 12-5.373
                   12-12S18.627 0 12 0zm0 21.75a9.743 9.743 0 01-4.943-1.347l-.353-.21
                   -3.644.924.97-3.542-.229-.366A9.727 9.727 0 012.25 12C2.25 6.615 6.615
                   2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
        </svg>

        <span className="absolute right-16 bg-gray-800 text-white text-xs font-ui
                         px-3 py-1.5 rounded-full whitespace-nowrap opacity-0
                         group-hover:opacity-100 transition-opacity duration-200 shadow-lg pointer-events-none">
          ¿Tienes dudas? Escríbenos
        </span>

        <span
          className="absolute inset-0 rounded-full animate-ping opacity-30 pointer-events-none"
          style={{ backgroundColor: 'var(--color-whatsapp)' }}
          aria-hidden="true"
        />
      </a>
    </>
  );
}
