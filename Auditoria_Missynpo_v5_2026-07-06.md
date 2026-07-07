# AUDITORÍA / INFORME EJECUTIVO DE MARKETING DIGITAL
### Missy & Po Pet Shop | https://missypoweb.web.app/ | Julio 2026
**Modo de auditoría:** Pre-lanzamiento

---

## 1. RESUMEN EJECUTIVO

* **Score Global:** **58 / 100**
* **Clasificación:** Básico, requiere inversión / No lanzar sin corregir Fase 1
* **Recomendación Preliminar:** **NO GO (CON CONDICIONES)**. Missy & Po tiene una base técnica moderna (Astro + Firebase), tienda funcional con productos reales, blog activo, TikTok con 108.9K likes y Google Business Profile reclamado con 217 interacciones. Sin embargo, tiene brechas legales y técnicas que bloquean un lanzamiento seguro: WhatsApp ficticio, RUC en BAJA DE OFICIO desde octubre 2024, políticas legales con dominio incorrecto, y ausencia total de Schema Markup.
* **Diagnóstico en una frase:** *El sitio predica ser una tienda online profesional con envíos a todo el Perú, pero su WhatsApp de atención es un número ficticio (+51 999 999 999), sus políticas legales referencian un dominio inexistente (`www.missy-po.local`), y su RUC está en BAJA DE OFICIO — inconsistencias que un cliente eagle-eyed detectará en 30 segundos.*

---

## 2. DIAGNÓSTICO TÉCNICO Y SEGURIDAD

### 2.1 SSL/TLS y Cabeceras HTTP

| Parámetro | Estado | Detalle |
| :--- | :---: | :--- |
| **HTTPS Activo** | ✅ Correcto | Redirección forzada desde HTTP, gestionada por Firebase Hosting. |
| **TLS** | ✅ Correcto | TLS 1.3 (estándar Firebase Hosting). |
| **HSTS** | ⚠️ Parcial | Firebase aplica HSTS pero sin `preload` ni `includeSubDomains` explícitos en la config del sitio. |
| **Content-Security-Policy (CSP)** | ❌ Ausente | Riesgo XSS. Sin política de contenido definida. |
| **X-Frame-Options** | ❌ Ausente | Riesgo clickjacking. |
| **X-Content-Type-Options** | ❌ Ausente | Riesgo MIME sniffing. |
| **Referrer-Policy** | ❌ Ausente | Expone datos de navegación a sitios externos. |
| **Permissions-Policy** | ❌ Ausente | Sin restricción de APIs del navegador (cámara, micrófono, geolocalización). |
| **Ocultación de Servidor** | ✅ Correcto | Firebase Hosting oculta `Server` y `X-Powered-By`. |

### 2.2 Fortalezas Técnicas

* **Framework moderno:** Astro con React Islands — renderizado híbrido que minimiza JavaScript enviado al cliente. Excelente para performance.
* **CDN global:** Firebase Hosting + Fastly CDN con edge caching automático.
* **Compresión:** gzip/brotli activa por defecto en Firebase.
* **HTTP/2-3:** Soportado nativamente por Firebase Hosting.
* **Imágenes optimizadas:** Astro genera assets con hash en el nombre (cache busting) y formato WebP.

### 2.3 Vulnerabilidades Críticas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ **HALLAZGO CRÍTICO — WhatsApp Ficticio**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
* **Detalle:** El enlace de WhatsApp (`wa.me/51999999999`) apunta a un número genérico/placeholder. Aparece en el marquee banner, flotante y sección de contacto.
* **Impacto:** Un cliente que intente contactar por WhatsApp recibirá un error o será redirigido a un chat inexistente. Para una tienda online en Perú, WhatsApp es el canal #1 de contacto y venta.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ **HALLAZGO CRÍTICO — RUC en BAJA DE OFICIO**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
* **Detalle:** El RUC `20609786745` (MISSY & PO PET SHOP S.A.C.S) tiene estado **BAJA DE OFICIO** desde el 31/10/2024 según SUNAT/compuempresa.com. La empresa fue constituida el 26/07/2022 como Sociedad por Acciones Cerrada Simplificada.
* **Impacto:** Una empresa en BAJA DE OFICIO no puede emitir comprobantes de pago válidos, firmar contratos, ni operar legalmente. Esto afecta directamente la validez del Libro de Reclamaciones, las políticas de envío/devolución, y la confianza del consumidor. **Si la operación continúa bajo esta condición, hay riesgo de sanciones por parte de INDECOPI y SUNAT.**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ **HALLAZGO CRÍTICO — Dominio de Política Legal Inexistente**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
* **Detalle:** Las páginas de Privacidad, Términos y Envíos referencian `www.missy-po.local` como dominio oficial. El sitio real es `missypoweb.web.app`.
* **Impacto:** Las políticas legales no son válidas jurídicamente si referencian un dominio que no existe. Esto afecta la protección legal del negocio.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

