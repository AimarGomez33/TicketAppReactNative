import React from 'react';
import { StitchPreviewScreen } from './StitchPreviewScreen';

export function PaymentScreen() {
  return (
    <StitchPreviewScreen
      title="Pago"
      subtitle="Flujo de Pago · Stitch"
      image={require('../../assets/stitch/payment.jpg')}
    />
  );
}
