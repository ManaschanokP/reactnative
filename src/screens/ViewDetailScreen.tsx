import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator, Alert, Image,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { launchCamera } from 'react-native-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigationTypes';
import { AuthContext } from '../context/AuthProvider';
import { getListStatus, updateStatus, updatePicture } from '../services/apiService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'ViewDetail'>;

const STATUS_ID_MAP: Record<string, string> = {
  'รอดำเนินการ': 'S000',
  'ใช้บริการ Outsource': 'S001',
  'มอบหมายงานสำเร็จ': 'S002',
  'กำลังไปรับของ': 'SD00',
  'ขึ้นของ': 'SD01',
  'กำลังจัดส่ง': 'SD02',
  'เช็คอิน': 'SD03',
  'พบปัญหา': 'SD04',
  'การจัดส่งสำเร็จ': 'SD05',
  'รับเอกสารกลับ': 'SD06',
  'เช็คเอ้าท์': 'SD07',
  'การดำเนินการสำเร็จ': 'SD09',
  'ยกเลิก': 'SD10',
};

// สถานะที่ต้องถ่ายรูปก่อน update
const REQUIRES_PHOTO = ['ขึ้นของ', 'เช็คอิน', 'การดำเนินการสำเร็จ'];

const ViewDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { item } = route.params;
  const { user } = useContext(AuthContext)!;

  const [statusList, setStatusList] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [detail, setDetail] = useState('');
  const [box, setBox] = useState('');
  const [mile, setMile] = useState('');
  const [photo, setPhoto] = useState<{ uri: string; base64: string } | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [updating, setUpdating] = useState(false);

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
        const names = response.listStatus.map(s => s.status_name);
        setStatusList(names);
        setSelectedStatus(names[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleTakePhoto = () => {
    launchCamera(
      { mediaType: 'photo', includeBase64: true, quality: 0.6 },
      (response) => {
        if (response.didCancel || response.errorCode) return;
        const asset = response.assets?.[0];
        if (asset?.uri && asset?.base64) {
          setPhoto({ uri: asset.uri, base64: asset.base64 });
        }
      },
    );
  };

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

  Alert.alert('ยืนยัน', `ต้องการอัปเดตสถานะเป็น "${selectedStatus}" ใช่ไหม?`, [
    { text: 'ยกเลิก', style: 'cancel' },
    {
      text: 'ยืนยัน',
      onPress: async () => {
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

          let response;

          // ✅ เรียก UpdatePicture เฉพาะเมื่อ needsPhoto AND มีรูปจริงๆ
          if (needsPhoto && photo) {
            console.log('📸 calling UpdatePicture');
            response = await updatePicture({ ...baseParams, picture: photo.base64 });
          } else {
            console.log('📝 calling UpdateStatus');
            response = await updateStatus(baseParams);
          }

          console.log('📦 response:', JSON.stringify(response));
          Alert.alert('สำเร็จ', response.message, [
            { text: 'ตกลง', onPress: () => navigation.goBack() },
          ]);
        } catch (err) {
          Alert.alert('ข้อผิดพลาด', 'อัปเดตสถานะไม่สำเร็จ');
          console.error(err);
        } finally {
          setUpdating(false);
        }
      },
    },
  ]);
};

  const isBoxEnabled = selectedStatus === 'ขึ้นของ';
  const isMileEnabled = selectedStatus === 'กำลังจัดส่ง' || selectedStatus === 'การดำเนินการสำเร็จ';
  const needsPhoto = REQUIRES_PHOTO.includes(selectedStatus);
  //const isUpdateEnabled = !['ขึ้นของ','การจัดส่งสำเร็จ', 'รับเอกสารกลับ'].includes(selectedStatus);

  const isUpdateEnabled = true;
  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content} 
      showsVerticalScrollIndicator={false}
    >

      {/* ข้อมูลงาน */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>ข้อมูลงาน</Text>
        <Row label="Request ID" value={item.request_id} />
        <Row label="ประเภท" value={item.type_name} />
        <Row label="ปลายทาง" value={item.to_company} />
        <Row label="วันที่" value={`${item.d_date} ${item.d_time}`} />
        <Row label="สถานะปัจจุบัน" value={item.status_name} highlight />
      </View>

      {/* อัปเดตสถานะ */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>อัปเดตสถานะ</Text>

        {loadingStatus ? (
          <ActivityIndicator color="#a7cc43" style={{ marginVertical: 12 }} />
        ) : (
          <Picker
            selectedValue={selectedStatus}
            onValueChange={(val) => {
              setSelectedStatus(val);
              setPhoto(null); // reset รูปเมื่อเปลี่ยนสถานะ
            }}
            style={styles.picker}
          >
            {statusList.map(s => (
              <Picker.Item key={s} label={s} value={s} />
            ))}
          </Picker>
        )}

        {/* ถ่ายรูป — แสดงเฉพาะสถานะที่ต้องรูป */}
        {needsPhoto && (
          <View style={styles.photoSection}>
            <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
              <Text style={styles.photoButtonText}>
                {photo ? '📷 ถ่ายรูปใหม่' : '📷 ถ่ายรูป (จำเป็น)'}
              </Text>
            </TouchableOpacity>
            {photo && (
              <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
            )}
            {!photo && (
              <Text style={styles.photoHint}>* สถานะนี้ต้องถ่ายรูปก่อนยืนยัน</Text>
            )}
          </View>
        )}

        <Text style={styles.fieldLabel}>จำนวนกล่อง :</Text>
        <TextInput
          style={[styles.input, !isBoxEnabled && styles.inputDisabled]}
          keyboardType="numeric"
          value={box}
          onChangeText={(text) => setBox(text.replace(/[^0-9]/g, ''))}
          editable={isBoxEnabled}
          placeholder="จำนวนกล่อง"
        />

        <Text style={styles.fieldLabel}>เลขไมล์ :</Text>
        <TextInput
          style={[styles.input, !isMileEnabled && styles.inputDisabled]}
          keyboardType="numeric"
          value={mile}
          onChangeText={(text) => setMile(text.replace(/[^0-9]/g, ''))}
          editable={isMileEnabled}
          placeholder="เลขไมล์"
        />

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
          (!isUpdateEnabled || updating || (needsPhoto && !photo)) && styles.buttonDisabled,
        ]}
        onPress={handleUpdate}
        disabled={!isUpdateEnabled || updating || (needsPhoto && !photo)}
      >
        {updating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.confirmText}>✓ ยืนยันอัปเดตสถานะ</Text>
        )}
      </TouchableOpacity>
          {/* spacer แทน bottom nav */}
      <View style={{ height: insets.bottom + 120 }} />
    </ScrollView>
  );
};

const Row = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label} :</Text>
    <Text style={[styles.rowValue, highlight && styles.highlightValue]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 16 },
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
  row: { flexDirection: 'row', marginBottom: 8, flexWrap: 'wrap' },
  rowLabel: { fontWeight: 'bold', fontSize: 14, color: '#555', width: 120 },
  rowValue: { fontSize: 14, color: '#333', flex: 1 },
  highlightValue: { color: '#e67e22', fontWeight: 'bold' },
  picker: { marginBottom: 8 },
  photoSection: { marginVertical: 12, alignItems: 'center' },
  photoButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  photoButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 10,
    resizeMode: 'cover',
  },
  photoHint: { color: '#e74c3c', fontSize: 12, marginTop: 6 },
  fieldLabel: { fontWeight: 'bold', fontSize: 14, color: '#555', marginTop: 8, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
  },
  inputDisabled: { backgroundColor: '#f0f0f0', color: '#aaa' },
  inputMultiline: { height: 80, textAlignVertical: 'top' },
  confirmButton: {
    backgroundColor: '#a7cc43',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 28,
  },
  buttonDisabled: { backgroundColor: '#ccc' },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default ViewDetailScreen;