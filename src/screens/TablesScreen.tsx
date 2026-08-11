import React from 'react';
import { StitchPreviewScreen } from './StitchPreviewScreen';

export function TablesScreen() {
  return (
    <StitchPreviewScreen
      title="Mesas"
      subtitle="Gestión de Mesas · Stitch"
      image={require('../../assets/stitch/tables.jpg')}
    />
  );
}