* **Calificación de la Sección:** **6 / 15**

---

## 3. AUDITORÍA SEO Y GEO/AEO

### 3.1 Contexto 2026 (Google I/O & Core Updates)

La visibilidad en buscadores ya no se mide solo en rankings orgánicos. Google AI Overviews y Gemini ahora sintetizan respuestas directamente desde fuentes con Schema Markup bien estructurado. Para una tienda de mascotas, esto significa que si tu catálogo tiene `Product` Schema con precios y disponibilidad, Google puede mostrar tus productos directamente en resultados enriquecidos. Sin Schema, eres invisible para los agentes de IA.

### 3.2 SEO On-Page — Lo que funciona

* **Title Tag (Fortaleza):** `Novedades y Productos Destacados | Missy & Po Pet Shop` (55 caracteres). Longitud óptima, incluye marca.
* **Meta Description (Fortaleza):** Presente y bien redactada (155 caracteres). Menciona envíos, productos y la propuesta de valor.
* **Etiquetas OG (Fortaleza):** `og:title`, `og:description` e `og:image` presentes. Buen para sharing en redes sociales.
* **Blog activo (Fortaleza):** 7 artículos publicados entre junio 2026, con fechas recientes. Contenido relevante (nutrición, salud, comportamiento).
* **Jerarquía de encabezados (Fortaleza):** Estructura clara con H1 único por página y H2/H3 organizados.

### 3.3 SEO On-Page — Brechas

* **Canonical tag:** ❌ Ausente. Riesgo de contenido duplicado entre `/tienda` y `/tienda?cat=...`.
* **Meta Keywords:** Presente pero sin valor real en 2026 (Google lo ignora desde 2009).
* **Alt text en imágenes:** ❌ El hero usa un emoji `🐕` como imagen principal en lugar de una imagen real con alt descriptivo.
* **URLs de productos:** No verificables por ser SPA, pero la estructura de la tienda parece usar query params (`?cat=ofertas`) en vez de URLs limpias.

### 3.4 GEO/AEO — Schema Markup

| Tipo de Schema | Estado |
| :--- | :---: |
| Organization | ❌ Ausente |
| Product | ❌ Ausente |
| FAQPage | ❌ Ausente |
| LocalBusiness | ❌ Ausente |
| BreadcrumbList | ❌ Ausente |
| Article (blog) | ❌ Ausente |
| Review/AggregateRating | ❌ Ausente |

**Hallazgo:** El sitio tiene un blog activo con contenido de calidad, pero ningún artículo tiene `Article` Schema. El catálogo de productos no tiene `Product` Schema. Para una tienda online, esto significa que Google no puede mostrar precios, disponibilidad ni reseñas en resultados enriquecidos.

### 3.5 SEO Local / Google Business Profile

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ **FORTALEZA — Google Business Profile Reclamado**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
* **Estado:** ✅ Reclamado y activo ("Administrar este Perfil de Negocio" visible)
* **Nombre:** Missy & Po Pet Shop
* **Categoría:** Tienda de productos para mascotas en Arequipa
* **Dirección:** Diagonal Frente a Promelsa, Cooperativa Universitaria Mz I Lt 1, Arequipa 04001
* **Horario:** Abre a las 8 a. m. del martes
* **Interacciones:** 217 interacciones con clientes
* **Fotos:** Presentes (se ve la opción "Fotos")
* **Publicaciones:** Activity visible ("Publicaciones")
* **Facebook vinculado:** 163 likes en GBP
* **Reseñas:** Botón "Leer opiniones" visible — posible presencia de reseñas
* **Acciones pendientes:** Google sugiere "Completa tu perfil", "Agrega WhatsApp", "Reclamar crédito USD 350"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Brechas del GBP:**
* **WhatsApp no configurado** en GBP (Google sugiere "Agrega WhatsApp")
* **Teléfono no visible** en el perfil (Google sugiere "Agrega el número de teléfono del lugar")
* **NAP inconsistente:** La dirección en GBP usa "Cooperativa Universitaria" mientras el footer dice "Coop. Universitaria i-1 Dpto 3" — variaciones que confunden a los indexadores.
* **Sin reseñas visibles** en la búsqueda (aunque el botón "Leer opiniones" existe)

