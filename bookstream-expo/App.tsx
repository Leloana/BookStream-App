// App.tsx
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import AppNavigator from './src/AppNavigator';

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator />
    </>
  );
}
