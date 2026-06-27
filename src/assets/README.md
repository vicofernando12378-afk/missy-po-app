# 📁 src/assets — Imágenes Optimizadas por Astro

## Estructura de carpetas

```
src/assets/
├── club/        → Tarjetas de beneficios, hero de /club-missypo
├── blog/        → Imágenes de artículos del blog
├── tv/          → Hero y thumbnails de /missypo-tv
├── hero/        → Banners principales del home
└── productos/   → Fotos de productos
```

## ¿Cómo usarlas en páginas Astro?

```astro
---
import { Image } from 'astro:assets';
import miImagen from '../assets/club/beneficio-puntos.jpg';
---

<Image
  src={miImagen}
  alt="Descripción de la imagen"
  width={400}
  height={300}
/>
```

Astro automáticamente convierte a WebP, genera srcset responsive, y agrega
width/height para evitar layout shift (CLS).

## Naming convention

kebab-case siempre:
- club/beneficio-puntos.jpg
- club/beneficio-descuentos.jpg
- blog/alimentacion-natural-perros.jpg
- hero/banner-home.jpg