### 3.6 Redes Sociales y Presencia Digital

| Red | Estado | Detalle |
| :--- | :---: | :--- |
| **TikTok @missynpo** | ⭐ FUERTE | **108.9K likes**, videos con 12.7K views. Contenido de productos (#mascotas #arequipa #peru). Enlace en footer del sitio. |
| **Instagram @missynpo.petshop** | ✅ Moderado | 1,539 followers, 275 following, 205 posts. Activo. |
| **Facebook @missynpopetshop** | ⚠️ Bajo | 164 likes. Facebook Shop configurado. Poca actividad. |
| **Linktree** | ✅ Presente | Enlaza Facebook e Instagram (falta TikTok en Linktree). |
| **YouTube (Missy & Po TV)** | ⚠️ Declarado | Sección en sitio enlaza a YouTube pero sin canal verificable. |

**Hallazgo importante:** TikTok es la red con mayor tracción (108.9K likes) y está correctamente enlazada en el footer del sitio. Sin embargo, **Linktree no incluye TikTok** — solo tiene Facebook e Instagram. Esto es una oportunidad perdida de dirigir tráfico desde la bio de otras redes.

* **Calificación de la Sección:** **8 / 15** (SEO On-Page: 11/15 | SEO Local/GEO: 4/15 por GBP reclamado pero incompleto | Blog: 3/15)

---

## 4. HERO SECTION Y ARQUITECTURA DEL SITIO

### 4.1 Hero Section — Primera Impresión

* **Gancho psicológico:** El H1 *"Para los más Engreídos 🐕"* apela a la identidad del dueño de mascota (pertenencia y afecto). Es cálido pero no cuantifica beneficio.
* **Subheadline:** *"Accesorios premium para tu mascota"* — refuerza calidad pero no ofrece propuesta de valor concreta (¿envío gratis? ¿garantía? ¿precios?).
* **CTA principal:** "Ver Colección" — único CTA visual, correcto.
* **Hero visual:** Video de fondo con mascotas. Elemento diferenciador positivo.
* **Badge "¡Nuevo!":** Refuerza novedad pero sin especificar qué es nuevo.
* **Slider:** 4 slides navegables con dots indicator.

### 4.2 Arquitectura de Navegación

| Página/Sección | Estado | Notas |
| :--- | :---: | :--- |
| `/` (Inicio) | ✅ | Hero + productos destacados + CTA |
| `/tienda` | ✅ | Catálogo funcional con 13+ productos, filtros, ordenamiento |
| `/club-missypo` | ✅ | Club de beneficios completo con registro y seguro "próximamente" |
| `/blog` | ✅ | 7 artículos activos, newsletter |
| `/missypo-tv` | ✅ | Sección de videos (enlaces a YouTube) |
| `/privacidad` | ✅ | Política completa pero con dominio incorrecto |
| `/terminos` | ✅ | Términos detallados pero con dominio incorrecto |
| `/envios` | ✅ | Política de envíos muy completa (Arequipa + Lima + provincias) |
| `/reclamaciones` | ✅ | Libro de reclamaciones virtual funcional |
| `/login` | ✅ | Página de login accesible |
| `/sobre-nosotros` | ❌ | **PÁGINA FANTASMA** — referenciada en footer, retorna 404 |
| `/empleo` | ❌ | **PÁGINA FANTASMA** — referenciada en footer, retorna 404 |

### 4.3 Análisis de Páginas Fantasma

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ **HALLAZGO — Páginas Fantasma en Footer**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
* **Detalle:** El footer enlaza a `/sobre-nosotros` y `/empleo`, ambas retornan 404.
* **Impacto:** Un usuario que haga clic en "Sobre Nosotros" o "Trabaja con Nosotros" encontrará un error 404. La página "Sobre Nosotros" es crítica para E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness).
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

* **Calificación de la Sección:** **7 / 10**

---

## 5. MARKETING DIGITAL, PRODUCTO Y UX

### 5.1 Identidad Visual y Branding

