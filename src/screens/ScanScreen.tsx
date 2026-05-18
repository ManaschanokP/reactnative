import React, {useEffect, useRef, useState} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, StatusBar,
} from 'react-native';
import {
  Camera, useCameraDevice, useCameraPermission,
} from 'react-native-vision-camera';
import {
  useBarcodeScanner, CameraHighlights,
} from '@mgcrea/vision-camera-barcode-scanner';
import {Worklets} from 'react-native-worklets-core';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types/navigationTypes';
import {launchImageLibrary} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<RootStackParamList, 'Scan'>;

const {width, height} = Dimensions.get('window');
const FRAME_SIZE = width * 0.65;
const FRAME_TOP  = (height - FRAME_SIZE) / 2 - 40;

export default function ScanScreen({navigation}: Props) {
  const device         = useCameraDevice('back');
  const {hasPermission, requestPermission} = useCameraPermission();
  const isNavigating   = useRef(false);
  const [flash, setFlash] = useState<'off' | 'on'>('off');

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  const handleScanned = (value: string) => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    navigation.navigate('Tracking', {requestId: value});
    setTimeout(() => { isNavigating.current = false; }, 2000);
  };

  const handleScannedJS = Worklets.createRunOnJS(handleScanned);

  const {props: cameraProps, highlights} = useBarcodeScanner({
    fps: 5,
    barcodeTypes: ['qr', 'ean-13', 'code-128', 'code-39'],
    onBarcodeScanned: barcodes => {
      'worklet';
      const value = barcodes[0]?.value;
      if (value) handleScannedJS(value);
    },
  });

  // เปิด Gallery แล้ว scan barcode จากรูป
  const handleOpenGallery = () => {
    launchImageLibrary({mediaType: 'photo'}, response => {
      if (response.didCancel || response.errorCode) return;
      // react-native-vision-camera ไม่ scan จากไฟล์ได้ตรงๆ
      // แจ้ง user ให้ใส่ request ID เอง หรือใช้ library เพิ่มเติม
      const uri = response.assets?.[0]?.uri;
      if (uri) {
        // TODO: ถ้าต้องการ scan จากรูปจริงๆ ใช้ react-native-qrcode-scanner หรือ @zxing
        // ตอนนี้ navigate ไปหน้า Tracking พร้อม placeholder
        navigation.navigate('Tracking', {requestId: ''});
      }
    });
  };

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Icon name="camera-off" size={48} color="#fff" />
        <Text style={styles.text}>ไม่ได้รับสิทธิ์ใช้กล้อง</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>ขอสิทธิ์อีกครั้ง</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <Icon name="camera-off" size={48} color="#fff" />
        <Text style={styles.text}>ไม่พบกล้อง</Text>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Camera */}
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        torch={flash}
        {...cameraProps}
      />
      <CameraHighlights highlights={highlights} color="yellow" />

      {/* Dark overlay — top */}
      <View style={[styles.overlay, {top: 0, height: FRAME_TOP}]} />

      {/* Dark overlay — bottom */}
      <View style={[styles.overlay, {
        top: FRAME_TOP + FRAME_SIZE,
        bottom: 0,
      }]} />

      {/* Dark overlay — left */}
      <View style={[styles.overlay, {
        top: FRAME_TOP, height: FRAME_SIZE,
        left: 0, width: (width - FRAME_SIZE) / 2,
      }]} />

      {/* Dark overlay — right */}
      <View style={[styles.overlay, {
        top: FRAME_TOP, height: FRAME_SIZE,
        right: 0, width: (width - FRAME_SIZE) / 2,
      }]} />

      {/* Scan Frame */}
      <View style={[styles.frame, {
        top: FRAME_TOP, left: (width - FRAME_SIZE) / 2,
        width: FRAME_SIZE, height: FRAME_SIZE,
      }]}>
        {/* Corners */}
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />

        {/* Scan line */}
        <View style={styles.scanLine} />
      </View>

      {/* Label */}
      <Text style={[styles.scanLabel, {top: FRAME_TOP - 40}]}>
        วางบาร์โค้ดหรือ QR Code ในกรอบ
      </Text>

      {/* Bottom controls */}
      <View style={[styles.controls, {top: FRAME_TOP + FRAME_SIZE + 40}]}>
        {/* Flash */}
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => setFlash(f => f === 'off' ? 'on' : 'off')}
        >
          <Icon
            name={flash === 'on' ? 'flash' : 'flash-off'}
            size={28}
            color={flash === 'on' ? '#FFD700' : '#fff'}
          />
          <Text style={styles.controlLabel}>
            {flash === 'on' ? 'ปิดไฟ' : 'เปิดไฟ'}
          </Text>
        </TouchableOpacity>

        {/* Gallery */}
        <TouchableOpacity style={styles.controlBtn} onPress={handleOpenGallery}>
          <Icon name="image-multiple" size={28} color="#fff" />
          <Text style={styles.controlLabel}>อัลบั้ม</Text>
        </TouchableOpacity>
      </View>

      {/* Back button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-left" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const CORNER = 22;
const BORDER = 3;

const styles = StyleSheet.create({
  center: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', backgroundColor: '#000',
  },
  text: {color: '#fff', marginTop: 16, marginBottom: 16, fontSize: 15},
  permBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8,
  },
  permBtnText: {color: '#fff', fontWeight: 'bold'},

  overlay: {
    position: 'absolute', left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },

  frame: {
    position: 'absolute',
  },

  // Scan line
  scanLine: {
    position:        'absolute',
    top:             '50%',
    left:            8,
    right:           8,
    height:          2,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },

  // Corners
  corner: {
    position: 'absolute',
    width: CORNER, height: CORNER,
  },
  cornerTL: {
    top: 0, left: 0,
    borderTopWidth: BORDER, borderLeftWidth: BORDER,
    borderColor: '#fff', borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0, right: 0,
    borderTopWidth: BORDER, borderRightWidth: BORDER,
    borderColor: '#fff', borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0, left: 0,
    borderBottomWidth: BORDER, borderLeftWidth: BORDER,
    borderColor: '#fff', borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0, right: 0,
    borderBottomWidth: BORDER, borderRightWidth: BORDER,
    borderColor: '#fff', borderBottomRightRadius: 4,
  },

  scanLabel: {
    position:  'absolute',
    width:     '100%',
    textAlign: 'center',
    color:     '#fff',
    fontSize:  13,
  },

  controls: {
    position:       'absolute',
    left:           0,
    right:          0,
    flexDirection:  'row',
    justifyContent: 'center',
    gap:            60,
  },
  controlBtn: {
    alignItems: 'center',
    gap:        6,
  },
  controlLabel: {
    color:    '#fff',
    fontSize: 12,
  },

  backBtn: {
    position:        'absolute',
    top:             48,
    left:            16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius:    20,
    padding:         8,
  },
});