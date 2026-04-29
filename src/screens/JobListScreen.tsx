import React, { useState, useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigationTypes';
import { AuthContext } from '../context/AuthProvider';
import { getMyJobs } from '../services/apiService';
import { JobItem } from '../types/jobTypes';

type Props = NativeStackScreenProps<RootStackParamList, 'JobList'>;

const toApiDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const toDisplayDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${d}/${m}/${y}`;
};

const STATUS_OPTIONS = [
  { label: 'ทั้งหมด', value: '01' },
  { label: 'กำลังดำเนินการ', value: '02' },
  { label: 'ดำเนินการสำเร็จ', value: '03' },
  { label: 'ยกเลิก', value: '04' },
];

const JobListScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useContext(AuthContext)!;
  const today = new Date();

  const [startDate, setStartDate] = useState<Date>(today);
  const [endDate, setEndDate] = useState<Date>(today);
  const [tempDate, setTempDate] = useState<Date>(today);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [status, setStatus] = useState('01');
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMyJobs({
        driver: user.id,
        start: toApiDate(startDate),
        end: toApiDate(endDate),
        status,
      });
      if (response.error) {
        setJobs([]);
        setError(response.message ?? 'ไม่พบข้อมูล');
        return;
      }
      setJobs(response.MyJobs);
    } catch (err) {
      setError('โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: JobItem }) => (
    <TouchableOpacity
      style={styles.jobItem}
      onPress={() => navigation.navigate('ViewDetail', { item })}
      activeOpacity={0.7}
    >
      <Text style={styles.jobTitle}>Request ID: {item.request_id}</Text>
      <Text style={styles.jobDetail}>ประเภท: {item.type_name}</Text>
      <Text style={styles.jobDetail}>ปลายทาง: {item.to_company}</Text>
      <Text style={styles.jobDetail}>วันที่: {item.d_date} {item.d_time}</Text>
      <Text style={[
        styles.jobStatus,
        item.status_id === 'SD09' || item.status_id === 'SD10'
          ? styles.statusDone
          : styles.statusActive,
      ]}>
        {item.status_name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>

      {/* Start Date Modal */}
      <Modal transparent visible={showStartPicker} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>เลือกวันที่เริ่ม</Text>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={(_, date) => {
                if (date) setTempDate(date);
              }}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowStartPicker(false)}
              >
                <Text style={styles.cancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                  setStartDate(tempDate);
                  if (tempDate > endDate) setEndDate(tempDate);
                  setShowStartPicker(false);
                }}
              >
                <Text style={styles.confirmText}>ตกลง</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* End Date Modal */}
      <Modal transparent visible={showEndPicker} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>เลือกวันที่สิ้นสุด</Text>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              minimumDate={startDate}
              onChange={(_, date) => {
                if (date) setTempDate(date);
              }}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEndPicker(false)}
              >
                <Text style={styles.cancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                  setEndDate(tempDate);
                  setShowEndPicker(false);
                }}
              >
                <Text style={styles.confirmText}>ตกลง</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Row */}
      <View style={styles.dateRow}>
        <View style={styles.dateBlock}>
          <Text style={styles.label}>วันที่เริ่ม</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => {
              setTempDate(startDate);
              setShowStartPicker(true);
            }}
          >
            <Text>{toDisplayDate(startDate)}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.dateBlock}>
          <Text style={styles.label}>วันที่สิ้นสุด</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => {
              setTempDate(endDate);
              setShowEndPicker(true);
            }}
          >
            <Text>{toDisplayDate(endDate)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Picker */}
      <View style={styles.filterRow}>
        <Text style={styles.label}>สถานะ :</Text>
        <Picker
          selectedValue={status}
          onValueChange={setStatus}
          style={styles.picker}
        >
          {STATUS_OPTIONS.map(opt => (
            <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
          ))}
        </Picker>
      </View>

      {/* Search Button */}
      <TouchableOpacity style={styles.searchButton} onPress={fetchJobs}>
        <Text style={styles.searchText}>ค้นหา</Text>
      </TouchableOpacity>

      {/* Results */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#a7cc43" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={item => item.request_id}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>กดค้นหาเพื่อดูรายการงาน</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  dateRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  dateBlock: { flex: 1 },
  label: { fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
  },
  filterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  picker: { flex: 1 },
  searchButton: {
    backgroundColor: '#a7cc43',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  searchText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  jobItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 4,
  },
  jobTitle: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  jobDetail: { fontSize: 14, color: '#666' },
  jobStatus: { fontSize: 13, fontWeight: 'bold', marginTop: 4 },
  statusActive: { color: '#e67e22' },
  statusDone: { color: '#27ae60' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  errorText: { color: '#e74c3c', fontSize: 15 },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 40 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  cancelText: { color: '#666', fontSize: 15 },
  confirmButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#a7cc43',
    alignItems: 'center',
  },
  confirmText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});

export default JobListScreen;