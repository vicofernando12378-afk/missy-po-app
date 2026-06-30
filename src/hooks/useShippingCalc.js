import { useState, useEffect } from 'react';

import { obtenerConfiguracionEnvio } from '../services';

export default function useShippingCalc(departamento, totalWithDiscountsSoles) {
  const [shippingConfig, setShippingConfig] = useState({
    arequipaFreeLimit: 30,
    nationalFreeLimit: 100,
    arequipaFee: 10,
    nationalFee: 15,
  });

  // Cargar configuración de envío
  useEffect(() => {
    obtenerConfiguracionEnvio().then(setShippingConfig);
  }, []);

  const isArequipa = departamento === 'Arequipa';

  const getCostoEnvio = () => {
    if (isArequipa) {
      return totalWithDiscountsSoles >= shippingConfig.arequipaFreeLimit ? 0 : shippingConfig.arequipaFee;
    } else {
      return totalWithDiscountsSoles >= shippingConfig.nationalFreeLimit ? 0 : shippingConfig.nationalFee;
    }
  };

  const costoEnvio = getCostoEnvio();

  return {
    shippingConfig,
    costoEnvio,
    isArequipa,
  };
}
