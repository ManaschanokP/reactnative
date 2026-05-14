import React, {useState, useEffect, useContext, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  useWindowDimensions,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {launchCamera} from 'react-native-image-picker';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types/navigationTypes';
import {AuthContext} from '../context/AuthProvider';
import {
  getListStatus,
  updateStatus,
  updatePicture,
  submitSignature,
  submitEvaluation,
} from '../services/apiService';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import SignatureScreen, {SignatureViewRef} from 'react-native-signature-canvas';
import {Rating} from 'react-native-ratings';
import NetInfo from '@react-native-community/netinfo';
import {addToQueue} from '../utils/offlineQueue';
import {API_ENDPOINTS} from '../config/apiConfig';
import {syncQueue} from '../services/syncService';
import {
  startLocationTracking,
  stopLocationTracking,
  isTrackingActive,
  getTotalDistance,
} from '../services/locationService';

type Props = NativeStackScreenProps<RootStackParamList, 'ViewDetail'>;

const STATUS_ID_MAP: Record<string, string> = {
  รอดำเนินการ: 'S000',
  'ใช้บริการ Outsource': 'S001',
  มอบหมายงานสำเร็จ: 'S002',
  กำลังไปรับของ: 'SD00',
  ขึ้นของ: 'SD01',
  กำลังจัดส่ง: 'SD02',
  เช็คอิน: 'SD03',
  พบปัญหา: 'SD04',
  การจัดส่งสำเร็จ: 'SD05',
  รับเอกสารกลับ: 'SD06',
  เช็คเอ้าท์: 'SD07',
  คลังสินค้า: 'SD08',
  การดำเนินการสำเร็จ: 'SD09',
  ยกเลิก: 'SD10',
};

const REQUIRES_PHOTO = ['ขึ้นของ', 'เช็คอิน', 'พบปัญหา', 'การจัดส่งสำเร็จ'];
const REQUIRES_SIGNATURE_RATING = ['การจัดส่งสำเร็จ'];
const TRACKING_START_STATUS = 'กำลังจัดส่ง';
const TRACKING_STOP_STATUSES = ['การดำเนินการสำเร็จ', 'ยกเลิก'];

const ViewDetailScreen: React.FC<Props> = ({route, navigation}) => {
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();
  const {item} = route.params;
  const {user} = useContext(AuthContext)!;

  // Form state
  const [statusList, setStatusList] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [detail, setDetail] = useState('');
  const [box, setBox] = useState('');
  const [mile, setMile] = useState('');
  const [photo, setPhoto] = useState<{uri: string; base64: string} | null>(
    null,
  );
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [updating, setUpdating] = useState(false);

  //Signature / Rating state
  const [rating, setRating] = useState(5);
  const [signature, setSignature] = useState<string | null>(null);
  const [signatureKey, setSignatureKey] = useState(0);
  const signatureRef = useRef<SignatureViewRef>(null);

  //GPS Tracking state
  const [isTracking, setIsTracking] = useState(false);
  const [totalDistance, setTotalDistance] = useState(0);

  //Init: check tracking + poll distance
  useEffect(() => {
    const checkTracking = async () => {
      const active = await isTrackingActive();
      setIsTracking(active);
      if (active) {
        const dist = await getTotalDistance();
        setTotalDistance(dist);
      }
    };
    checkTracking();

    const interval = setInterval(async () => {
      const dist = await getTotalDistance();
      setTotalDistance(dist);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Init: fetch status list
  useEffect(() => {
    fetchStatusList();
  }, []);

  const fetchStatusList = async () => {
    try {
      setLoadingStatus(true);
      const response = await getListStatus({
        request_id: item.request_id,
        status_now: item.status_id,
        type_user: user.status,
      });

      if (!response.error && response.listStatus.length > 0) {
        let names = response.listStatus.map(s => s.status_name);

        if (item.status_id === 'SD05') {
          const allStatusNames = Object.keys(STATUS_ID_MAP);
          names = allStatusNames.filter(
            name =>
              ![
                'รอดำเนินการ',
                'ใช้บริการ Outsource',
                'มอบหมายงานสำเร็จ',
                'กำลังไปรับของ',
                'ขึ้นของ',
                'กำลังจัดส่ง',
                'เช็คอิน',
                'การจัดส่งสำเร็จ',
              ].includes(name),
          );
        }

        /*
        if (item.status_id === 'SD05') {
          // ✅ กำหนดสถานะที่แสดงหลัง "การจัดส่งสำเร็จ" ตามลำดับที่ต้องการ
          names = [
            'รับเอกสารกลับ',
            'เช็คเอ้าท์',
            'การดำเนินการสำเร็จ',
            'ยกเลิก',
            'พบปัญหา',
          ];
        }*/

        setStatusList(names);
        setSelectedStatus(names[0]);
      } else if (item.status_id === 'SD05') {
        //กรณี API error หรือ list ว่าง — ยังคงแสดงครบ
        const names = [
          'รับเอกสารกลับ',
          'เช็คเอ้าท์',
          'การดำเนินการสำเร็จ',
          'ยกเลิก',
          'พบปัญหา',
        ];
        setStatusList(names);
        setSelectedStatus(names[0]);
      }
    } catch (err) {
      console.error(err);
      if (item.status_id === 'SD05') {
        const names = [
          'รับเอกสารกลับ',
          'เช็คเอ้าท์',
          'การดำเนินการสำเร็จ',
          'ยกเลิก',
          'พบปัญหา',
        ];
        setStatusList(names);
        setSelectedStatus(names[0]);
      }
    } finally {
      setLoadingStatus(false);
    }
  };

  //Camera
  const handleTakePhoto = () => {
    launchCamera(
      {mediaType: 'photo', includeBase64: true, quality: 0.6},
      response => {
        if (response.didCancel || response.errorCode) return;
        const asset = response.assets?.[0];
        if (asset?.uri && asset?.base64) {
          setPhoto({uri: asset.uri, base64: asset.base64});
        }
      },
    );
  };

  // Signature
  const handleSignatureOK = (signatureBase64: string) => {
    setSignature(signatureBase64);
  };

  const handleClearSignature = () => {
    setSignature(null);
    setSignatureKey(prev => prev + 1);
  };

  //Main update handler
  const handleUpdate = async () => {
    const status_id = STATUS_ID_MAP[selectedStatus] ?? '';

    if (!status_id) {
      Alert.alert('ข้อผิดพลาด', 'ไม่พบรหัสสถานะ');
      return;
    }
    if (needsPhoto && !photo) {
      Alert.alert('แจ้งเตือน', 'กรุณาถ่ายรูปก่อนอัปเดตสถานะนี้');
      return;
    }
    if (needsSignatureRating && !signature) {
      Alert.alert('แจ้งเตือน', 'กรุณาเซ็นชื่อยืนยันการจัดส่ง');
      return;
    }
    if (needsBox && !box.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกจำนวนกล่อง');
      return;
    }
    if (needsMile && !mile.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกเลขไมล์');
      return;
    }

    Alert.alert(
      'ยืนยัน',
      `ต้องการอัปเดตสถานะเป็น "${selectedStatus}" ใช่ไหม?`,
      [
        {text: 'ยกเลิก', style: 'cancel'},
        {
          text: 'ยืนยัน',
          onPress: async () => {
            try {
              setUpdating(true);

              console.log('=== handleUpdate ===');
              console.log('request_id     :', item.request_id);
              console.log('status_id      :', status_id);
              console.log('selectedStatus :', selectedStatus);
              console.log('needsPhoto     :', needsPhoto);
              console.log('needsSigRating :', needsSignatureRating);
              console.log(
                'signature      :',
                signature ? `length=${signature.length}` : 'null',
              );
              console.log('rating         :', rating);

              const baseParams = {
                request_id: item.request_id,
                status_id,
                detail,
                box,
                user_status: user.status,
                mile,
                driver: user.id,
              };

              const netState = await NetInfo.fetch();

              //Offline path
              if (!netState.isConnected) {
                const endpoint =
                  needsPhoto && photo
                    ? API_ENDPOINTS.UPDATE_PICTURE
                    : API_ENDPOINTS.UPDATE_STATUS;

                await addToQueue(
                  endpoint,
                  needsPhoto && photo
                    ? {...baseParams, picture: photo.base64 ?? ''}
                    : baseParams,
                );

                Alert.alert(
                  '📴 ออฟไลน์',
                  'ไม่มีอินเทอร์เน็ต ข้อมูลถูกบันทึกไว้แล้ว จะส่งอัตโนมัติเมื่อกลับมาออนไลน์',
                  [{text: 'ตกลง', onPress: () => navigation.goBack()}],
                );
                return;
              }

              //Online: Step 1 — updateStatus / updatePicture
              let response;
              if (needsPhoto && photo) {
                console.log('📡 calling updatePicture...');
                response = await updatePicture({
                  ...baseParams,
                  picture: photo.base64,
                });
              } else {
                console.log('📡 calling updateStatus...');
                response = await updateStatus(baseParams);
              }
              console.log('updateStatus/Picture response:', response);

              // Sync any previously queued offline items
              await syncQueue();

              //Online: Step 2 — submitSignature (esig_cus)
              if (needsSignatureRating && signature) {
                console.log('📡 calling submitSignature...');
                const cleanSignature = signature.replace(
                  /^data:image\/\w+;base64,/,
                  '',
                );
                console.log('signature length (clean):', cleanSignature.length);

                const sigResponse = await submitSignature({
                  request_id: item.request_id,
                  status_id,
                  picture: cleanSignature,
                });
                console.log('submitSignature response:', sigResponse);
              }

              //Online: Step 3 — submitEvaluation (rating)
              if (needsSignatureRating) {
                console.log('📡 calling submitEvaluation, rating:', rating);
                const evalResponse = await submitEvaluation({
                  request_id: item.request_id,
                  status_id,
                  eval: String(rating),
                });
                console.log('submitEvaluation response:', evalResponse);
              }

              //GPS: auto-start when "กำลังจัดส่ง"
              if (selectedStatus === TRACKING_START_STATUS) {
                console.log('🚚 auto-starting GPS tracking...');
                await startLocationTracking(
                  item.request_id,
                  status_id,
                  user.id,
                );
                setIsTracking(true);
              }

              //GPS: auto-stop when "การดำเนินการสำเร็จ" | "ยกเลิก"
              if (TRACKING_STOP_STATUSES.includes(selectedStatus)) {
                console.log('🛑 auto-stopping GPS tracking...');
                await stopLocationTracking();
                setIsTracking(false);
                setTotalDistance(0);
              }

              Alert.alert('สำเร็จ', response.message, [
                {text: 'ตกลง', onPress: () => navigation.goBack()},
              ]);
            } catch (err) {
              Alert.alert('ข้อผิดพลาด', 'อัปเดตสถานะไม่สำเร็จ');
              console.error('handleUpdate error:', err);
            } finally {
              setUpdating(false);
            }
          },
        },
      ],
    );
  };

  // Derived flags
  const isBoxEnabled = selectedStatus === 'ขึ้นของ';
  const isMileEnabled =
    selectedStatus === 'กำลังจัดส่ง' || selectedStatus === 'การดำเนินการสำเร็จ';
  const needsPhoto = REQUIRES_PHOTO.includes(selectedStatus);
  const needsSignatureRating =
    REQUIRES_SIGNATURE_RATING.includes(selectedStatus);
  const needsBox = isBoxEnabled;
  const needsMile = isMileEnabled;

  const isSubmitDisabled =
    updating ||
    (needsPhoto && !photo) ||
    (needsSignatureRating && !signature) ||
    (needsBox && !box.trim()) ||
    (needsMile && !mile.trim());

  const signatureHeight = Math.round(width * 0.4);

  //Render
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {/* ข้อมูลงาน*/}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>ข้อมูลงาน</Text>
        <Row label="Request ID" value={item.request_id} />
        <Row label="ประเภท" value={item.type_name} />
        <Row label="ปลายทาง" value={item.to_company} />
        <Row label="วันที่" value={`${item.d_date} ${item.d_time}`} />
        <Row label="สถานะปัจจุบัน" value={item.status_name} highlight />
      </View>

      {/*  GPS Tracking Banner  */}
      {isTracking && (
        <View style={styles.trackingBanner}>
          <Text style={styles.trackingBannerText}>
            📍 กำลังติดตาม GPS — {totalDistance.toFixed(2)} กม.
          </Text>
        </View>
      )}

      {/*อัปเดตสถานะ */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>อัปเดตสถานะ</Text>

        {loadingStatus ? (
          <ActivityIndicator color="#a7cc43" style={{marginVertical: 12}} />
        ) : (
          <Picker
            selectedValue={selectedStatus}
            onValueChange={val => {
              setSelectedStatus(val);
              setPhoto(null);
              handleClearSignature();
            }}
            style={styles.picker}>
            {statusList.map(s => (
              <Picker.Item key={s} label={s} value={s} />
            ))}
          </Picker>
        )}

        {/* Rating & Signature */}
        {needsSignatureRating && (
          <View style={styles.specialSection}>
            <Text style={styles.fieldLabel}>ประเมินความพึงพอใจ :</Text>
            <Rating
              startingValue={rating}
              onFinishRating={setRating}
              imageSize={Math.round(width * 0.07)}
              style={{paddingVertical: 10}}
            />

            <Text style={styles.fieldLabel}>ลายเซ็นผู้รับสินค้า :</Text>
            <View style={[styles.signatureBox, {height: signatureHeight}]}>
              <SignatureScreen
                key={signatureKey}
                ref={signatureRef}
                onOK={handleSignatureOK}
                descriptionText="เซ็นชื่อลงในช่องว่าง"
                clearText="ล้าง"
                confirmText="บันทึกลายเซ็น"
                penColor="#000000"
                backgroundColor="#ffffff"
                imageType="image/png"
                webStyle={`
                  .m-signature-pad { box-shadow: none; border: none; }
                  .m-signature-pad--body { background-color: #ffffff; }
                  .m-signature-pad--footer { display: none; }
                  body { margin: 0; background-color: #ffffff; }
                `}
              />
            </View>

            <View style={styles.signatureActions}>
              <TouchableOpacity
                style={styles.signatureBtnClear}
                onPress={handleClearSignature}>
                <Text style={styles.clearText}> ล้างลายเซ็น</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.signatureBtnSave}
                onPress={() => signatureRef.current?.readSignature()}>
                <Text style={styles.saveText}> บันทึกลายเซ็น</Text>
              </TouchableOpacity>
            </View>

            {signature ? (
              <Text style={styles.signatureSuccess}> ได้รับลายเซ็นแล้ว</Text>
            ) : (
              <Text style={styles.signaturePending}>
                {' '}
                ยังไม่ได้บันทึกลายเซ็น
              </Text>
            )}
          </View>
        )}

        {/* ถ่ายรูป */}
        {needsPhoto && (
          <View style={styles.photoSection}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={handleTakePhoto}>
              <Text style={styles.photoButtonText}>
                {photo ? '📷 ถ่ายรูปใหม่' : '📷 ถ่ายรูป (จำเป็น)'}
              </Text>
            </TouchableOpacity>
            {photo && (
              <Image source={{uri: photo.uri}} style={styles.photoPreview} />
            )}
          </View>
        )}

        <Text style={styles.fieldLabel}>
          จำนวนกล่อง :{needsBox && <Text style={styles.required}> *</Text>}
        </Text>
        <TextInput
          style={[
            styles.input,
            !isBoxEnabled && styles.inputDisabled,
            needsBox && !box.trim() && styles.inputError,
          ]}
          keyboardType="numeric"
          value={box}
          onChangeText={text => setBox(text.replace(/[^0-9]/g, ''))}
          editable={isBoxEnabled}
          placeholder="จำนวนกล่อง (จำเป็น)"
          placeholderTextColor={needsBox ? '#e74c3c' : '#aaa'}
        />
        {needsBox && !box.trim() && (
          <Text style={styles.errorText}>⚠ กรุณากรอกจำนวนกล่อง</Text>
        )}

        <Text style={styles.fieldLabel}>
          เลขไมล์ :{needsMile && <Text style={styles.required}> *</Text>}
        </Text>
        <TextInput
          style={[
            styles.input,
            !isMileEnabled && styles.inputDisabled,
            needsMile && !mile.trim() && styles.inputError,
          ]}
          keyboardType="numeric"
          value={mile}
          onChangeText={text => setMile(text.replace(/[^0-9]/g, ''))}
          editable={isMileEnabled}
          placeholder="เลขไมล์ (จำเป็น)"
          placeholderTextColor={needsMile ? '#e74c3c' : '#aaa'}
        />
        {needsMile && !mile.trim() && (
          <Text style={styles.errorText}>⚠ กรุณากรอกเลขไมล์</Text>
        )}

        <Text style={styles.fieldLabel}>รายละเอียด :</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={detail}
          onChangeText={setDetail}
          placeholder="รายละเอียดเพิ่มเติม"
          multiline
          numberOfLines={3}
        />
      </View>

      {/* ปุ่ม Confirm */}
      <TouchableOpacity
        style={[
          styles.confirmButton,
          isSubmitDisabled && styles.buttonDisabled,
        ]}
        onPress={handleUpdate}
        disabled={isSubmitDisabled}>
        {updating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.confirmText}> ยืนยันอัปเดตสถานะ</Text>
        )}
      </TouchableOpacity>

      <View style={{height: insets.bottom + 120}} />
    </ScrollView>
  );
};

// Row component
const Row = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label} :</Text>
    <Text style={[styles.rowValue, highlight && styles.highlightValue]}>
      {value}
    </Text>
  </View>
);

