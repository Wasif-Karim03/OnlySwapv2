import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function AuthLoadingScreen() {
  return (
    <>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <Text style={styles.title}>OnlySwap</Text>
        <ActivityIndicator size="large" color="#4caf50" style={styles.loader} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 32,
  },
  loader: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b6b6b',
  },
});