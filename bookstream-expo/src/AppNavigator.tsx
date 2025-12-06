import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { Book } from './domain/models/Book';
import BookDetailsScreen from './screens/BookDetailsScreen';
import DiscoverScreen from './screens/DiscoverScreen';
import HomeScreen from './screens/HomeScreen';
import MyBooksScreen from './screens/MyBooksScreen';
// 1. Importe a WelcomeScreen
import WelcomeScreen from './screens/WelcomeScreen';

// 2. Adicione 'Welcome' na tipagem
export type RootStackParamList = {
  Welcome: undefined; 
  MainTabs: undefined;
  BookDetails: { book: Book };
};

export type TabParamList = {
  Discover: undefined;
  Search: undefined;
  MyBooks: undefined;
};

// TEMA GLOBAL (Creme e Terracota)
const THEME = {
  accent: '#C77D63',      // Terracota
  background: '#FAF9F6',  // Creme
  inactive: '#999999',
  tabBarBg: '#FFFFFF',
  headerTitle: '#2C2C2C',
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: THEME.accent, // Ícone ativo Terracota
        tabBarInactiveTintColor: THEME.inactive,
        tabBarStyle: {
          backgroundColor: THEME.tabBarBg,
          borderTopColor: '#E0D6CC',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Discover') iconName = focused ? 'compass' : 'compass-outline';
          else if (route.name === 'Search') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === 'MyBooks') iconName = focused ? 'library' : 'library-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Discover" component={DiscoverScreen} options={{ title: 'Início' }} />
      <Tab.Screen name="Search" component={HomeScreen} options={{ title: 'Buscar' }} />
      <Tab.Screen name="MyBooks" component={MyBooksScreen} options={{ title: 'Minha Estante' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        // 3. Define a Welcome como a primeira tela a abrir
        initialRouteName="Welcome"
        
        screenOptions={{
          // Estilo global do cabeçalho (para o BookDetails)
          headerStyle: { backgroundColor: THEME.background },
          headerTintColor: THEME.accent, // Seta de voltar Terracota
          headerTitleStyle: { fontWeight: 'bold', color: THEME.headerTitle },
          headerShadowVisible: false, // Remove linha divisória
        }}
      >
        
        {/* Tela de Boas-vindas (Sem cabeçalho) */}
        <Stack.Screen 
          name="Welcome" 
          component={WelcomeScreen} 
          options={{ headerShown: false }} 
        />

        <Stack.Screen 
          name="MainTabs" 
          component={MainTabs} 
          options={{ headerShown: false }} 
        />
        
        <Stack.Screen 
          name="BookDetails" 
          component={BookDetailsScreen} 
          options={{ title: '' }} // Título vazio fica mais elegante
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}