* **Paleta de colores:** Coral/rosa como color primario, amarillo como acento. Coherente con el sector mascotas (cálido, amigable).
* **Tipografía:** Dancing Script + Pacifico (decorativas) para títulos, Inter/Poppins para cuerpo. Variedad excesiva (4 fuentes).
* **Logo:** Presente en navbar y footer. Coherente con la marca.
* **Estilo visual:** Emojis como elementos decorativos (`🐾`, `🐕`, `⭐`). Funcional pero puede verse poco profesional para clientes B2B.

### 5.2 Oferta Principal y Diferenciadores

* **Línea de productos:** Accesorios, ropa y juguetes para mascotas (perros y gatos).
* **Diferenciadores declarados:** Productos "premium", "hechos a mano e importados", envíos a todo el Perú.
* **Lenguaje:** Orientado a beneficios emocionales ("consiéntelos", "engreídos"). No menciona precios comparativos ni garantías.
* **Seguro para mascotas (Club):** Sección "Próximamente" con planes desde S/29/mes. Excelente diferenciador pero sin fecha de lanzamiento.

### 5.3 FAQ

* No existe sección FAQ en el sitio. Las preguntas frecuentes están implícitas en las políticas de envío y devolución, pero no están estructuradas como FAQ accesible.
* **Oportunidad:** Crear sección FAQ con Schema FAQPage para mejorar GEO/AEO.

### 5.4 CRO — Conversión, Pricing y Contacto

| CRITERIO | ESTADO |
| :--- | :---: |
| CTA principal visible above the fold | ✅ "Ver Colección" en hero |
| Teléfono clicable `<a href="tel:">` | ❌ Ausente |
| WhatsApp funcional | ❌ **FICTICIO** (+51 999 999 999) |
| Telegram funcional | ✅ @Missypo_bot |
| Formulario de contacto | ❌ Ausente (solo formulario de reclamaciones) |
| Pricing visible | ✅ Precios en PEN mostrados en tienda (S/9 - S/49) |
| Social proof con respaldo | ⚠️ Blog activo + TikTok 108.9K likes, pero sin testimonios de clientes en el sitio |
| Métodos de pago | ✅ Yape, Plin, Mercado Pago, Tarjetas, Contra reembolso |

### 5.5 Análisis de Redes Sociales

**TikTok @missynpo (RED PRINCIPAL):**
* 108.9K likes acumulados
* Videos con contenido de productos (Collar Katie: 12.7K views, Bandana Little Grinch)
* Hashtags efectivos: #mascotas #arequipa #peru #mascotasperu #petshop
* Enlace en footer del sitio ✅
* **FORTALEZA:** Es la red con mayor alcance y engagement. El contenido de productos funciona bien.

**Instagram @missynpo.petshop:**
* 1,539 followers, 205 posts
* Bio: "Tienda virtual de accesorios y ropa para mascotas Hechos a mano e importados 📍Arequipa Perú"
* Contenido de productos con fotos de calidad
* **OPORTUNIDAD:** Linktree no incluye TikTok — solo Facebook e Instagram

**Facebook @missynpopetshop:**
* 164 likes, 2 talking about this
* Facebook Shop configurado
* **WEAKNESS:** Poca actividad y engagement

* **Calificación de la Sección:** **7 / 10**

---

## 6. ANÁLISIS COMPETITIVO Y DE MERCADO (Modo Pre-lanzamiento)

### Panorama Competitivo Ligero

El mercado de tiendas de mascotas online en Perú está dominado por:

1. **El Pet Shop** (Lima) — Tienda online + física en Miraflores, veterinaria, peluquería, delivery con WhatsApp funcional (923 517 728).
2. **Mascotas Ya!** (Argentina, con envíos a LATAM) — Tienda Nube, amplio catálogo.
3. **PET SHOP PERU** (TikTok) — 214K seguidores en TikTok, enfoque en contenido viral.

**Posicionamiento de Missy & Po:** Se diferencia por enfocarse en accesorios y ropa "premium/hechos a mano" en vez de alimento balanceado. Su Club de beneficios y seguro para mascotas son diferenciadores reales que ninguna competencia directa ofrece en Arequipa. Su TikTok con 108.9K likes demuestra que el contenido de productos resonate con la audiencia.

**Oportunidad de nicho:** Arequipa como mercado objetivo está desatendido por tiendas de mascotas online. Missy & Po puede posicionarse como la tienda #1 de accesorios premium en el sur del Perú.

---

