import { useState, useEffect, useRef } from 'react'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../../services/firebase'
import { crearProducto, actualizarProducto } from '../../services'
import { validate, ProductSchema } from '../../schemas'



// ============================================================
// PRODUCTO FORM MODAL — Crear / Editar Producto
// Missy & Po Pet Shop | Admin
// ============================================================

const CATEGORIAS = [
  'Arneses', 'Ropa', 'Accesorios', 'Collares', 'Correas',
  'Juguetes', 'Camas', 'Alimentación', 'Higiene', 'Otros'
]

const productoVacio = {
  nombre: '',
  slug: '',
  sku: '',
  descripcion: '',
  precio_compra: '',
  precio_regular: '',
  precio_oferta: '',
  categorias: [],
  stock: '',
  activo: true,
  imagenes: [],
  variantes: [],
  tags_busqueda: [],
}

// Genera slug desde nombre
function generarSlug(nombre) {
  return nombre
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export default function ProductoFormModal({ producto = null, onClose, onSaved }) {
  const isEditing = !!producto
  const [form, setForm] = useState(
    producto
      ? {
          ...productoVacio,
          ...producto,
          precio_compra: producto.precio_compra ? parseFloat(producto.precio_compra).toFixed(2) : '',
          precio_regular: producto.precio_regular ? parseFloat(producto.precio_regular).toFixed(2) : '',
          precio_oferta: producto.precio_oferta ? parseFloat(producto.precio_oferta).toFixed(2) : '',
          stock: producto.stock ?? '',
          imagenes: producto.imagenes || [],
          variantes: producto.variantes || [],
        }
      : { ...productoVacio }
  )

  const [imagenFiles, setImagenFiles] = useState([]) // { file, preview }
  const [uploadProgress, setUploadProgress] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('info') // 'info' | 'imagenes' | 'variantes'
  const fileInputRef = useRef()

  // Variante template vacía
  const varianteVacia = { sku: '', atributos: { talla: '' }, precio_unitario: '', stock: '' }

  const setField = (campo, valor) => setForm(f => ({ ...f, [campo]: valor }))

  const handleNombreChange = (val) => {
    setField('nombre', val)
    if (!isEditing || !form.slug) {
      setField('slug', generarSlug(val))
    }
  }

  // ── Imágenes ────────────────────────────────────────────────
  const handleImagenesChange = (e) => {
    const files = Array.from(e.target.files)
    const total = form.imagenes.length + imagenFiles.length + files.length
    if (total > 5) {
      setError('Máximo 5 imágenes por producto.')
      return
    }
    const nuevas = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      nombre: file.name,
    }))
    setImagenFiles(prev => [...prev, ...nuevas])
    setError('')
  }

  const eliminarImagenExistente = (idx) => {
    setForm(f => ({ ...f, imagenes: f.imagenes.filter((_, i) => i !== idx) }))
  }

  const eliminarImagenNueva = (idx) => {
    setImagenFiles(prev => prev.filter((_, i) => i !== idx))
  }

  // ── Variantes ──────────────────────────────────────────────
  const agregarVariante = () => {
    setForm(f => ({ ...f, variantes: [...f.variantes, { ...varianteVacia }] }))
  }

  const eliminarVariante = (idx) => {
    setForm(f => ({ ...f, variantes: f.variantes.filter((_, i) => i !== idx) }))
  }

  const setVarianteCampo = (idx, campo, valor) => {
    setForm(f => {
      const vars = [...f.variantes]
      if (campo.startsWith('attr_')) {
        const attrKey = campo.replace('attr_', '')
        vars[idx] = { ...vars[idx], atributos: { ...vars[idx].atributos, [attrKey]: valor } }
      } else {
        vars[idx] = { ...vars[idx], [campo]: valor }
      }
      return { ...f, variantes: vars }
    })
  }

  // ── Upload de imágenes a Firebase Storage ──────────────────
  const subirImagenes = async (productoId) => {
    const urls = [...form.imagenes] // URLs ya existentes
    for (let i = 0; i < imagenFiles.length; i++) {
      const { file } = imagenFiles[i]
      const ext = file.name.split('.').pop()
      const storageRef = ref(storage, `myp/productos/${form.sku || productoId}/${Date.now()}_${i}.${ext}`)
      await new Promise((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, file)
        task.on(
          'state_changed',
          (snap) => {
            const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
            setUploadProgress(prev => ({ ...prev, [i]: pct }))
          },
          reject,
          async () => {
            const url = await getDownloadURL(task.snapshot.ref)
            urls.push(url)
            resolve()
          }
        )
      })
    }
    return urls
  }

  // ── SUBMIT ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const stockFinalEstimado = form.variantes.length > 0
      ? form.variantes.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0)
      : form.stock === '' ? 0 : parseInt(form.stock)

    // Pre-validar con Zod antes de subir imágenes
    const payloadParaValidar = {
      nombre: form.nombre.trim(),
      slug: form.slug.trim() || generarSlug(form.nombre),
      sku: form.sku.trim().toUpperCase(),
      descripcion: form.descripcion.trim(),
      precio_compra: form.precio_compra === '' ? undefined : parseFloat(form.precio_compra),
      precio_regular: form.precio_regular === '' ? undefined : parseFloat(form.precio_regular),
      precio_oferta: form.precio_oferta ? parseFloat(form.precio_oferta) : null,
      categorias: form.categorias,
      stock: stockFinalEstimado,
      activo: form.activo,
      imagenes: form.imagenes.length > 0 || imagenFiles.length > 0 
        ? (form.imagenes.length > 0 ? form.imagenes : ['https://placeholder-storage.missypo.com/temp.jpg'])
        : [],
      variantes: form.variantes.map(v => ({
        ...v,
        precio_unitario: v.precio_unitario ? parseFloat(v.precio_unitario) : null,
        stock: parseInt(v.stock) || 0
      })),
      tags_busqueda: []
    }

    const validation = validate(ProductSchema, payloadParaValidar)
    if (!validation.ok) {
      setError(validation.error)
      return
    }

    setIsLoading(true)
    try {
      // 1. Determinar ID para la ruta de Storage
      const tempId = isEditing ? producto.id : `${form.sku}-${Date.now()}`

      // 2. Subir imágenes nuevas
      const imagenesFinales = await subirImagenes(tempId)

      // 3. Preparar tags de búsqueda
      const tags = [
        ...form.nombre.toLowerCase().split(/\s+/),
        form.sku.toLowerCase(),
        ...(form.categorias || []).map(c => c.toLowerCase()),
      ].filter(Boolean)

      // 4. Calcular stock total de variantes definitivo
      const tieneVariantes = form.variantes.length > 0
      const stockFinal = tieneVariantes
        ? form.variantes.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0)
        : parseInt(form.stock) || 0

      // 5. Preparar variantes
      const variantesFinales = form.variantes.map(v => ({
        ...v,
        precio_unitario: v.precio_unitario ? parseFloat(v.precio_unitario) : null,
        stock: parseInt(v.stock) || 0,
      }))

      const datos = {
        nombre: form.nombre.trim(),
        slug: form.slug.trim() || generarSlug(form.nombre),
        sku: form.sku.trim().toUpperCase(),
        descripcion: form.descripcion.trim(),
        precio_compra: parseFloat(form.precio_compra),
        precio_regular: parseFloat(form.precio_regular),
        precio_oferta: form.precio_oferta ? parseFloat(form.precio_oferta) : null,
        categorias: form.categorias,
        stock: stockFinal,
        activo: form.activo,
        imagenes: imagenesFinales,
        variantes: variantesFinales,
        tags_busqueda: [...new Set(tags)],
      }

      if (isEditing) {
        await actualizarProducto(producto.id, datos)
      } else {
        await crearProducto(datos)
      }

      onSaved()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Error al guardar el producto.')
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'info', label: '📋 Información' },
    { id: 'imagenes', label: `🖼️ Imágenes (${form.imagenes.length + imagenFiles.length})` },
    { id: 'variantes', label: `🎨 Variantes (${form.variantes.length})` },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[95vh] flex flex-col shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-brand text-xl text-gray-850">
              {isEditing ? `Editar: ${producto.nombre}` : 'Nuevo Producto'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEditing ? `ID: ${producto.id}` : 'Completa todos los campos requeridos (*)'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 shrink-0 px-2 pt-2 gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-t-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-coral/10 text-coral border-b-2 border-coral'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">

            {/* ── TAB: INFORMACIÓN ── */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Nombre *</label>
                    <input
                      type="text"
                      value={form.nombre}
                      onChange={e => handleNombreChange(e.target.value)}
                      placeholder="Ej: Arnés Lou"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-coral bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">SKU * (único)</label>
                    <input
                      type="text"
                      value={form.sku}
                      onChange={e => setField('sku', e.target.value.toUpperCase())}
                      placeholder="Ej: AL1"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-coral bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Slug (URL amigable)</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={e => setField('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="Ej: arnes-lou"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-coral bg-white text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Descripción</label>
                  <textarea
                    value={form.descripcion}
                    onChange={e => setField('descripcion', e.target.value)}
                    rows={3}
                    placeholder="Describe el producto, materiales, beneficios..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-coral bg-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Precio de Compra (S/) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">S/</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.precio_compra}
                        onChange={e => setField('precio_compra', e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-coral bg-white"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Precio Regular (S/) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">S/</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.precio_regular}
                        onChange={e => setField('precio_regular', e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-coral bg-white"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Precio Oferta (S/)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">S/</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.precio_oferta}
                        onChange={e => setField('precio_oferta', e.target.value)}
                        placeholder="Opcional"
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-coral bg-white"
                      />
                    </div>
                  </div>
                </div>

                {form.variantes.length === 0 && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Stock General</label>
                    <input
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={e => setField('stock', e.target.value)}
                      placeholder="0"
                      className="w-28 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-coral bg-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">Si el producto tiene variantes, el stock se calcula automáticamente.</p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Categorías</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIAS.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          const curr = form.categorias || []
                          setField('categorias', curr.includes(cat)
                            ? curr.filter(c => c !== cat)
                            : [...curr, cat]
                          )
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          (form.categorias || []).includes(cat)
                            ? 'bg-coral text-white border-coral shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-coral/50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={form.activo}
                      onChange={e => setField('activo', e.target.checked)}
                    />
                    <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-coral peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                  </label>
                  <span className="text-sm font-semibold text-gray-700">
                    {form.activo ? '✅ Producto activo (visible en tienda)' : '⏸️ Producto inactivo (oculto)'}
                  </span>
                </div>
              </div>
            )}

            {/* ── TAB: IMÁGENES ── */}
            {activeTab === 'imagenes' && (
              <div className="space-y-4">
                <p className="text-xs text-gray-500">Sube hasta 5 imágenes. La primera será la imagen principal del producto.</p>

                {/* Grid de imágenes actuales */}
                <div className="grid grid-cols-3 gap-3">
                  {form.imagenes.map((url, idx) => (
                    <div key={`existing-${idx}`} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <span className="absolute top-1 left-1 bg-coral text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Principal</span>
                      )}
                      <button
                        type="button"
                        onClick={() => eliminarImagenExistente(idx)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                      >✕</button>
                    </div>
                  ))}

                  {imagenFiles.map((img, idx) => (
                    <div key={`new-${idx}`} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-dashed border-coral/40 bg-coral/5">
                      <img src={img.preview} alt="" className="w-full h-full object-cover" />
                      {uploadProgress[idx] !== undefined && uploadProgress[idx] < 100 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{uploadProgress[idx]}%</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => eliminarImagenNueva(idx)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                      >✕</button>
                      <span className="absolute bottom-1 left-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Nuevo</span>
                    </div>
                  ))}

                  {(form.imagenes.length + imagenFiles.length) < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 hover:border-coral/50 hover:bg-coral/5 transition-all text-gray-400 hover:text-coral"
                    >
                      <span className="text-2xl">+</span>
                      <span className="text-[10px] font-semibold">Agregar</span>
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagenesChange}
                  className="hidden"
                />

                <p className="text-[11px] text-gray-400">
                  Formatos: JPG, PNG, WEBP. Tamaño recomendado: 800×800px. Máx 3MB por imagen.
                </p>
              </div>
            )}

            {/* ── TAB: VARIANTES ── */}
            {activeTab === 'variantes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Variantes del producto</p>
                    <p className="text-xs text-gray-400">Tallas, colores u otras diferencias. El stock se sumará automáticamente.</p>
                  </div>
                  <button
                    type="button"
                    onClick={agregarVariante}
                    className="px-4 py-2 bg-coral text-white rounded-xl text-xs font-bold hover:bg-coral-dark transition-all shadow-sm"
                  >
                    + Agregar variante
                  </button>
                </div>

                {form.variantes.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <span className="text-3xl block mb-2">🎨</span>
                    <p className="text-gray-500 text-sm">Sin variantes — producto de talla/color único</p>
                    <p className="text-gray-400 text-xs mt-1">Usa el stock general en la pestaña Información</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {form.variantes.map((v, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Variante {idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => eliminarVariante(idx)}
                            className="text-rose-500 hover:text-rose-700 text-xs font-semibold"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 mb-1">SKU Variante</label>
                            <input
                              type="text"
                              value={v.sku}
                              onChange={e => setVarianteCampo(idx, 'sku', e.target.value.toUpperCase())}
                              placeholder="AL1-S"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono bg-white focus:outline-none focus:border-coral"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 mb-1">Talla / Color</label>
                            <input
                              type="text"
                              value={v.atributos?.talla || v.atributos?.color || ''}
                              onChange={e => setVarianteCampo(idx, 'attr_talla', e.target.value)}
                              placeholder="S / Rojo"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:border-coral"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 mb-1">Stock</label>
                            <input
                              type="number"
                              min="0"
                              value={v.stock}
                              onChange={e => setVarianteCampo(idx, 'stock', e.target.value)}
                              placeholder="0"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:border-coral"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 mb-1">Precio (S/) opcional</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={v.precio_unitario}
                              onChange={e => setVarianteCampo(idx, 'precio_unitario', e.target.value)}
                              placeholder="Heredado"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:border-coral"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="p-3 bg-indigo-50 rounded-xl text-xs text-indigo-700 font-semibold">
                      Stock total calculado: {form.variantes.reduce((s, v) => s + (parseInt(v.stock) || 0), 0)} unidades
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error general */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700">
                ⚠️ {error}
              </div>
            )}
          </div>
        </form>

        {/* Footer acciones */}
        <div className="flex gap-3 px-6 py-5 border-t border-gray-100 shrink-0 bg-gray-50/50 rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-2xl text-sm font-semibold hover:bg-white transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="producto-form"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 py-3 bg-coral text-white rounded-2xl text-sm font-bold shadow-md shadow-coral/20 hover:bg-coral-dark disabled:bg-gray-300 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {imagenFiles.length > 0 ? 'Subiendo imágenes...' : 'Guardando...'}
              </>
            ) : (
              isEditing ? '💾 Guardar Cambios' : '✨ Crear Producto'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