// Styles
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  content: {padding: 16, paddingBottom: 16},
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#a7cc43',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  row: {flexDirection: 'row', marginBottom: 8, flexWrap: 'wrap'},
  rowLabel: {fontWeight: 'bold', fontSize: 14, color: '#555', width: 120},
  rowValue: {fontSize: 14, color: '#333', flex: 1},
  highlightValue: {color: '#e67e22', fontWeight: 'bold'},
  picker: {marginBottom: 8},

  // GPS banner
  trackingBanner: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#a5d6a7',
  },
  trackingBannerText: {
    color: '#2e7d32',
    fontWeight: 'bold',
    fontSize: 13,
  },

  // Photo
  photoSection: {marginVertical: 12, alignItems: 'center'},
  photoButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  photoButtonText: {color: '#fff', fontWeight: 'bold', fontSize: 15},
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 10,
    resizeMode: 'cover',
  },

  // Fields
  fieldLabel: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#555',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
  },
  inputDisabled: {backgroundColor: '#f0f0f0', color: '#aaa'},
  inputMultiline: {height: 80, textAlignVertical: 'top'},

  required: {color: '#e74c3c', fontWeight: 'bold'},
  inputError: {
    borderColor: '#e74c3c',
    borderWidth: 2,
    backgroundColor: '#fff5f5',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 11,
    marginTop: 3,
    marginLeft: 2,
  },

  // Confirm button
  confirmButton: {
    backgroundColor: '#a7cc43',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 28,
  },
  buttonDisabled: {backgroundColor: '#ccc'},
  confirmText: {color: '#fff', fontSize: 16, fontWeight: 'bold'},

  // Signature
  specialSection: {
    padding: 10,
    backgroundColor: '#fff9f0',
    borderRadius: 8,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  signatureBox: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    marginTop: 5,
    overflow: 'hidden',
    borderRadius: 6,
  },
  signatureActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 8,
  },
  signatureBtnClear: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e74c3c',
    alignItems: 'center',
  },
  signatureBtnSave: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3498db',
    alignItems: 'center',
  },
  clearText: {color: '#e74c3c', fontWeight: 'bold', fontSize: 14},
  saveText: {color: '#3498db', fontWeight: 'bold', fontSize: 14},
  signatureSuccess: {
    color: '#27ae60',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  signaturePending: {
    color: '#e67e22',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
});

export default ViewDetailScreen;
