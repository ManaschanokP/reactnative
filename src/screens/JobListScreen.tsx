import React, {useState, useContext, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import DatePicker, {DateType} from 'react-native-ui-datepicker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {Button} from 'react-native-elements';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native'; //เพิ่ม
import {RootStackParamList} from '../types/navigationTypes';
import {AuthContext} from '../context/AuthProvider';
import {getMyJobs} from '../services/apiService';
import {JobItem} from '../types/jobTypes';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'JobList'>;

const toApiDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const STATUS_OPTIONS = [
  {label: 'ทั้งหมด', value: '01'},
  {label: 'กำลังดำเนินการ', value: '02'},
  {label: 'ดำเนินการสำเร็จ', value: '03'},
  {label: 'ยกเลิก', value: '04'},
];

const JobListScreen: React.FC<Props> = ({navigation}) => {
  const {user} = useContext(AuthContext)!;
  const insets = useSafeAreaInsets();
  const today = new Date();

  const [startDate, setStartDate] = useState<Date>(today);
  const [endDate, setEndDate] = useState<Date>(today);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [status, setStatus] = useState('01');
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  //re-fetch อัตโนมัติเมื่อกลับจาก ViewDetail
  useFocusEffect(
    useCallback(() => {
      // re-fetch เฉพาะถ้ามีข้อมูลอยู่แล้ว (เคยกดค้นหาไปแล้ว)
      if (jobs.length > 0) {
        fetchJobs();
      }
    }, [startDate, endDate, status]),
  );

  const handleStartDateChange = (params: {date: DateType}) => {
    if (params.date instanceof Date) {
      setStartDate(params.date);
      if (params.date > endDate) setEndDate(params.date);
      setShowStartPicker(false);
    }
  };

  const handleEndDateChange = (params: {date: DateType}) => {
    if (params.date instanceof Date) {
      setEndDate(params.date);
      setShowEndPicker(false);
    }
  };

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

      //เพิ่มตรงนี้ แทน setJobs(response.MyJobs)
      const sorted = [...response.MyJobs].sort((a, b) => {
        const parseDate = (date: string, time: string) => {
          if (date.includes('/')) {
            const [d, m, y] = date.split('/');
            return new Date(`${y}-${m}-${d} ${time}`).getTime();
          }
          return new Date(`${date} ${time}`).getTime();
        };
        return parseDate(b.d_date, b.d_time) - parseDate(a.d_date, a.d_time);
      });
      setJobs(sorted);
    } catch (err) {
      setError('โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({item}: {item: JobItem}) => (
    <TouchableOpacity
      style={styles.jobItem}
      onPress={() => navigation.navigate('ViewDetail', {item})}
      activeOpacity={0.7}>
      <Text style={styles.jobTitle}>Request ID: {item.request_id}</Text>
      <Text style={styles.jobDetail}>ประเภท: {item.type_name}</Text>
      <Text style={styles.jobDetail}>ปลายทาง: {item.to_company}</Text>
      <Text style={styles.jobDetail}>
        วันที่: {item.d_date} {item.d_time}
      </Text>
      <Text
        style={[
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
      <Modal visible={showStartPicker} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <DatePicker
              mode="single"
              date={startDate}
              onChange={handleStartDateChange}
            />
            <Button title="ปิด" onPress={() => setShowStartPicker(false)} />
          </View>
        </View>
      </Modal>

      {/* End Date Modal */}
      <Modal visible={showEndPicker} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <DatePicker
              mode="single"
              date={endDate}
              minDate={startDate}
              onChange={handleEndDateChange}
            />
            <Button title="ปิด" onPress={() => setShowEndPicker(false)} />
          </View>
        </View>
      </Modal>

      {/* Date Row */}
      <View style={styles.dateRow}>
        <View style={styles.dateBlock}>
          <Text style={styles.label}>เริ่ม :</Text>
          <TouchableOpacity
            onPress={() => setShowStartPicker(true)}
            style={styles.dateInputRow}>
            <Text style={styles.dateText}>
              {startDate.toLocaleDateString('th-TH')}
            </Text>
            <MaterialIcons name="date-range" size={20} color="#a7cc43" />
          </TouchableOpacity>
        </View>
        <View style={styles.dateBlock}>
          <Text style={styles.label}>สิ้นสุด :</Text>
          <TouchableOpacity
            onPress={() => setShowEndPicker(true)}
            style={styles.dateInputRow}>
            <Text style={styles.dateText}>
              {endDate.toLocaleDateString('th-TH')}
            </Text>
            <MaterialIcons name="date-range" size={20} color="#a7cc43" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Picker */}
      <View style={styles.filterRow}>
        <Text style={styles.label}>สถานะ :</Text>
        <Picker
          selectedValue={status}
          onValueChange={setStatus}
          style={styles.picker}>
          {STATUS_OPTIONS.map(opt => (
            <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
          ))}
        </Picker>
      </View>

      {/* Search Button */}
      <TouchableOpacity style={styles.searchButton} onPress={fetchJobs}>
        <Text style={styles.searchText}> ค้นหา</Text>
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
          //pull to refresh
          onRefresh={fetchJobs}
          refreshing={loading}
          ListEmptyComponent={
            <Text style={styles.emptyText}>กดค้นหาเพื่อดูรายการงาน</Text>
          }
        />
      )}

      <View style={{height: insets.bottom + 20}} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16, backgroundColor: '#fff'},
  dateRow: {flexDirection: 'row', gap: 8, marginBottom: 10},
  dateBlock: {flex: 1, marginBottom: 8, minHeight: 60},
  label: {fontWeight: 'bold', fontSize: 14, marginBottom: 4},
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginTop: 4,
    backgroundColor: '#fafafa',
  },
  dateText: {fontSize: 12, color: '#333'},
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  picker: {flex: 1},
  searchButton: {
    backgroundColor: '#a7cc43',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  searchText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
  jobItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 4,
  },
  jobTitle: {fontSize: 15, fontWeight: 'bold', color: '#333'},
  jobDetail: {fontSize: 14, color: '#666'},
  jobStatus: {fontSize: 13, fontWeight: 'bold', marginTop: 4},
  statusActive: {color: '#e67e22'},
  statusDone: {color: '#27ae60'},
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  errorText: {color: '#e74c3c', fontSize: 15},
  emptyText: {textAlign: 'center', color: '#aaa', marginTop: 40},
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
});

export default JobListScreen;
