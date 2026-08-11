import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { POSScreen } from './src/screens/POSScreen';
import { StitchGalleryScreen } from './src/screens/StitchGalleryScreen';

export default function App() {
  const [showStitch, setShowStitch] = useState(true);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0B1326" />
      {showStitch ? (
        <StitchGalleryScreen onOpenPos={() => setShowStitch(false)} />
      ) : (
        <POSScreen />
      )}
    </SafeAreaProvider>
  );
}
