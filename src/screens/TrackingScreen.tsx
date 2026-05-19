import React, {useEffect, useState, useContext} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Image, Modal,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types/navigationTypes';
import {AuthContext} from '../context/AuthProvider';
import {getBaseUrlByCompany, API_ENDPOINTS} from '../config/apiConfig';
import Icon from 'react-native-vector-icons/FontAwesome5';

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

const PICTURE_BASE_URL = 'http://172.16.1.230/logistics/';

export default function TrackingScreen({route, navigation}: Props) {
  const {requestId} = route.params;
  const {companyColor} = useContext(AuthContext)!;
  const color = companyColor ?? '#a7cc43';

  const [trackList,     setTrackList]     = useState<Track[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  useEffect(() => { fetchTracking(); }, []);

  const fetchTracking = async () => {
    try {
      setLoading(true);
      const baseUrl = await getBaseUrlByCompany();
      const url = `${baseUrl}${API_ENDPOINTS.TRACK}`;
      const formData = new FormData();
      formData.append('request_id', requestId);
      const res = await fetch(url, {method: 'POST', body: formData});
      const obj = await res.json();
      if (!obj.error) {
        setTrackList(obj.Track ?? []);
      } else {
        Alert.alert('แจ้งเตือน', obj.message);
      }
    } catch (e) {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const getImageUri = (value: string | null | undefined): string | null => {
    if (!value || value.trim() === '') return null;
    if (value.startsWith('http') || value.startsWith('data:')) return value;
    return `${PICTURE_BASE_URL}${value}`;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={color} />
        <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Request ID Card */}
        <View style={styles.card}>
          <Text style={styles.requestId}>{requestId}</Text>
        </View>

        {/* Track Table */}
        <View style={styles.card}>
          <View style={[styles.tableRow, styles.headerRow]}>
            <Text style={[styles.headerCell, {flex: 1.4}]}>Date</Text>
            <Text style={[styles.headerCell, {flex: 1.1}]}>Time</Text>
            <Text style={[styles.headerCell, {flex: 2}]}>Status</Text>
            <Text style={[styles.headerCell, {flex: 1.4}]}>Remark</Text>
          </View>

          {trackList.length === 0 ? (
            <Text style={styles.empty}>ไม่พบข้อมูล</Text>
          ) : (
            trackList.map((track, index) => {
              const hasPicture  = !!getImageUri(track.picture);
              const hasSignature =
                !!getImageUri(track.esig_cus) &&
                track.status_name === 'การจัดส่งสำเร็จ';

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.tableRow,
                    index % 2 === 0 ? styles.rowEven : styles.rowOdd,
                  ]}
                  onPress={() => setSelectedTrack(track)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cell, {flex: 1.4}]}>{track.date}</Text>
                  <Text style={[styles.cell, {flex: 1.1}]}>{track.time}</Text>
                  <View style={[styles.cellRow, {flex: 2}]}>
                    <Text
                      style={[styles.cell, (hasPicture || hasSignature) && {color}]}
                      numberOfLines={2}
                    >
                      {track.status_name}
                    </Text>
                    {hasPicture && (
                      <Icon name="image" size={13} color={color} style={styles.cellIcon} />
                    )}
                    {hasSignature && (
                      <Icon name="signature" size={13} color={color} style={styles.cellIcon} />
                    )}
                  </View>
                  <Text style={[styles.cell, {flex: 1.4}]} numberOfLines={0}>
                    {track.detail}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={styles.closebt}>
          <TouchableOpacity
            style={[styles.closeBtn, {backgroundColor: color}]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.closeBtnText}>ปิด</Text>
          </TouchableOpacity>
        </View>
        <View style={{height: 40}} />
      </ScrollView>

      {/* ── Detail Modal ── */}
      <Modal
        visible={!!selectedTrack}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTrack(null)}
      >
        {/* overlay — กดพื้นที่ด้านบนเพื่อปิด */}
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            onPress={() => setSelectedTrack(null)}
          />

          {/* กล่อง content — ใช้ View ไม่ใช้ TouchableOpacity */}
          <View style={styles.modalContainer}>

            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color}]}>รายละเอียด</Text>
              <TouchableOpacity
                onPress={() => setSelectedTrack(null)}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              >
                <Text style={styles.modalXBtn}></Text>
              </TouchableOpacity>
            </View>

            {/* ScrollView */}
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
              bounces={true}
            >
              <DetailRow label="วันที่"     value={selectedTrack?.date ?? ''} />
              <DetailRow label="เวลา"       value={selectedTrack?.time ?? ''} />
              <DetailRow label="สถานะ"      value={selectedTrack?.status_name ?? ''} />
              <DetailRow label="รายละเอียด" value={selectedTrack?.detail ?? ''} />

              {/* รูปภาพ */}
              {!!getImageUri(selectedTrack?.picture) && (
                <View style={styles.imageSection}>
                  <View style={styles.imageLabelRow}>
                    <Icon name="image" size={14} color={color} />
                    <Text style={[styles.detailLabel, {color, marginLeft: 6}]}>รูปภาพ :</Text>
                  </View>
                  <Image
                    source={{uri: getImageUri(selectedTrack!.picture)!}}
                    style={styles.trackImage}
                    resizeMode="contain"
                  />
                </View>
              )}

              {/* ลายเซ็นผู้รับสินค้า */}
              {!!getImageUri(selectedTrack?.esig_cus) &&
                selectedTrack?.status_name === 'การจัดส่งสำเร็จ' && (
                <View style={styles.imageSection}>
                  <View style={styles.imageLabelRow}>
                    <Icon name="signature" size={14} color={color} />
                    <Text style={[styles.detailLabel, {color, marginLeft: 6}]}>ลายเซ็นผู้รับสินค้า :</Text>
                  </View>
                  <Image
                    source={{uri: getImageUri(selectedTrack!.esig_cus)!}}
                    style={styles.signatureImage}
                    resizeMode="contain"
                  />
                </View>
              )}

              {/* ลายเซ็นผู้ส่ง */}
              {!!getImageUri(selectedTrack?.esig_req) &&
                selectedTrack?.status_name === 'การจัดส่งสำเร็จ' && (
                <View style={styles.imageSection}>
                  <View style={styles.imageLabelRow}>
                    <Icon name="signature" size={14} color={color} />
                    <Text style={[styles.detailLabel, {color, marginLeft: 6}]}>ลายเซ็นผู้ส่ง :</Text>
                  </View>
                  <Image
                    source={{uri: getImageUri(selectedTrack!.esig_req)!}}
                    style={styles.signatureImage}
                    resizeMode="contain"
                  />
                </View>
              )}

              <View style={styles.closebt}>
                <TouchableOpacity
                  style={[styles.modalClose, {backgroundColor: color}]}
                  onPress={() => setSelectedTrack(null)}
                >
                  <Text style={styles.modalCloseText}>ปิด</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

          </View>
        </View>
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
  wrapper:     {flex: 1, backgroundColor: '#93D500'},
  container:   {flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20},
  content:     {padding: 32, borderRadius: 28},
  center:      {flex: 1, justifyContent: 'center', alignItems: 'center'},
  loadingText: {marginTop: 12, color: '#666'},

  card: {
    backgroundColor: '#fff',
    borderRadius:    8,
    padding:         12,
    marginBottom:    20,
    borderWidth:     1,
    borderColor:     '#ddd',
    elevation:       1,
  },
  requestId: {fontSize: 15, fontFamily: 'Quicksand-Bold', color: '#333'},

  tableRow: {
    flexDirection:     'row',
    paddingVertical:   9,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems:        'center',
  },
  headerRow: {
    backgroundColor:   '#f8f9fa',
    borderBottomWidth: 2,
    borderBottomColor: '#dee2e6',
  },
  headerCell: {fontSize: 12, fontFamily: 'Quicksand-Bold', color: '#333', textAlign: 'center'},
  rowEven:    {backgroundColor: '#fff'},
  rowOdd:     {backgroundColor: '#93D5001A'},
  cell:       {fontSize: 11, color: '#444', textAlign: 'center'},
  cellRow:    {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap'},
  cellIcon:   {marginLeft: 4},
  empty:      {textAlign: 'center', color: '#aaa', paddingVertical: 20},

  closeBtn: {
    flexDirection:  'row',
    padding:        12,
    borderRadius:   12,
    width:          '70%',
    alignItems:     'center',
    justifyContent: 'center',
    paddingBottom: 30,
  },
  closeBtnText: {color: '#fff', fontSize: 16, fontFamily: 'Quicksand-Bold'},
  closebt:      {marginVertical: 12, alignItems: 'center'},

  // ── Modal ──
  modalOverlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent:  'flex-end',
  },
  modalDismissArea: {
    flex: 1,                   // ✅ พื้นที่ด้านบน กดปิด modal
  },
  modalContainer: {
    backgroundColor:      '#fff',
    borderTopLeftRadius:  20,
    borderTopRightRadius: 20,
    height:               '90%',           // ✅ กำหนดความสูง
    padding:              20,
    paddingBottom: 150,
  },
  modalHeader: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    marginBottom:      16,
    paddingBottom:     12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {fontSize: 16, fontFamily: 'Quicksand-Bold'},
  modalXBtn:  {fontSize: 20, color: '#999'},

  modalScroll: {
    flex: 1,                   // ✅ สำคัญมาก — ทำให้ scroll ได้
  },
  modalScrollContent: {
    paddingBottom: 80,
  },

  detailRow:   {flexDirection: 'row', marginBottom: 10},
  detailLabel: {fontFamily: 'Quicksand-Bold', fontSize: 14, color: '#555', width: 130},
  detailValue: {fontSize: 14, color: '#333', flex: 1},

  imageLabelRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 4},
  imageSection:  {marginTop: 12},
  trackImage: {
    width:           '100%',
    height:          220,
    borderRadius:    10,
    marginTop:       8,
    backgroundColor: '#f0f0f0',
  },
  signatureImage: {
    width:           '100%',
    height:          140,
    borderRadius:    10,
    marginTop:       8,
    backgroundColor: '#f9f9f9',
    borderWidth:     1,
    borderColor:     '#eee',
  },

  modalClose: {
    borderRadius:    10,
    paddingVertical: 14,
    alignItems:      'center',
    marginTop:       20,
    width:           '70%',
  },
  modalCloseText: {color: '#fff', fontFamily: 'Quicksand-Bold', fontSize: 16},
});