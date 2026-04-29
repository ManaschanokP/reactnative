import React, {useEffect} from 'react';
import {View, Text, StyleSheet, Alert, TouchableOpacity} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import {
  useBarcodeScanner,
  CameraHighlights,
} from '@mgcrea/vision-camera-barcode-scanner';

export default function ScanScreen() {
  const device = useCameraDevice('back');
  const {hasPermission, requestPermission} = useCameraPermission();

  useEffect(() => {
    if (!hasPermission) {
    requestPermission();
  }
}, [hasPermission, requestPermission]); //

  const {props: cameraProps, highlights} = useBarcodeScanner({
    fps: 5,
    barcodeTypes: ['qr', 'ean-13', 'code-128'],
    onBarcodeScanned: barcodes => {
      'worklet';
      const value = barcodes[0]?.value;
      if (value) {
        Alert.alert('สแกนได้แล้ว!', value);
      }
    },
  });

  // กำลังรอผล permission
  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <Text>กำลังขอ permission กล้อง...</Text>
      </View>
    );
  }

  // ไม่ได้รับ permission
  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>ไม่ได้รับสิทธิ์ใช้กล้อง</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>ขอสิทธิ์อีกครั้ง</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ไม่พบกล้อง
  if (device == null) {
    return (
      <View style={styles.center}>
        <Text>ไม่พบกล้อง</Text>
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
  text: {
    color: '#fff',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
