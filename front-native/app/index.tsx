import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function WelcomeScreen() {
  return (
    <LinearGradient
      colors={['#002861', '#050B16']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <MaterialCommunityIcons name="shield-outline" size={56} color="#E7F1FF" />
            </View>
            <Text style={styles.title}>CiviSafe</Text>
            <Text style={styles.subtitle}>Bezpieczne Raporty Obywatelskie</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity activeOpacity={0.85} style={[styles.button, styles.primaryButton]}>
              <View style={styles.primaryButtonInner}>
                <View style={styles.flagBadge}>
                  <Text style={styles.flagInitials}>PL</Text>
                </View>
                <Text style={styles.primaryButtonText}>mObywatel</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} style={[styles.button, styles.secondaryButton]}>
              <Text style={styles.secondaryButtonText}>numer telefonu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 48,
  },
  logoContainer: {
    alignItems: 'center',
    gap: 20,
  },
  logoBackground: {
    backgroundColor: 'rgba(24, 48, 96, 0.7)',
    width: 120,
    height: 120,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#F8FBFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#C6D4E5',
  },
  actions: {
    width: '100%',
    gap: 16,
  },
  button: {
    borderRadius: 18,
    height: 56,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: 'rgba(3, 31, 78, 0.9)',
  },
  primaryButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  flagBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#D71920',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F5F7FF',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F5F8FF',
  },
  secondaryButton: {
    backgroundColor: '#F0F3FA',
  },
  secondaryButtonText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#0F1C2E',
  },
});
