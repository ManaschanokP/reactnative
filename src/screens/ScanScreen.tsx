import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import {
  useBarcodeScanner,
  CameraHighlights,
} from '@mgcrea/vision-camera-barcode-scanner';
import { Worklets } from 'react-native-worklets-core';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigationTypes';

type Props = NativeStackScreenProps<RootStackParamList, 'Scan'>;

export default function ScanScreen({ navigation }: Props) {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const isNavigating = useRef(false);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const handleScanned = (value: string) => {
    if (isNavigating.current) return;
    isNavigating.current = true;

    navigation.navigate('Tracking', { requestId: value });

    setTimeout(() => {
      isNavigating.current = false;
    }, 2000);
  };

  // ✅ createRunOnJS — สร้าง bridge จาก worklet thread → JS thread
  const handleScannedJS = Worklets.createRunOnJS(handleScanned);

  const { props: cameraProps, highlights } = useBarcodeScanner({
    fps: 5,
    barcodeTypes: ['qr', 'ean-13', 'code-128'],
    onBarcodeScanned: barcodes => {
      'worklet';
      const value = barcodes[0]?.value;
      if (value) {
        handleScannedJS(value);
      }
    },
  });

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>กำลังขอ permission กล้อง...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>ไม่ได้รับสิทธิ์ใช้กล้อง</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>ขอสิทธิ์อีกครั้ง</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>ไม่พบกล้อง</Text>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        {...cameraProps}
      />
      <CameraHighlights highlights={highlights} color="yellow" />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  text: { color: '#fff', marginBottom: 16 },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontFamily: 'bold' },
});