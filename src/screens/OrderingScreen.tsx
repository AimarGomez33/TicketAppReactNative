import React from 'react';
import { StitchPreviewScreen } from './StitchPreviewScreen';

export function OrderingScreen() {
  return (
    <StitchPreviewScreen
      title="Comandas"
      subtitle="Ordering Screen · Stitch"
      image={require('../../assets/stitch/ordering.jpg')}
    />
  );
}
