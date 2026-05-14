import React, {useEffect, useState, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types/navigationTypes';
import {AuthContext} from '../context/AuthProvider';
import {getBaseUrlByCompany, API_ENDPOINTS} from '../config/apiConfig';

type Props = NativeStackScreenProps<RootStackParamList, 'Tracking'>;

interface Track {
  date: string;
  time: string;
  status_name: string;
  detail: string;
  picture: string | null;
  esig_cus: string | null;
  esig_req: string | null;
}

export default function TrackingScreen({route, navigation}: Props) {
  const {requestId} = route.params;
  const {user} = useContext(AuthContext)!;

  const [trackList, setTrackList] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  useEffect(() => {
    fetchTracking();
  }, []);

  console.log('📦 route.params:', route.params);

  const fetchTracking = async () => {
    try {
      setLoading(true);
      const baseUrl = await getBaseUrlByCompany();
      const url = `${baseUrl}${API_ENDPOINTS.TRACK}`;
      console.log('url', url);
      const formData = new FormData();
      formData.append('request_id', requestId);
      console.log('formData', formData);
      const res = await fetch(url, {method: 'POST', body: formData});
      const obj = await res.json();

      if (!obj.error) {
        setTrackList(obj.Track ?? []);
      } else {
        Alert.alert('แจ้งเตือน', obj.message);
      }
    } catch (e) {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลได้');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  //ดึง base URL สำหรับรูปภาพ
  const PICTURE_BASE_URL = 'http://172.16.1.230/logistics/';

  const getImageUri = (value: string | null | undefined) => {
    if (!value || value.trim() === '') return null;
    if (value.startsWith('http') || value.startsWith('data:')) return value;
    //ต่อ URL เสมอ
    return `${PICTURE_BASE_URL}${value}`;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2bbbad" />
        <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}>
        {/* Request ID */}
        <View style={styles.card}>
          <Text style={styles.requestId}>{requestId}</Text>
        </View>

        {/* Track Table */}
        <View style={styles.card}>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.headerCell, {flex: 1.3}]}>Date</Text>
            <Text style={[styles.headerCell, {flex: 1.1}]}>Time</Text>
            <Text style={[styles.headerCell, {flex: 2}]}>Status</Text>
            <Text style={[styles.headerCell, {flex: 1.5}]}>Remark</Text>
          </View>

          {trackList.length === 0 ? (
            <Text style={styles.empty}>ไม่พบข้อมูล</Text>
          ) : (
            trackList.map((track, index) => {
              //เช็คว่าสถานะคือ "การจัดส่งสำเร็จ" ถึงจะอนุญาตให้แสดงลายเซ็น
              const isDeliverySuccess = track.status_name === 'การจัดส่งสำเร็จ';
              const showSignatureIcon =
                getImageUri(track.esig_cus) && isDeliverySuccess;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.row,
                    index % 2 === 0 ? styles.rowEven : styles.rowOdd,
                  ]}
                  onPress={() => setSelectedTrack(track)}
                  activeOpacity={0.7}>
                  <Text style={[styles.cell, {flex: 1.3}]}>{track.date}</Text>
                  <Text style={[styles.cell, {flex: 1.1}]}>{track.time}</Text>
                  <Text
                    style={[
                      styles.cell,
                      {flex: 2},
                      !!(track.picture || showSignatureIcon) &&
                        styles.cellHighlight,
                    ]}>
                    {track.status_name}
                    {getImageUri(track.picture) ? ' 🖼' : ''}
                    {showSignatureIcon ? ' ✍️' : ''}
                  </Text>
                  <Text style={[styles.cell, {flex: 1.5}]}>{track.detail}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}>
          <Text style={styles.closeBtnText}>Close</Text>
        </TouchableOpacity>

        <View style={{height: 40}} />
      </ScrollView>

      {/* Modal */}
      <Modal
        visible={!!selectedTrack}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTrack(null)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedTrack(null)}>
          <TouchableOpacity
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={e => e.stopPropagation()}>
            <SafeAreaView style={styles.modalInner}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>รายละเอียด</Text>
                <TouchableOpacity
                  onPress={() => setSelectedTrack(null)}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Text style={styles.modalXBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollContent}>
                <DetailRow label="วันที่" value={selectedTrack?.date ?? ''} />
                <DetailRow label="เวลา" value={selectedTrack?.time ?? ''} />
                <DetailRow
                  label="สถานะ"
                  value={selectedTrack?.status_name ?? ''}
                />
                <DetailRow
                  label="รายละเอียด"
                  value={selectedTrack?.detail ?? ''}
                />

                {/* รูปภาพ */}
                {!!getImageUri(selectedTrack?.picture) && (
                  <View style={styles.imageSection}>
                    <Text style={styles.detailLabel}>รูปภาพ :</Text>
                    <Image
                      source={{uri: getImageUri(selectedTrack!.picture)!}}
                      style={styles.trackImage}
                      resizeMode="contain"
                      onError={e =>
                        console.log('picture error:', e.nativeEvent.error)
                      }
                    />
                  </View>
                )}

                {/*ลายเซ็นผู้รับสินค้า (แสดงเฉพาะสถานะ 'การจัดส่งสำเร็จ') */}
                {!!getImageUri(selectedTrack?.esig_cus) &&
                  selectedTrack?.status_name === 'การจัดส่งสำเร็จ' && (
                    <View style={styles.imageSection}>
                      <Text style={styles.detailLabel}>
                        ลายเซ็นผู้รับสินค้า :
                      </Text>
                      <Image
                        source={{uri: getImageUri(selectedTrack!.esig_cus)!}}
                        style={styles.signatureImage}
                        resizeMode="contain"
                      />
                    </View>
                  )}

                {/* ลายเซ็นผู้ส่ง (แสดงเฉพาะสถานะ 'การจัดส่งสำเร็จ') */}
                {!!getImageUri(selectedTrack?.esig_req) &&
                  selectedTrack?.status_name === 'การจัดส่งสำเร็จ' && (
                    <View style={styles.imageSection}>
                      <Text style={styles.detailLabel}>ลายเซ็นผู้ส่ง :</Text>
                      <Image
                        source={{uri: getImageUri(selectedTrack!.esig_req)!}}
                        style={styles.signatureImage}
                        resizeMode="contain"
                      />
                    </View>
                  )}

                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setSelectedTrack(null)}>
                  <Text style={styles.modalCloseText}>ปิด</Text>
                </TouchableOpacity>

                <View style={{height: 20}} />
              </ScrollView>
            </SafeAreaView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const DetailRow = ({label, value}: {label: string; value: string}) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label} :</Text>
    <Text style={styles.detailValue}>{value || '-'}</Text>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {flex: 1, backgroundColor: '#f0f0f0'},
  container: {flex: 1},
  content: {padding: 12},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  loadingText: {marginTop: 12, color: '#666'},

  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 1,
  },
  requestId: { fontSize: 15, color: '#333', fontFamily: '500' },

  row: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerRow: {
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 2,
    borderBottomColor: '#dee2e6',
  },
  headerCell: { fontSize: 12, fontFamily: 'bold', color: '#333', textAlign: 'center' },
  rowEven: { backgroundColor: '#fff' },
  rowOdd: { backgroundColor: '#f8f9fa' },
  cell: { fontSize: 11, color: '#444', textAlign: 'center' },
  cellHighlight: { color: '#2bbbad', fontFamily: '600' },
  empty: { textAlign: 'center', color: '#aaa', paddingVertical: 20 },

  closeBtn: {
    backgroundColor: '#2bbbad',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 15, fontFamily: 'bold' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '92%',
    overflow: 'hidden',
  },
  modalInner: {
    flex: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: { fontSize: 17, fontFamily: 'bold', color: '#2bbbad' },
  modalXBtn: { fontSize: 20, color: '#999' },
  modalScrollContent: { paddingBottom: 20 },

  detailRow: { flexDirection: 'row', marginBottom: 10 },
  detailLabel: { fontFamily: 'bold', fontSize: 13, color: '#555', width: 130 },
  detailValue: { fontSize: 13, color: '#333', flex: 1 },

  imageSection: {marginTop: 12},
  trackImage: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    marginTop: 8,
    backgroundColor: '#f0f0f0',
  },
  signatureImage: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    marginTop: 8,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#eee',
  },

  modalClose: {
    backgroundColor: '#2bbbad',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  modalCloseText: { color: '#fff', fontFamily: 'bold', fontSize: 15 },
});
