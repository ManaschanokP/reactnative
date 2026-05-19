import React, {useEffect, useRef, useState} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, StatusBar, Modal, TextInput, Alert,
  useWindowDimensions, PixelRatio,
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
import BarcodeScanning , {BarcodeFormat} from '@react-native-ml-kit/barcode-scanning';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicon from 'react-native-vector-icons/Ionicons'


type Props = NativeStackScreenProps<RootStackParamList, 'Scan'>;




export default function ScanScreen({navigation}: Props) {
  const {width, height, fontScale} = useWindowDimensions();
  const device         = useCameraDevice('back');
  const {hasPermission, requestPermission} = useCameraPermission();
  const isNavigating   = useRef(false);
  const [flash,        setFlash]        = useState<'off' | 'on'>('off');
  const [showManual,   setShowManual]   = useState(false);
  const [manualInput,  setManualInput]  = useState('');
  const [scanning,     setScanning]     = useState(false); // loading ขณะ scan รูป

  const FRAME_SIZE = width * 0.65;
  const FRAME_TOP  = (height - FRAME_SIZE) / 2 - height * 0.05;
  const ICON_SIZE  = Math.round(width * 0.07);  // ~28px บนจอ 400px
  const FONT_SM    = Math.round(width * 0.03);  // ~12px
  const FONT_MD    = Math.round(width * 0.04);  // ~16px
  const CORNER     = Math.round(width * 0.055); // ~22px
  const BORDER     = Math.round(PixelRatio.roundToNearestPixel(3));


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

  // ✅ เปิดอัลบั้ม + scan ด้วย ML Kit
  const handleOpenGallery = () => {
    launchImageLibrary({mediaType: 'photo'}, async response => {
      if (response.didCancel || response.errorCode) return;
      const uri = response.assets?.[0]?.uri;
      if (!uri) return;

       console.log('📸 uri:', uri);

      try {
        setScanning(true);
        console.log('🔍 scanning...');


        const barcodes = await BarcodeScanning.scan(uri, //{
          //barcodeFormats.ALL,
         // }
         );
       // console.log('BarcodeScanning:', Object.keys(BarcodeScanning));
         console.log('📦 barcodes:', JSON.stringify(barcodes)); // ✅ ดู result

        if (barcodes.length > 0) {
          const value = barcodes[0].value;
          console.log('✅ value:', value);

          if (value) {
            navigation.navigate('Tracking', {requestId: value});
          } else {
            Alert.alert('ไม่พบบาร์โค้ด', 'ไม่สามารถอ่านค่าจากบาร์โค้ดนี้ได้');
          }
        } else {
          Alert.alert('ไม่พบบาร์โค้ด', 'ไม่พบบาร์โค้ดในรูปที่เลือก\nลองถ่ายรูปให้ชัดขึ้นแล้วลองใหม่');
        }
      } catch (err) {
        console.error('❌ scan error:', err?.message, err); // ✅ ดู error จริง
        Alert.alert('ข้อผิดพลาด', 'ไม่สามารถอ่านบาร์โค้ดได้');
        console.error(err);
      } finally {
        setScanning(false);
      }
    });
  };

  const handleManualSearch = () => {
    if (!manualInput.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอก Request ID');
      return;
    }
    setShowManual(false);
    setManualInput('');
    navigation.navigate('Tracking', {requestId: manualInput.trim()});
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
        isActive={!showManual && !scanning}
        torch={flash}
        {...cameraProps}
      />
      <CameraHighlights highlights={highlights} color="yellow" />

      {/* Dark overlay — top */}
      <View style={[styles.overlay, {top: 0, height: FRAME_TOP}]} />

      {/* Dark overlay — bottom */}
      <View style={[styles.overlay, {top: FRAME_TOP + FRAME_SIZE, bottom: 0}]} />

      {/* Dark overlay — left */}
      <View style={[styles.overlaylr, {
        top: FRAME_TOP, height: FRAME_SIZE,
        left: 0, width: (width - FRAME_SIZE) / 2,
      }]} />

      {/* Dark overlay — right */}
      <View style={[styles.overlaylr, {
        top: FRAME_TOP, height: FRAME_SIZE,
        right: 0, width: (width - FRAME_SIZE) / 2,
      }]} />

      {/* Scan Frame */}
      <View style={[styles.frame, {
        top: FRAME_TOP, left: (width - FRAME_SIZE) / 2,
        width: FRAME_SIZE, height: FRAME_SIZE,
      }]}>
        <View style={[styles.corner, {width: CORNER, height: CORNER,
          top: 0, left: 0, borderTopWidth: BORDER, borderLeftWidth: BORDER,
          borderColor: '#fff', borderTopLeftRadius: 4}]} />
        <View style={[styles.corner, {width: CORNER, height: CORNER,
          top: 0, right: 0, borderTopWidth: BORDER, borderRightWidth: BORDER,
          borderColor: '#fff', borderTopRightRadius: 4}]} />
        <View style={[styles.corner, {width: CORNER, height: CORNER,
          bottom: 0, left: 0, borderBottomWidth: BORDER, borderLeftWidth: BORDER,
          borderColor: '#fff', borderBottomLeftRadius: 4}]} />
        <View style={[styles.corner, {width: CORNER, height: CORNER,
          bottom: 0, right: 0, borderBottomWidth: BORDER, borderRightWidth: BORDER,
          borderColor: '#fff', borderBottomRightRadius: 4}]} />
        <View style={styles.scanLine} />
      </View>

      {/* Label */}
      <Text style={[styles.scanLabel, {top: FRAME_TOP -  height * 0.05, fontSize: FONT_SM}]}>
        วางบาร์โค้ดหรือ QR Code ในกรอบ
      </Text>

      {/* Scanning overlay */}
      {scanning && (
        <View style={styles.scanningOverlay}>
          <Icon name="line-scan" size={40} color="#fff" />
          <Text style={styles.scanningText}>กำลังอ่านบาร์โค้ด...</Text>
        </View>
      )}

      {/* Bottom controls */}
      <View style={[styles.controls, {top: FRAME_TOP + FRAME_SIZE + height * 0.05}]}>
        {/* Flash button */}
          <TouchableOpacity style={styles.controlBtn}
            onPress={() => setFlash(f => f === 'off' ? 'on' : 'off')}>
            {flash === 'on'
              ? <Ionicon   name="flash" size={ICON_SIZE + 8} color="#fff" />
              : <Ionicon name="flash-off-outline" size={ICON_SIZE + 8} color="#fff"/>}
          </TouchableOpacity>

          {/* Gallery button */}
          <TouchableOpacity style={styles.controlBtn}
            onPress={handleOpenGallery} disabled={scanning}>
            <MaterialIcons name="image"
              size={ICON_SIZE + 10}
              color="#fff"
              opacity={scanning ? 0.4 : 1}
            />
          </TouchableOpacity>
      </View>

      {/* Back button */}
      <TouchableOpacity
        style={[styles.backBtn, {top: height * 0.06, padding: width * 0.02}]}
        onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" size={ICON_SIZE} color="#fff" />
      </TouchableOpacity>

      {/* Manual Input Modal */}
      <Modal transparent visible={showManual} animationType="slide">
        <View style={styles.manualOverlay}>
          <View style={styles.manualBox}>
            
              <TouchableOpacity onPress={() => {
                setShowManual(false);
                setManualInput('');
              }}>
                <Icon name="close" size={22} color="#999" />
              </TouchableOpacity>
            

            <TextInput
              style={styles.manualInput}
              value={manualInput}
              onChangeText={setManualInput}
              placeholder="เช่น DV-26-09233"
              placeholderTextColor="#bbb"
              autoFocus
              autoCapitalize="characters"
              returnKeyType="search"
              onSubmitEditing={handleManualSearch}
            />

            <View style={styles.manualButtons}>
              <TouchableOpacity
                style={styles.manualCancel}
                onPress={() => {
                  setShowManual(false);
                  setManualInput('');
                }}
              >
                <Text style={styles.manualCancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.manualConfirm}
                onPress={handleManualSearch}
              >
                <Icon name="magnify" size={18} color="#fff" />
                <Text style={styles.manualConfirmText}> ค้นหา</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  text:        {color: '#fff', marginTop: 16, marginBottom: 16, fontSize: 15},
  permBtn:     {backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8},
  permBtnText: {color: '#fff', fontWeight: 'bold'},

  overlay: {
    position: 'absolute',  
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlaylr: {
    position: 'absolute',  
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  
  frame: {position: 'absolute'},

  scanLine: {
    position: 'absolute', top: '50%',
    left: 8, right: 8, height: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },

  corner:   {position: 'absolute', width: CORNER, height: CORNER},
  
  scanLabel: {
    position: 'absolute', width: '100%',
    textAlign: 'center', color: '#fff', fontSize: 13,
  },

  // Scanning loading overlay
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  scanningText: {color: '#fff', fontSize: 16, fontWeight: 'bold'},

  controls: {
    position: 'absolute',
    left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',  // จาก center → space-between
    paddingVertical: 84,
    paddingHorizontal: 30,            // เพิ่ม padding ขอบ
  },
  controlBtn:   {
    alignItems: 'center', 
    
    gap: 0, top: 48, left: 0,
    
    borderRadius: 20,
  },
  controlLabel: {color: '#fff', fontSize: 12},

  backBtn: {
    position: 'absolute', top: 48, left: 16,
   
    borderRadius: 20, padding: 8,
  },

  // Manual Modal
  manualOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  manualBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40,
  },
  manualHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  manualTitle:       {fontSize: 16, fontWeight: 'bold', color: '#333'},
  manualInput: {
    borderWidth: 1, borderColor: '#ddd',
    borderRadius: 10, padding: 14,
    fontSize: 15, color: '#333',
    marginBottom: 16, letterSpacing: 1,
  },
  manualButtons:     {flexDirection: 'row', gap: 12},
  manualCancel: {
    flex: 1, padding: 14, borderRadius: 10,
    borderWidth: 1, borderColor: '#ccc', alignItems: 'center',
  },
  manualCancelText:  {color: '#666', fontWeight: 'bold'},
  manualConfirm: {
    flex: 2, padding: 14, borderRadius: 10,
    backgroundColor: '#a7cc43',
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
  },
  manualConfirmText: {color: '#fff', fontWeight: 'bold', fontSize: 15},
});