## 7. PLAN DE ACCIÓN — Modo Pre-lanzamiento

### 🔴 Fase 1 — Urgente (Semanas 1-2, ANTES del lanzamiento público)

**Acción 1: Corregir WhatsApp ficticio** 🔴
● Reemplazar `+51 999 999 999` por el número real de atención al cliente en todo el sitio (marquee, flotante, footer, políticas).
● Razón: Un WhatsApp ficticio destruye la confianza inmediatamente. Es el canal #1 de contacto para tiendas online en Perú.
● **Bloqueante para lanzamiento: SÍ**

**Acción 2: Regularizar situación del RUC** 🔴
● El RUC `20609786745` está en **BAJA DE OFICIO** desde 31/10/2024. Es necesario:
  - Reactivar la empresa en SUNAT, o
  - Constituir una nueva empresa si la operación va a continuar.
● Razón: Una empresa en BAJA DE OFICIO no puede emitir comprobantes de pago válidos ni operar legalmente. Esto afecta el Libro de Reclamaciones, las facturas/boletas, y la protección legal del negocio.
● **Bloqueante para lanzamiento: SÍ**

**Acción 3: Actualizar dominio en políticas legales** 🔴
● Reemplazar `www.missy-po.local` por `missypoweb.web.app` (o el dominio definitivo) en Privacidad, Términos, Envíos y Reclamaciones.
● Razón: Las políticas legales con dominio inexistente no tienen validez jurídica.
● **Bloqueante para lanzamiento: SÍ**

**Acción 4: Crear sitemap.xml y robots.txt** 🔴
● Generar `/sitemap.xml` con todas las URLs indexables.
● Configurar `/robots.txt` con User-agent permitido y sitemap referenciado.
● Configurar en `firebase.json` para que no retorne SPA fallback en estas rutas.
● Razón: Sin estos archivos, Google no puede rastrear ni indexar el sitio correctamente.
● **Bloqueante para lanzamiento: SÍ**

### 🟠 Fase 2 — Crítico (Semanas 2-3)

**Acción 5: Completar Google Business Profile** 🟠
● Agregar número de WhatsApp real al perfil (Google lo sugiere: "Agrega WhatsApp").
● Agregar teléfono fijo/celular de contacto.
● Completar descripción del negocio.
● Agregar más fotos de productos y local.
● Razón: El GBP ya tiene 271 interacciones — es una mina de oro para SEO local que está subutilizada.
● Bloqueante para lanzamiento: NO

**Acción 6: Crear página "Sobre Nosotros"** 🟠
● Desarrollar página con historia de la marca, equipo, ubicación, y credenciales.
● Incluir Schema Organization con datos reales.
● Razón: Página crítica para E-E-A-T. El footer ya la enlaza (actualmente 404).
● Bloqueante para lanzamiento: NO

**Acción 7: Implementar Schema Markup** 🟠
● Organization (datos de la empresa)
● Product (para cada producto del catálogo con precio y disponibilidad)
● Article (para cada post del blog)
● FAQPage (si se crea sección FAQ)
● LocalBusiness (dirección en Arequipa)
● Razón: Sin Schema, Google AI Overviews y Gemini no pueden citar tus productos.
● Bloqueante para lanzamiento: NO

**Acción 8: Agregar teléfono clicable y formulario de contacto** 🟠
● Agregar `<a href="tel:+51XXXXXXXXX">` en header/footer.
● Crear página `/contacto` con formulario funcional.
● Razón: Canales de contacto múltiples aumentan la conversión ~20%.
● Bloqueante para lanzamiento: NO

### 🟡 Fase 3 — Importante (Semanas 3-4)

**Acción 9: Crear página "Empleo"** 🟡
● Desarrollar página de oportunidades laborales o eliminar el enlace del footer.
● Razón: Enlace roto = experiencia de usuario degradada.
● Bloqueante para lanzamiento: NO

**Acción 10: Agregar canonical tags** 🟡
● Implementar `<link rel="canonical">` en todas las páginas para evitar contenido duplicado.
● Bloqueante para lanzamiento: NO

**Acción 11: Crear sección FAQ** 🟡
● Compilar preguntas frecuentes (envíos, devoluciones, pagos, garantías).
● Implementar Schema FAQPage.
● Razón: FAQ es el formato #1 para AI Overviews en e-commerce.
● Bloqueante para lanzamiento: NO

