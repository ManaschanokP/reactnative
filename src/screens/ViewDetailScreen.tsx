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
  Modal,
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
import Icon from 'react-native-vector-icons/MaterialIcons';

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
const REQUIRES_SIGNATURE_RATING = ['ยกเลิก']; // บังคับ
const OPTIONAL_SIGNATURE_RATING = ['การจัดส่งสำเร็จ']; // ไม่บังคับ
const REQUIRES_BOX = ['ขึ้นของ'];
const REQUIRES_MILE = ['กำลังจัดส่ง', 'การดำเนินการสำเร็จ'];
const TRACKING_START_STATUS = 'กำลังจัดส่ง';
const TRACKING_STOP_STATUSES = ['การดำเนินการสำเร็จ', 'พบปัญหา'];

const ViewDetailScreen: React.FC<Props> = ({route, navigation}) => {
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();
  const {item} = route.params;
  const {user, companyColor} = useContext(AuthContext)!;

  //จากหน้า NotiDetail
  const {fromScreen} = route.params;

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
  const [rating, setRating] = useState(5);
  const [signature, setSignature] = useState<string | null>(null);
  const [signatureKey, setSignatureKey] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [totalDistance, setTotalDistance] = useState(0);

  // Custom modal states
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [pendingStatusId, setPendingStatusId] = useState('');
  const [isOfflineSuccess, setIsOfflineSuccess] = useState(false);

  const signatureRef = useRef<SignatureViewRef>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const photoRef = useRef<{uri: string; base64: string} | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const needsPhoto = REQUIRES_PHOTO.includes(selectedStatus);
  const needsSignatureRating =
    REQUIRES_SIGNATURE_RATING.includes(selectedStatus); // บังคับ (ยกเลิก)
  const hasSignatureRating =
    needsSignatureRating || OPTIONAL_SIGNATURE_RATING.includes(selectedStatus); // แสดง section (ทั้งคู่)
  const needsBox = REQUIRES_BOX.includes(selectedStatus);
  const needsMile = REQUIRES_MILE.includes(selectedStatus);
  const signatureHeight = Math.round(width * 0.4);

  const isSubmitDisabled =
    updating ||
    (needsPhoto && !photo) ||
    (needsBox && !box.trim()) ||
    (needsMile && !mile.trim()) ||
    (needsSignatureRating && !signature);

  useEffect(() => {
    const checkTracking = async () => {
      const active = await isTrackingActive();
      setIsTracking(active);
      if (active) setTotalDistance(await getTotalDistance());
    };
    checkTracking();
    const interval = setInterval(async () => {
      setTotalDistance(await getTotalDistance());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
          names = Object.keys(STATUS_ID_MAP).filter(
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
        setStatusList(names);
        setSelectedStatus(names[0]);
      } else if (item.status_id === 'SD05') {
        const names = [
          'รับเอกสารกลับ',
          'เช็คเอ้าท์',
          'การดำเนินการสำเร็จ',
          'พบปัญหา',
        ];
        setStatusList(names);
        setSelectedStatus(names[0]);
      } else if (item.status_id === 'SD04') {
        const names = ['ยกเลิก'];
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
          'พบปัญหา',
        ];
        setStatusList(names);
        setSelectedStatus(names[0]);
      }
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleTakePhoto = () => {
    launchCamera(
      {mediaType: 'photo', includeBase64: true, quality: 0.6},
      response => {
        if (response.didCancel || response.errorCode) return;
        const asset = response.assets?.[0];
        if (asset?.uri && asset?.base64) {
          const photoData = {uri: asset.uri, base64: asset.base64};
          setPhoto(photoData);
          photoRef.current = photoData; // เก็บใน ref ด้วย
        }
      },
    );
  };

  const handleSignatureOK = (sig: string) => {
    setSignature(sig);
  };

  const handleClearSignature = () => {
    setSignature(null);
    setSignatureKey(p => p + 1);
  };

  const handleUpdate = () => {
    const status_id = STATUS_ID_MAP[selectedStatus] ?? '';
    if (!status_id) {
      Alert.alert('ข้อผิดพลาด', 'ไม่พบรหัสสถานะ');
      return;
    }
    if (needsPhoto && !photo) {
      Alert.alert('แจ้งเตือน', 'กรุณาถ่ายรูปก่อนอัปเดตสถานะนี้');
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

    setPendingStatusId(status_id);
    setShowConfirm(true);
  };

  const doUpdate = async (status_id: string) => {
    const currentPhoto = photoRef.current;

    try {
      setUpdating(true);
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

      if (!netState.isConnected) {
        const endpoint = currentPhoto
          ? API_ENDPOINTS.UPDATE_PICTURE
          : API_ENDPOINTS.UPDATE_STATUS;

        const payload = currentPhoto
          ? {...baseParams, picture: currentPhoto.base64 ?? ''}
          : baseParams;

        await addToQueue(endpoint, payload);
        setIsOfflineSuccess(true);
        setSuccessMessage(
          'ไม่มีอินเทอร์เน็ต ข้อมูลถูกบันทึกไว้\nจะส่งอัตโนมัติเมื่อกลับมาออนไลน์',
        );
        setShowSuccess(true);
        return;
      }

      // ── online ──
      let response;

      if (needsSignatureRating) {
        if (currentPhoto) {
          response = await updatePicture({
            ...baseParams,
            picture: currentPhoto.base64,
          });
        } else {
          response = await updateStatus(baseParams);
        }
      } else if (needsPhoto && currentPhoto) {
        response = await updatePicture({
          ...baseParams,
          picture: currentPhoto.base64,
        });
      } else {
        response = await updateStatus(baseParams);
      }

      await syncQueue();

      await new Promise(resolve => setTimeout(resolve, 1000));
      // ── ส่งลายเซ็นแยก ──
      if (hasSignatureRating && signature) {
        const cleanSig = signature.replace(/^data:image\/\w+;base64,/, '');
        await submitSignature({
          request_id: item.request_id,
          status_id,
          picture: cleanSig,
        });
      }

      // ส่งประเมิน — ส่งทั้งสองสถานะ
      if (hasSignatureRating) {
        await submitEvaluation({
          request_id: item.request_id,
          status_id,
          eval: String(rating),
        });
      }

      if (selectedStatus === TRACKING_START_STATUS) {
        await startLocationTracking(item.request_id, status_id, user.id);
        setIsTracking(true);
      }
      if (TRACKING_STOP_STATUSES.includes(selectedStatus)) {
        await stopLocationTracking();
        setIsTracking(false);
        setTotalDistance(0);
      }

      setIsOfflineSuccess(false);
      setSuccessMessage(response.message);
      setShowSuccess(true);
    } catch (err: any) {
      Alert.alert('ข้อผิดพลาด', 'อัปเดตสถานะไม่สำเร็จ');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const getConfirmColor = () => {
    if (selectedStatus === 'พบปัญหา') return '#f39c12'; // เหลือง
    if (selectedStatus === 'ยกเลิก') return '#D00000'; // แดง
    return companyColor ?? '#93D500';
  };

  return (
    <>
      {/* ── Confirm Modal ── */}
      <Modal transparent visible={showConfirm} animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.box}>
            <View
              style={[
                modalStyles.iconCircle,
                {backgroundColor: getConfirmColor()},
              ]}>
              <Text style={modalStyles.iconText}>!</Text>
            </View>
            <Text style={modalStyles.title}>ยืนยัน</Text>
            <Text style={modalStyles.message}>
              ต้องการอัปเดตสถานะเป็น {'\n'}"{selectedStatus}" ใช่ไหม ?
            </Text>
            <View style={modalStyles.buttons}>
              <TouchableOpacity
                style={modalStyles.cancelBtn}
                onPress={() => setShowConfirm(false)}>
                <Text style={modalStyles.cancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  modalStyles.confirmBtn,
                  {backgroundColor: companyColor ?? '#93D500'},
                ]}
                onPress={() => {
                  setShowConfirm(false);
                  doUpdate(pendingStatusId);
                }}>
                <Text style={modalStyles.confirmText}>ยืนยัน</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Success Modal ── */}
      <Modal transparent visible={showSuccess} animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.box}>
            <View
              style={[
                modalStyles.iconCircle,
                {
                  backgroundColor: isOfflineSuccess
                    ? '#e67e22'
                    : companyColor ?? '#93D500',
                },
              ]}>
              <Text style={modalStyles.iconCheck}>
                {isOfflineSuccess ? '📴' : '✓'}
              </Text>
            </View>
            <Text style={modalStyles.title}>
              {isOfflineSuccess ? 'บันทึกแล้ว' : 'สำเร็จ'}
            </Text>
            <Text style={modalStyles.message}>
              {successMessage || 'บันทึกข้อมูลสำเร็จ'}
            </Text>
            <TouchableOpacity
              style={[
                modalStyles.fullBtn,
                {
                  backgroundColor: isOfflineSuccess
                    ? '#e67e22'
                    : companyColor ?? '#93D500',
                },
              ]}
              onPress={() => {
                setShowSuccess(false);

                if (fromScreen === 'NotificationList') {
                  navigation.navigate('NotificationList');
                } else {
                  navigation.goBack();
                }
              }}>
              <Text style={modalStyles.confirmText}>ตกลง</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView
        scrollEnabled={scrollEnabled}
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* ── ข้อมูลงาน ── */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, {color: companyColor}]}>
            ข้อมูลงาน
          </Text>
          <InfoRow label="Request ID" value={item.request_id} />
          <InfoRow label="ประเภท" value={item.type_name} />
          <InfoRow label="ปลายทาง" value={item.to_company} />
          <InfoRow label="วันที่" value={`${item.d_date} ${item.d_time}`} />
          <InfoRow label="สถานะปัจจุบัน" value={item.status_name} highlight />
        </View>

        {/* ── GPS Banner ── */}
        {isTracking && (
          <View style={[styles.trackingBanner, {borderColor: companyColor}]}>
            <Text style={[styles.trackingBannerText, {color: companyColor}]}>
              📍 กำลังติดตาม GPS — {totalDistance.toFixed(2)} กม.
            </Text>
          </View>
        )}

        {/* ── อัปเดตสถานะ ── */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, {color: companyColor}]}>
            อัปเดตสถานะ
          </Text>

          {loadingStatus ? (
            <ActivityIndicator
              color={companyColor}
              style={{marginVertical: 12}}
            />
          ) : (
            <View style={{zIndex: 999}}>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setShowDropdown(p => !p)}>
                <Text style={styles.dropdownBtnText}>{selectedStatus}</Text>
                <Icon
                  name={
                    showDropdown ? 'keyboard-arrow-up' : 'keyboard-arrow-down'
                  }
                  size={22}
                  color="#555"
                />
              </TouchableOpacity>

              {showDropdown && (
                <View style={styles.dropdownList}>
                  {statusList.map(s => (
                    <TouchableOpacity
                      key={s}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedStatus(s);
                        setPhoto(null);
                        setBox('');
                        setMile('');
                        handleClearSignature();
                        setShowDropdown(false);
                      }}>
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selectedStatus === s && {
                            color: companyColor ?? '#93D500',
                            fontFamily: 'Quicksand-Bold',
                          },
                        ]}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
          {/* ── ถ่ายรูป ── */}
          {needsPhoto && (
            <View style={styles.photoSection}>
              <TouchableOpacity
                style={[styles.photoButton, {backgroundColor: '#4E80FF'}]}
                onPress={handleTakePhoto}>
                <Icon name="camera-alt" size={18} color="#fff" />
                <Text style={styles.photoButtonText}>
                  {photo ? '  ถ่ายรูปใหม่' : '  ถ่ายรูป (จำเป็น)'}
                </Text>
              </TouchableOpacity>
              {photo && (
                <Image source={{uri: photo.uri}} style={styles.photoPreview} />
              )}
              {!photo && (
                <Text style={styles.photoHint}>
                  * สถานะนี้ต้องถ่ายรูปก่อนยืนยัน
                </Text>
              )}
            </View>
          )}

          {/* ── Rating & Signature ── */}
          {hasSignatureRating && (
            <View style={styles.specialSection}>
              <Text style={styles.fieldLabel}>ประเมินความพึงพอใจ :</Text>
              <Rating
                startingValue={rating}
                onFinishRating={setRating}
                imageSize={Math.round(width * 0.07)}
                style={{paddingVertical: 10}}
                tintColor="#fff9f0"
                ratingBackgroundColor="transparent"
              />
              <Text style={styles.fieldLabel}>ลายเซ็นผู้รับสินค้า :</Text>
              <View style={[styles.signatureBox, {height: signatureHeight}]}>
                <SignatureScreen
                  onBegin={() => setScrollEnabled(false)}
                  onEnd={() => setScrollEnabled(true)}
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
                  <Text style={styles.clearText}>ล้างลายเซ็น</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.signatureBtnSave, {borderColor: companyColor}]}
                  onPress={() => signatureRef.current?.readSignature()}>
                  <Text style={[styles.saveText, {color: companyColor}]}>
                    บันทึกลายเซ็น
                  </Text>
                </TouchableOpacity>
              </View>
              {signature ? (
                <Text style={styles.signatureSuccess}> ได้รับลายเซ็นแล้ว</Text>
              ) : (
                <Text
                  style={[
                    styles.signaturePending,
                    needsSignatureRating && {color: '#e74c3c'}, // ✅ แดงเมื่อบังคับ
                  ]}>
                  {needsSignatureRating
                    ? '* จำเป็นต้องบันทึกลายเซ็น'
                    : 'ยังไม่ได้บันทึกลายเซ็น'}
                </Text>
              )}
            </View>
          )}

          {/* ── จำนวนกล่อง ── */}
          {needsBox && (
            <View style={styles.inlineRow}>
              <Text style={styles.inlineLabel}>
                จำนวนกล่อง : <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inlineInputWrap}>
                <TextInput
                  style={[styles.inlineInput, !box.trim() && styles.inputError]}
                  keyboardType="numeric"
                  value={box}
                  onChangeText={text => setBox(text.replace(/[^0-9]/g, ''))}
                  placeholder="จำนวนกล่อง"
                  placeholderTextColor="#aaa"
                />
                {!box.trim() && (
                  <Text style={styles.errorText}>⚠ กรุณากรอกจำนวนกล่อง</Text>
                )}
              </View>
            </View>
          )}
          {/* ── เลขไมล์ ── */}
          {needsMile && (
            <View style={styles.inlineRow}>
              <Text style={styles.inlineLabel}>
                เลขไมล์ : <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inlineInputWrap}>
                <TextInput
                  style={[
                    styles.inlineInput,
                    !mile.trim() && styles.inputError,
                  ]}
                  keyboardType="numeric"
                  value={mile}
                  onChangeText={text => setMile(text.replace(/[^0-9]/g, ''))}
                  placeholder="เลขไมล์"
                  placeholderTextColor="#aaa"
                />
                {!mile.trim() && (
                  <Text style={styles.errorText}>⚠ กรุณากรอกเลขไมล์</Text>
                )}
              </View>
            </View>
          )}

          {/* ── รายละเอียด ── */}
          <View style={styles.inlineRow}>
            <Text style={styles.inlineLabel}>รายละเอียด :</Text>
            <TextInput
              style={[styles.inlineInput, styles.inputMultiline]}
              value={detail}
              onChangeText={setDetail}
              placeholder="รายละเอียดเพิ่มเติม"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* ── ปุ่ม Confirm ── */}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            {backgroundColor: companyColor ?? '#93D500'},
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
    </>
  );
};

