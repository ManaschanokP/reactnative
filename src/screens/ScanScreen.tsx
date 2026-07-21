import React, {useEffect, useRef, useState, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  useWindowDimensions,
  PixelRatio,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import {
  useBarcodeScanner,
  CameraHighlights,
} from '@mgcrea/vision-camera-barcode-scanner';
import {Worklets} from 'react-native-worklets-core';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types/navigationTypes';
import {launchImageLibrary} from 'react-native-image-picker';
import BarcodeScanning from '@react-native-ml-kit/barcode-scanning';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicon from 'react-native-vector-icons/Ionicons';
import {AuthContext} from '../context/AuthProvider';
import {getBaseUrlByCompany, API_ENDPOINTS} from '../config/apiConfig';

type Props = NativeStackScreenProps<RootStackParamList, 'Scan'>;

export default function ScanScreen({navigation}: Props) {
  const {width, height} = useWindowDimensions();
  const device = useCameraDevice('back');
  const {hasPermission, requestPermission} = useCameraPermission();
  const isNavigating = useRef(false);
  const {companyColor, user} = useContext(AuthContext)!;
  const userRef = useRef(user);
  const [isCameraActive, setIsCameraActive] = useState(true);

  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [showManual, setShowManual] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [showNotFound, setShowNotFound] = useState(false);

  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    color?: string;
  }>({visible: false, title: '', message: '', color: '#F5A800'});

  const showAlertModal = (
    title: string,
    message: string,
    color = '#F5A800',
  ) => {
    setAlertModal({visible: true, title, message, color});
  };

  //  function validate
  const isValidRequestId = (value: string): boolean => {
    return /^[A-Z]{2}-\d{2}-\d{5}$/.test(value.trim());
  };

  // ── Responsive values ──
  const FRAME_SIZE = Math.min(width, height) * 0.62;
  const FRAME_TOP = (height - FRAME_SIZE) / 2 - height * 0.04;
  const ICON_SIZE = Math.round(width * 0.07);
  const ICON_BTN = Math.round(width * 0.085);
  const FONT_SM = Math.round(width * 0.032);
  const CORNER = Math.round(width * 0.055);
  const BORDER = Math.round(PixelRatio.roundToNearestPixel(3));
  const BACK_SIZE = Math.round(width * 0.09);
  const CTRL_BOTTOM = height * 0.14;
  const SIDE_PAD = width * 0.08;

  console.log('🔍 ScanScreen render, user:', JSON.stringify(user));

  useEffect(() => {
    userRef.current = user;
    console.log('🔍 user updated in ref:', user?.status);
  }, [user]);

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  console.log('user in ScanScreen:', user);

  useFocusEffect(
    React.useCallback(() => {
      setIsCameraActive(true);
      return () => {
        setIsCameraActive(false);
      };
    }, []),
  );

  const fetchJobDetail = async (requestId: string) => {
    try {
      const baseUrl = await getBaseUrlByCompany();
      const url = `${baseUrl}${API_ENDPOINTS.GET_STATUS_NOW}`;
      const formData = new FormData();
      formData.append('request_id', requestId);
      const res = await fetch(url, {method: 'POST', body: formData});
      const obj = await res.json();

      console.log('📦 GET_STATUS_NOW response:', JSON.stringify(obj));

      if (!obj.error && obj.StatusNow && obj.StatusNow.length > 0) {
        const job = obj.StatusNow[0];
        return {
          request_id: job.request_id,
          status_id: job.status_id,
          status_name: job.status_name,
          type_name: job.type_name,
          to_company: job.to_company,
          d_date: job.d_date,
          d_time: job.d_time ?? '',
        };
      }
      return null;
    } catch (e) {
      console.error('fetchJobDetail error:', e);
      return null;
    }
  };

  const navigateToDetail = async (value: string) => {
    const jobDetail = await fetchJobDetail(value);
    navigation.navigate('ViewDetail', {
      item: jobDetail ?? {
        request_id: value,
        status_id: 'SD00',
        status_name: '',
        type_name: '',
        to_company: '',
        d_date: '',
        d_time: '',
      },
    });
    setTimeout(() => {
      isNavigating.current = false;
    }, 2000);
  };

  const handleScanned = (value: string) => {
    if (isNavigating.current) return;
    if (!isValidRequestId(value)) {
      showAlertModal(
        'ไม่สามารถอ่านข้อมูลได้',
        `รหัส "${value}" ไม่ถูกต้อง\nรูปแบบที่รองรับ: XX-00-00000`,
      );
      return;
    }

    isNavigating.current = true;

    if (userRef.current?.status === 'U04') {
      navigateToDetail(value);
    } else {
      navigation.navigate('Tracking', {requestId: value});
      setTimeout(() => {
        isNavigating.current = false;
      }, 2000);
    }
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

  const handleOpenGallery = () => {
    launchImageLibrary({mediaType: 'photo'}, async response => {
      if (response.didCancel || response.errorCode) return;
      const uri = response.assets?.[0]?.uri;
      if (!uri) return;
      try {
        setScanning(true);
        const barcodes = await BarcodeScanning.scan(uri);
        if (barcodes.length > 0) {
          const value = barcodes[0].value;
          if (value) {
            if (!isValidRequestId(value)) {
              showAlertModal(
                'ไม่สามารถอ่านข้อมูลได้',
                `รหัส "${value}" ไม่ถูกต้อง\nรูปแบบที่รองรับ: XX-00-00000`,
              );
              return;
            }
            if (userRef.current?.status === 'U04') {
              navigation.navigate('ViewDetail', {
                item: {
                  request_id: value,
                  status_id: 'SD00',
                  status_name: 'กำลังไปรับของ',
                  type_name: '',
                  to_company: '',
                  d_date: '',
                  d_time: '',
                },
                fromScreen: undefined,
              });
            } else {
              navigation.navigate('Tracking', {requestId: value});
            }
          } else {
            setShowNotFound(true);
          }
        } else {
          setShowNotFound(true);
        }
      } catch (err: any) {
        showAlertModal('ข้อผิดพลาด', 'ไม่สามารถอ่านบาร์โค้ดได้');
        console.error(err);
      } finally {
        setScanning(false);
      }
    });
  };

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Icon name="camera-off" size={Math.round(width * 0.12)} color="#fff" />
        <Text style={[styles.text, {fontSize: Math.round(width * 0.04)}]}>
          ไม่ได้รับสิทธิ์ใช้กล้อง
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text
            style={[styles.permBtnText, {fontSize: Math.round(width * 0.04)}]}>
            ขอสิทธิ์อีกครั้ง
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <Icon name="camera-off" size={Math.round(width * 0.12)} color="#fff" />
        <Text style={[styles.text, {fontSize: Math.round(width * 0.04)}]}>
          ไม่พบกล้อง
        </Text>
      </View>
    );
  }

  return (
    <>
      {/* ── Alert Modal ── */}
      <Modal transparent visible={alertModal.visible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View
              style={[
                styles.modalIconCircle,
                {backgroundColor: alertModal.color ?? '#F5A800'},
              ]}>
              <Text style={styles.modalIconText}>!</Text>
            </View>
            <Text style={styles.modalTitle}>{alertModal.title}</Text>
            <Text style={styles.modalMessage}>{alertModal.message}</Text>
            <TouchableOpacity
              style={[
                styles.modalFullBtn,
                {backgroundColor: companyColor ?? '#a7cc43'},
              ]}
              onPress={() =>
                setAlertModal(prev => ({...prev, visible: false}))
              }>
              <Text style={styles.modalConfirmText}>ตกลง</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* ── Not Found Modal ── */}
      <Modal transparent visible={showNotFound} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View
              style={[styles.modalIconCircle, {backgroundColor: '#F5A800'}]}>
              <Text style={styles.modalIconText}>!</Text>
            </View>
            <Text style={styles.modalTitle}>แจ้งเตือน</Text>
            <Text style={styles.modalMessage}>
              ไม่พบบาร์โค้ดในรูปที่เลือก{'\n'}ลองถ่ายรูปให้ชัดขึ้นแล้วลองใหม่
            </Text>
            <TouchableOpacity
              style={[
                styles.modalFullBtn,
                {backgroundColor: companyColor ?? '#a7cc43'},
              ]}
              onPress={() => setShowNotFound(false)}>
              <Text style={styles.modalConfirmText}>ตกลง</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={StyleSheet.absoluteFill}>
        {/* <StatusBar barStyle="light-content" backgroundColor="transparent" translucent /> */}

        {/* Camera */}
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isCameraActive && !showManual && !scanning && !showNotFound}
          torch={flash}
          {...cameraProps}
        />
        <CameraHighlights highlights={highlights} color="yellow" />

        {/* Dark overlay — top */}
        <View style={[styles.overlay, {top: 0, height: FRAME_TOP}]} />
        {/* Dark overlay — bottom */}
        <View
          style={[styles.overlay, {top: FRAME_TOP + FRAME_SIZE, bottom: 0}]}
        />
        {/* Dark overlay — left */}
        <View
          style={[
            styles.overlaylr,
            {
              top: FRAME_TOP,
              height: FRAME_SIZE,
              left: 0,
              width: (width - FRAME_SIZE) / 2,
            },
          ]}
        />
        {/* Dark overlay — right */}
        <View
          style={[
            styles.overlaylr,
            {
              top: FRAME_TOP,
              height: FRAME_SIZE,
              right: 0,
              width: (width - FRAME_SIZE) / 2,
            },
          ]}
        />

        {/* Scan Frame */}
        <View
          style={[
            styles.frame,
            {
              top: FRAME_TOP,
              left: (width - FRAME_SIZE) / 2,
              width: FRAME_SIZE,
              height: FRAME_SIZE,
            },
          ]}>
          <View
            style={[
              styles.corner,
              {
                width: CORNER,
                height: CORNER,
                top: 0,
                left: 0,
                borderTopWidth: BORDER,
                borderLeftWidth: BORDER,
                borderColor: '#fff',
                borderTopLeftRadius: 4,
              },
            ]}
          />
          <View
            style={[
              styles.corner,
              {
                width: CORNER,
                height: CORNER,
                top: 0,
                right: 0,
                borderTopWidth: BORDER,
                borderRightWidth: BORDER,
                borderColor: '#fff',
                borderTopRightRadius: 4,
              },
            ]}
          />
          <View
            style={[
              styles.corner,
              {
                width: CORNER,
                height: CORNER,
                bottom: 0,
                left: 0,
                borderBottomWidth: BORDER,
                borderLeftWidth: BORDER,
                borderColor: '#fff',
                borderBottomLeftRadius: 4,
              },
            ]}
          />
          <View
            style={[
              styles.corner,
              {
                width: CORNER,
                height: CORNER,
                bottom: 0,
                right: 0,
                borderBottomWidth: BORDER,
                borderRightWidth: BORDER,
                borderColor: '#fff',
                borderBottomRightRadius: 4,
              },
            ]}
          />
          <View style={styles.scanLine} />
        </View>

        {/* Label */}
        <Text
          style={[
            styles.scanLabel,
            {
              top: FRAME_TOP - height * 0.05,
              fontSize: FONT_SM,
            },
          ]}>
          วางบาร์โค้ดหรือ QR Code ในกรอบ
        </Text>

        {/* Scanning overlay */}
        {scanning && (
          <View style={styles.scanningOverlay}>
            <Icon
              name="line-scan"
              size={Math.round(width * 0.1)}
              color="#fff"
            />
            <Text
              style={[
                styles.scanningText,
                {fontSize: Math.round(width * 0.04)},
              ]}>
              กำลังอ่านบาร์โค้ด...
            </Text>
          </View>
        )}

        {/* Bottom controls */}
        <View
          style={{
            position: 'absolute',
            top: FRAME_TOP + FRAME_SIZE + CTRL_BOTTOM,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: SIDE_PAD,
          }}>
          {/* Flash button */}
          <TouchableOpacity
            style={[
              styles.controlBtn,
              {
                width: BACK_SIZE * 1.4,
                height: BACK_SIZE * 1.4,
                borderRadius: BACK_SIZE,
              },
            ]}
            onPress={() => setFlash(f => (f === 'off' ? 'on' : 'off'))}>
            {flash === 'on' ? (
              <Ionicon name="flash" size={ICON_BTN} color="#FFF" />
            ) : (
              <Ionicon name="flash-off-outline" size={ICON_BTN} color="#fff" />
            )}
          </TouchableOpacity>

          {/* Gallery button */}
          <TouchableOpacity
            style={[
              styles.controlBtn,
              {
                width: BACK_SIZE * 1.4,
                height: BACK_SIZE * 1.4,
                borderRadius: BACK_SIZE,
              },
            ]}
            onPress={handleOpenGallery}
            disabled={scanning}>
            <MaterialIcons
              name="image"
              size={ICON_BTN}
              color="#fff"
              style={{opacity: scanning ? 0.4 : 1}}
            />
          </TouchableOpacity>
        </View>

        {/* Back button */}
        <TouchableOpacity
          style={[
            styles.backBtn,
            {
              top: height * 0.06,
              left: width * 0.04,
              width: BACK_SIZE * 1.4,
              height: BACK_SIZE * 1.4,
              borderRadius: BACK_SIZE,
            },
          ]}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={ICON_SIZE} color="#fff" />
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  text: {color: '#fff', marginTop: 16, marginBottom: 16},
  permBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permBtnText: {color: '#fff', fontWeight: 'bold'},

  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlaylr: {position: 'absolute', backgroundColor: 'rgba(0,0,0,0.6)'},
  frame: {position: 'absolute'},

  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  corner: {position: 'absolute'},

  scanLabel: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: '#fff',
  },

  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  scanningText: {color: '#fff', fontWeight: 'bold'},

  controlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 18,
  },
  backBtn: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Manual Modal
  manualOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  manualBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  manualInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    color: '#333',
    marginBottom: 16,
    letterSpacing: 1,
    marginTop: 16,
  },
  manualButtons: {flexDirection: 'row', gap: 12},
  manualCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  manualCancelText: {color: '#666', fontWeight: 'bold'},
  manualConfirm: {
    flex: 2,
    padding: 14,
    borderRadius: 10,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualConfirmText: {color: '#fff', fontWeight: 'bold'},

  // Not Found Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    elevation: 5,
  },
  modalIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconText: {color: '#fff', fontSize: 30, fontWeight: 'bold'},
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalFullBtn: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalConfirmText: {color: '#fff', fontSize: 15, fontWeight: 'bold'},
});
