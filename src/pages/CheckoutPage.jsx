import React from 'react';

import CheckoutForm from '../components/checkout/CheckoutForm';
import useCartStore from '../store/cartStore';

export default function CheckoutPage() {
  const cart = useCartStore();

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="font-ui font-bold text-3xl text-gray-800 mb-8 text-center md:text-left">
        Finalizar Compra
      </h1>
      
      <CheckoutForm
        items={cart.items}
        subtotal={cart.subtotal}
        total={cart.total}
        couponCode={cart.couponCode}
        couponDiscount={cart.couponDiscount}
        applyCoupon={cart.applyCoupon}
        removeCoupon={cart.removeCoupon}
        clearCart={cart.clearCart}
      />
    </div>
  );
}