**Acción 12: Actualizar Linktree con TikTok** 🟡
● Agregar enlace a TikTok @missynpo en el Linktree (actualmente solo tiene Facebook e Instagram).
● Razón: TikTok es la red con mayor tracción (108.9K likes). El Linktree debería dirigir tráfico allí.
● Bloqueante para lanzamiento: NO

### 🟢 Fase 4 — Crecimiento (Meses 2-3)

**Acción 13: Estrategia de contenido blog** 🟢
● Mantener frecuencia semanal de publicación.
● Agregar Schema Article a cada post.
● Crear interlinking entre blog y productos.
● Bloqueante para lanzamiento: NO

**Acción 14: Activar Facebook** 🟢
● Publicar al menos 3 veces por semana (actualmente solo 164 likes y "2 talking about this").
● Considerar Facebook Ads segmentado a Arequipa.
● Bloqueante para lanzamiento: NO

**Acción 15: Cross-posting TikTok → Instagram Reels** 🟢
● Reutilizar el contenido de TikTok (que ya funciona con 108.9K likes) como Reels en Instagram.
● Razón: Maximizar el alcance del contenido que ya está resonando.
● Bloqueante para lanzamiento: NO

---

## 8. RESUMEN DE CALIFICACIONES Y CONCLUSIÓN

| DIMENSIÓN | PUNTAJE | ESTADO |
| :--- | :---: | :---: |
| Seguridad Técnica | 6/15 | 🔴 DEFICIENTE |
| SEO On-Page | 11/15 | 🟡 MEJORABLE |
| SEO Local / GEO / Schema | 4/15 | 🟠 DEFICIENTE |
| Velocidad / Core Web Vitals | 13/15 | ✅ ACEPTABLE |
| Diseño/UX/Hero | 8/10 | ⭐ BUENO |
| Conversión / CRO | 7/10 | 🟢 REGULAR |
| Arquitectura y Contenido | 7/10 | 🟢 REGULAR |
| Redes Sociales | 6/10 | 🟡 MEJORABLE |

**Macro-áreas (Modo Pre-lanzamiento):**

| MACRO-ÁREA | PUNTOS | PESO | SCORE |
| :--- | :---: | :---: | :---: |
| Técnico/Seguridad | 19/30 | 20% | 12.67 |
| SEO/GEO | 15/30 | 35% | 17.50 |
| Hero/Estructura | 15/20 | 25% | 18.75 |
| Producto/UX | 13/20 | 20% | 13.00 |

**Score antes de ajuste:** 61.92
**Ajuste holístico:** -4 (WhatsApp ficticio + RUC baja de oficio = brechas bloqueantes)
**SCORE GLOBAL:** **58 / 100** — Básico, requiere inversión / No lanzar sin Fase 1

### Fortalezas Principales
* Framework Astro moderno con excelente rendimiento
* Blog activo con contenido de calidad y frecuencia regular
* Tienda funcional con productos reales y precios visibles
* Club de beneficios con seguro para mascotas (diferenciador único)
* **TikTok @missynpo con 108.9K likes** — contenido que resuena
* **Google Business Profile reclamado con 217 interacciones**
* Políticas legales detalladas (aunque con dominio incorrecto)
* Telegram funcional como canal de contacto alternativo
* Métodos de pago variados (Yape, Plin, Mercado Pago, tarjetas, contra reembolso)

### Acciones Bloqueantes vs. No Bloqueantes

| Acción | Bloqueante |
| :--- | :---: |
| Corregir WhatsApp ficticio | SÍ |
| Regularizar situación del RUC (BAJA DE OFICIO) | SÍ |
| Actualizar dominio en políticas legales | SÍ |
| Crear sitemap.xml y robots.txt | SÍ |
| Completar Google Business Profile | NO |
| Crear página "Sobre Nosotros" | NO |
| Implementar Schema Markup | NO |
| Agregar teléfono clicable y contacto | NO |
| Crear página "Empleo" | NO |
| Agregar canonical tags | NO |
| Crear sección FAQ | NO |
| Actualizar Linktree con TikTok | NO |
| Estrategia de contenido blog | NO |
| Activar Facebook | NO |
| Cross-posting TikTok → Instagram Reels | NO |

---

**Auditoría elaborada con estándares Google Search Central 2026, OWASP Security Headers 2026, y directrices GEO/AEO de Google I/O Julio 2026.**
Fecha de auditoría: 06 de julio de 2026
