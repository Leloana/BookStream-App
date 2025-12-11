import React from 'react';
import { render, waitFor, screen } from '@testing-library/react-native';
import App from './App';

// --- MOCKS ---

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));


jest.mock('./src/AppNavigator', () => {
  const { View, Text } = require('react-native');
  return function DummyNavigator() {
    return (
      <View testID="mock-navigator">
        <Text>Navegação Carregada</Text>
      </View>
    );
  };
});

describe('<App />', () => {
  it('deve renderizar a tela inicial sem erros', async () => {
    const { toJSON } = render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Navegação Carregada')).toBeTruthy();

      expect(toJSON()).not.toBeNull();
    });
  });
});