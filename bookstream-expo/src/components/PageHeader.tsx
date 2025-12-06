import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

interface Props {
  title: string;
  subtitle?: string;
}

const THEME = {
  textDark: '#2C2C2C',
  textLight: '#666666',
};

export default function PageHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 50, 
    paddingBottom: 10,
  },
  title: {
    fontSize: 34, 
    fontWeight: '800',
    color: THEME.textDark,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: -0.5, 
  },
  subtitle: {
    fontSize: 15,
    color: THEME.textLight,
    marginTop: 6,
    fontStyle: 'italic', 
    lineHeight: 20,
  },
});