const InfoRow = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowSeparator}> : </Text>
    <Text style={[styles.rowValue, highlight && styles.highlightValue]}>
      {value}
    </Text>
  </View>
);

// ── Main Styles ──
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  content: {padding: 16, paddingBottom: 16},

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    zIndex: 1,
    overflow: 'visible',
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
    color: '#333',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    gap: 8,
  },
  inlineLabel: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 12,
    color: '#555',
    width: 90,
    marginTop: 10,
  },
  inlineInputWrap: {
    flex: 1,
  },
  inlineInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fafafa',
    fontFamily: 'Quicksand-Regular',
  },

  row: {flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start'},
  rowLabel: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 12,
    color: '#373737',
    width: 110,
  },
  rowSeparator: {fontSize: 12, color: '#373737'},
  rowValue: {
    fontSize: 12,
    color: '#373737',
    flex: 1,
    fontFamily: 'Quicksand-Bold',
  },
  highlightValue: {fontFamily: 'Quicksand-Bold'},

  trackingBanner: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    backgroundColor: '#f0fff0',
  },
  trackingBannerText: {fontFamily: 'Quicksand-Bold', fontSize: 12},

  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
    marginBottom: 8,
  },
  dropdownBtnText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Quicksand-Medium',
  },
  dropdownList: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    elevation: 10,
    zIndex: 999,
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Quicksand-Medium',
  },

  photoSection: {marginVertical: 12, alignItems: 'center'},
  photoButton: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButtonText: {color: '#fff', fontFamily: 'Quicksand-Bold', fontSize: 15},
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 10,
    resizeMode: 'cover',
  },
  photoHint: {color: '#e74c3c', fontSize: 12, marginTop: 6},

  fieldLabel: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 12,
    color: '#555',
    marginTop: 10,
    marginBottom: 4,
  },
  inputMultiline: {height: 80, textAlignVertical: 'top'},
  required: {color: '#e74c3c', fontFamily: 'Quicksand-Bold'},
  inputError: {
    borderColor: '#e74c3c',
    borderWidth: 2,
    backgroundColor: '#fff5f5',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 11,
    marginTop: 3,
    fontFamily: 'Quicksand-Regular',
  },

  confirmButton: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    elevation: 2,
    alignSelf: 'center',
    width: '70%',
  },
  buttonDisabled: {backgroundColor: '#ccc'},
  confirmText: {color: '#fff', fontSize: 16, fontFamily: 'Quicksand-Bold'},

  specialSection: {
    padding: 12,
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
    alignItems: 'center',
  },
  clearText: {color: '#e74c3c', fontFamily: 'Quicksand-Bold', fontSize: 14},
  saveText: {fontFamily: 'Quicksand-Bold', fontSize: 14},
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

// ── Modal Styles ──
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    elevation: 5,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  iconCheck: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Quicksand-Bold',
    color: '#333',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    fontFamily: 'Quicksand-Regular',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  cancelText: {
    color: '#666',
    fontSize: 15,
    fontFamily: 'Quicksand-Bold',
  },
  confirmBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Quicksand-Bold',
  },
  fullBtn: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});

export default ViewDetailScreen;
