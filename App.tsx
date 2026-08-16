import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StitchGalleryScreen } from './src/screens/StitchGalleryScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#fff8f8" />
      <StitchGalleryScreen />
    </SafeAreaProvider>
  );
}
