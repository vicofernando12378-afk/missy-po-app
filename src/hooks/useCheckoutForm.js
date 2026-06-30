import { useState } from 'react'
import { validate, CheckoutSchema } from '../schemas'
import { AREQUIPA_DISTRICTS } from '../data/locations'

export default function useCheckoutForm() {
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail] = useState('')
  const [celular, setCelular] = useState('')
  const [nombreMascota, setNombreMascota] = useState('')

  // Dirección Estados
  const [departamento, setDepartamento] = useState('Arequipa')
  const [distritoArequipa, setDistritoArequipa] = useState(AREQUIPA_DISTRICTS[0])
  const [distritoNacional, setDistritoNacional] = useState('')
  const [direccion, setDireccion] = useState('')
  const [referencia, setReferencia] = useState('')

  // Comprobante Estados
  const [incluirImpuesto, setIncluirImpuesto] = useState(false)
  const [tipoDocumento, setTipoDocumento] = useState('DNI')
  const [numeroDocumento, setNumeroDocumento] = useState('')

  // Método de pago
  const [metodoPago, setMetodoPago] = useState('contraentrega')
  const [errorMsg, setErrorMsg] = useState('')

  const handleDocumentoChange = (e) => {
    const val = e.target.value.replace(/\D/g, '')
    if (tipoDocumento === 'DNI' && val.length <= 8) {
      setNumeroDocumento(val)
    } else if (tipoDocumento === 'RUC' && val.length <= 11) {
      setNumeroDocumento(val)
    } else if (tipoDocumento === 'PASAPORTE') {
      // Pasaporte puede ser alfanumérico
      setNumeroDocumento(e.target.value.trim().toUpperCase())
    }
  }

  const validateForm = () => {
    const payload = {
      nombre,
      apellido,
      email,
      celular,
      tipoDocumento,
      numeroDocumento,
      departamento,
      distritoArequipa,
      distritoNacional,
      direccion,
      referencia,
      nombreMascota,
      metodoPago
    }

    const validation = validate(CheckoutSchema, payload)
    if (!validation.ok) {
      setErrorMsg(validation.error)
      return false
    }
    setErrorMsg('')
    return true
  }

  return {
    nombre, setNombre,
    apellido, setApellido,
    email, setEmail,
    celular, setCelular,
    nombreMascota, setNombreMascota,
    departamento, setDepartamento,
    distritoArequipa, setDistritoArequipa,
    distritoNacional, setDistritoNacional,
    direccion, setDireccion,
    referencia, setReferencia,
    incluirImpuesto, setIncluirImpuesto,
    tipoDocumento, setTipoDocumento,
    numeroDocumento, setNumeroDocumento,
    metodoPago, setMetodoPago,
    errorMsg, setErrorMsg,
    handleDocumentoChange,
    validateForm
  }
}
