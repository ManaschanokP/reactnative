import React, {useState, useContext, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  Image,
  useWindowDimensions,
  Dimensions,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import DatePicker, {DateType} from 'react-native-ui-datepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Button} from 'react-native-elements';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {RootStackParamList} from '../types/navigationTypes';
import {AuthContext} from '../context/AuthProvider';
import {getMyJobs} from '../services/apiService';
import {JobItem} from '../types/jobTypes';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import IonIcon from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {SafeAreaView} from 'react-native-safe-area-context';
import StatusIdCardIcon from '../../assets/ID-TGL.svg';
import StatusMask from '../../assets/Status-Mark.svg';
import StatusCalendar from '../../assets/Status-Calendar.svg';
import StatusPackage from '../../assets/Status-Package.svg';
import StatusCar from '../../assets/Status-Car.svg';

type Props = NativeStackScreenProps<RootStackParamList, 'JobList'>;

const toApiDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const toDisplayDate = (date: Date): string => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

const STATUS_OPTIONS = [
  {label: 'ทั้งหมด', value: '01'},
  {label: 'กำลังดำเนินการ', value: '02'},
  {label: 'ดำเนินการสำเร็จ', value: '03'},
  {label: 'พบปัญหา', value: '04'},
];

// ✅ สีและข้อความตาม status
const getStatusStyle = (statusId: string, statusName?: string) => {
  if (statusId === 'SD09' || statusName === 'ดำเนินการสำเร็จ')
    return {bg: '#e4e4e4', text: '#373737', dot: '#373737'};
  if (statusId === 'SD04' || statusName === 'พบปัญหา')
    return {bg: '#fdecea', text: '#e74c3c', dot: '#e74c3c'};
  return {bg: '#e8f5e9', text: '#27ae60', dot: '#27ae60'};
};

const JobListScreen: React.FC<Props> = ({navigation}) => {
  const {user, companyColor} = useContext(AuthContext)!;
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

  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const {width} = useWindowDimensions();
  const numColumns = width >= 600 ? 2 : 1;
  const {height} = Dimensions.get('window');

  useFocusEffect(
    useCallback(() => {
      if (jobs.length > 0) fetchJobs();
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

  const fetchJobs = async (currentStatus = status) => {
    // ✅ รับค่าตรงๆ ไม่ใช้ closure
    try {
      setLoading(true);
      setError(null);
      const response = await getMyJobs({
        driver: user.id,
        start: toApiDate(startDate),
        end: toApiDate(endDate),
        status: '01',
      });
      if (response.error) {
        setJobs([]);
        setError(response.message ?? 'ไม่พบข้อมูล');
        return;
      }
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

      const filtered = sorted.filter(job => {
        if (currentStatus === '01') return true;
        if (currentStatus === '02')
          return job.status_id !== 'SD09' && job.status_id !== 'SD04';
        if (currentStatus === '03')
          return (
            job.status_id === 'SD09' || job.status_name === 'ดำเนินการสำเร็จ'
          );
        if (currentStatus === '04')
          return job.status_id === 'SD04' || job.status_name === 'พบปัญหา';
        return true;
      });

      setJobs(filtered);
    } catch (err) {
      setError('โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({item}: {item: JobItem}) => {
    const statusStyle = getStatusStyle(item.status_id, item.status_name);
    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => {
          if (
            item.status_id !== 'SD09' &&
            item.status_name !== 'ดำเนินการสำเร็จ'
          ) {
            navigation.navigate('ViewDetail', {item});
          }
        }}
        activeOpacity={
          item.status_id === 'SD09' || item.status_name === 'ดำเนินการสำเร็จ'
            ? 1
            : 0.8
        }>
        {/* ── Header row ── */}
        <View style={styles.cardHeader}>
          <View style={styles.idRow}>
            <StatusIdCardIcon width={20} height={20} />
            <Text style={styles.requestId}>{item.request_id}</Text>
          </View>
          <View style={[styles.statusBadge, {backgroundColor: statusStyle.bg}]}>
            <Text style={[styles.statusText, {color: statusStyle.text}]}>
              {item.status_name}
            </Text>
            <View
              style={[styles.statusDot, {backgroundColor: statusStyle.dot}]}
            />
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── ปลายทาง ── */}
        <View style={styles.infoRow}>
          <StatusMask width={20} height={20} color="#373737" />
          <View>
            <Text style={styles.infoLabel}>ปลายทาง</Text>
            <Text style={styles.infoValue}>{item.to_company}</Text>
          </View>
        </View>
        {/* ── ประเภทบริการ ── */}
        <View style={styles.infoRow}>
          <StatusPackage width={20} height={20} color="#373737" />
          <View>
            <Text style={styles.infoLabel}>ประเภทการบริการ</Text>
            <Text style={styles.infoValue}>{item.type_name}</Text>
          </View>
        </View>

        {/* ── วันที่ + สถานะล่าง ── */}
        {/* ── Footer ── */}
        <View style={styles.cardFooter}>
          <View style={styles.footerItemLeft}>
            <StatusCalendar width={20} height={20} color="#373737" />
            <View>
              <Text style={styles.infoLabel}>วันที่ถึงปลายทาง</Text>
              <Text style={styles.footerDate}>
                {item.d_date} {item.d_time}
              </Text>
            </View>
          </View>
          <View style={[styles.footerItemRight]}>
            <StatusCar width={20} height={20} color="#373737" />
            <View>
              <Text style={styles.infoLabel}>สถานะ</Text>
              <Text
                style={[
                  styles.statusText,
                  item.status_id === 'SD04' && {color: '#e74c3c'},
                ]}>
                {item.status_name}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView>
        <View></View>
      </SafeAreaView>
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

      {/* ── Filter Bar ── */}
      <View style={styles.filterBar}>
        {/* Date Row */}
        <View style={styles.dateRow}>
          <View style={styles.dateBlock}>
            <View style={styles.dateBtnRow}>
              <Text style={styles.filterLabel}>วันที่เริ่ม : </Text>
              <TouchableOpacity
                style={styles.dateBtn}
                onPress={() => setShowStartPicker(true)}>
                <Text style={styles.dateBtnText}>{toDisplayDate(startDate)}</Text>
              </TouchableOpacity>
              <Icon name="calendar-month" size={22} color={companyColor} />
            </View>
          </View>

          <View style={styles.dateBlock}>
            <View style={styles.dateBtnRow}>
              <Text style={styles.filterLabel}>วันที่สิ้นสุด : </Text>
              <TouchableOpacity
                style={styles.dateBtn}
                onPress={() => setShowEndPicker(true)}>
                <Text style={styles.dateBtnText}>{toDisplayDate(endDate)}</Text>
              </TouchableOpacity>
              <Icon name="calendar-month" size={22} color={companyColor} />
            </View>
          </View>
        </View>

        {/* Status + Search Row */}
        <View style={styles.statusRow}>
          <Text style={styles.filterLabel}>สถานะ :</Text>
          <View style={{flex: 1}}>
            <TouchableOpacity
              style={styles.dropdownBtn}
              onPress={() => setShowStatusDropdown(p => !p)}>
              <Text style={styles.dropdownBtnText}>
                {STATUS_OPTIONS.find(o => o.value === status)?.label ?? 'ทั้งหมด'}
              </Text>
              <Icon
                name={showStatusDropdown ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={22}
                color="#555"
              />
            </TouchableOpacity>
            {showStatusDropdown && (
              <View style={styles.dropdownList}>
                {STATUS_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setStatus(opt.value);
                      setShowStatusDropdown(false);
                    }}>
                    <Text style={[
                      styles.dropdownItemText,
                      status === opt.value && {color: companyColor ?? '#a7cc43', fontFamily: 'Quicksand-Bold'},
                    ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.searchBtn, {backgroundColor: companyColor}]}
            onPress={() => fetchJobs(status)}>
            <Icon name="search" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Results ── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={companyColor} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <View style={styles.centered}>
            <Image
              source={require('../../assets/NoJob3.png')}
              style={[styles.delivery]}
              resizeMode="contain"
            />
            <Text style={styles.emptyText}>ไม่พบข้อมูล</Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={item => item.request_id}
          renderItem={renderItem}
          key={numColumns} // ✅ force re-render
          numColumns={numColumns}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
          onRefresh={fetchJobs}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Image
                source={require('../../assets/NoJob3.png')}
                style={styles.delivery}
                resizeMode="contain"
              />
              <Text style={styles.emptyText}>กดค้นหาเพื่อดูรายการงาน</Text>
            </View>
          }
        />
      )}

      <View style={{height: insets.bottom + 60}} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f4f6f8'},
  listContent: {
    padding: 12,
    gap: 10,
    flexGrow: 1,
  },

  // Filter bar
  filterBar: {
    //backgroundColor: '#F9F9F9',
    padding: 16,
    elevation: 2,
    gap: 8,
    zIndex: 1, // ✅ เพิ่ม
    overflow: 'visible',
  },
  filterLabel: {
    fontSize: 12,
    color: '#373737',
    marginBottom: 4,
    fontFamily: 'Quicksand-ฺBold',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-end', // ✅ จัดแนวกับ label
},
  dateBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateBlock: {flex: 1 },
  dateBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fafafa',
},
  dateBtnText: {fontSize: 12, color: '#333', fontFamily: 'Quicksand-Medium'},
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center', // ✅ ให้ทุกอย่างชิดล่างเดียวกัน
    gap: 10,
},
  pickerWrap: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    backgroundColor: '#fafafa',
    overflow: 'hidden',
  },
  picker: {
    height: 22,
    flex: 1,
  },
  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#fafafa',
  },
  dropdownBtnText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'Quicksand-Medium',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: 24,
  },
  dropdownBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
  },
  dropdownList: {
    position: 'absolute',
    top: 44, // ความสูงของปุ่ม
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    elevation: 5,
    zIndex: 999,
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: {
    backgroundColor: '#f8fff0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Quicksand-Medium',
  },
  searchBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  columnWrapper: {
    gap: 10,
    paddingHorizontal: 12,
  },
  // Job card
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    elevation: 2,
    gap: 8,
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  idRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  idIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestId: {
    fontSize: 22,
    fontFamily: 'Quicksand-Bold',
    color: '#222',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {fontSize: 12, fontFamily: 'Quicksand-Bold'},
  statusDot: {width: 7, height: 7, borderRadius: 4},
  divider: {height: 1, backgroundColor: '#f0f0f0'},

  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end', // ✅ icon อยู่กึ่งกลางแนวตั้งระหว่าง label และ value
    gap: 8,
    marginBottom: 4,
  },
  infoIcon: {marginTop: 2},
  infoLabel: {fontSize: 10, color: '#373737', fontFamily: 'Quicksand-Regular'},
  infoValue: {fontSize: 16, color: '#373737', fontFamily: 'Quicksand-Medium'},

  // Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerItemLeft: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    flex: 1,
  },
  footerItemRight: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingRight: 0, // ✅ ปรับให้ตรงกับ statusBadge
  },
  footerLeft: {flexDirection: 'row', alignItems: 'center'},
  footerRight: {flexDirection: 'row', alignItems: 'center'},
  footerDate: {fontSize: 16, color: '#373737', fontFamily: 'Quicksand-Medium'},
  footerStatus: {
    fontSize: 12,
    color: '#373737',
    fontFamily: 'Quicksand-Medium',
  },

  // States
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  errorText: {color: '#e74c3c', fontSize: 16, fontFamily: 'Quicksand-Medium'},
  emptyText: {
    color: '#bbb',
    fontSize: 14,
    marginBottom: 220,
    fontFamily: 'Quicksand-Regular',
  },

  // Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: '90%',
  },
  delivery: {
    height: 182,
    alignSelf: 'center',
    marginBottom: 35,
  },
});

export default JobListScreen;
