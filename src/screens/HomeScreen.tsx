import React, {useContext, useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  Pressable,
  StatusBar,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {SafeAreaView} from 'react-native-safe-area-context';

// คอนเท็กซ์ คอนฟิก และประเภทข้อมูล
import {RootStackParamList} from '../types/navigationTypes';
import {AuthContext} from '../context/AuthProvider';
import {getBaseUrlByCompany, API_ENDPOINTS} from '../config/apiConfig';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const {width} = Dimensions.get('window');

const HomeScreen: React.FC<Props> = ({navigation}) => {
  const {user, companyColor} = useContext(AuthContext)!;

  useEffect(() => {
    StatusBar.setBarStyle('dark-content', true);
    StatusBar.setBackgroundColor('#F9F9F9', true);
  }, []);

  // สเตทสำหรับจัดการข้อมูลการค้นหาและโมดอลแจ้งเตือน
  const [searchId, setSearchId] = useState('');
  const [searching, setSearching] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // ตรวจสอบสิทธิ์ประเภทผู้ใช้งาน
  const isDriverOrMessenger = user?.status === 'U04' || user?.status === 'U05';

  // ฟังก์ชันจัดรูปแบบตัวอักษรหมายเลขติดตามพัสดุ (XX-XX-XXXXX)
  const formatRequestId = (value: string) => {
    let cleaned = value.replace(/-/g, '');
    const letters = cleaned
      .slice(0, 2)
      .replace(/[^A-Za-z]/g, '')
      .toUpperCase();
    const digits = cleaned.slice(2).replace(/[^0-9]/g, '');
    const raw = (letters + digits).slice(0, 9);

    if (raw.length <= 2) return raw;
    if (raw.length <= 4) return `${raw.slice(0, 2)}-${raw.slice(2)}`;
    return `${raw.slice(0, 2)}-${raw.slice(2, 4)}-${raw.slice(4)}`;
  };

  // ฟังก์ชันยิง API ค้นหาหมายเลขติดตามพัสดุ
  const handleSearch = async () => {
    if (!searchId.trim()) {
      setShowWarning(true);
      return;
    }
    try {
      setSearching(true);
      const baseUrl = await getBaseUrlByCompany();

      if (user?.status === 'U04') {
        // ✅ U04 — ดึง job detail แล้วไป ViewDetail
        const url = `${baseUrl}${API_ENDPOINTS.GET_STATUS_NOW}`;
        const formData = new FormData();
        formData.append('request_id', searchId);
        const res = await fetch(url, {method: 'POST', body: formData});
        const obj = await res.json();

        if (!obj.error && obj.StatusNow && obj.StatusNow.length > 0) {
          const job = obj.StatusNow[0];
          navigation.navigate('ViewDetail', {
            item: {
              request_id: job.request_id,
              status_id: job.status_id,
              status_name: job.status_name,
              type_name: job.type_name,
              to_company: job.to_company,
              d_date: job.d_date,
              d_time: job.d_time ?? '',
            },
          });
        } else {
          setAlertMessage(obj.message || 'ไม่พบข้อมูลหมายเลขนี้');
          setShowAlert(true);
        }
      } else {
        // ✅ user อื่นๆ — ไป Tracking เหมือนเดิม
        const url = `${baseUrl}${API_ENDPOINTS.TRACK}`;
        const formData = new FormData();
        formData.append('request_id', searchId);
        const res = await fetch(url, {method: 'POST', body: formData});
        const obj = await res.json();

        if (!obj.error && obj.Track && obj.Track.length > 0) {
          navigation.navigate('Tracking', {requestId: searchId});
        } else {
          setAlertMessage(obj.message || 'ไม่พบข้อมูลหมายเลขนี้');
          setShowAlert(true);
        }
      }
    } catch (e) {
      setAlertMessage('ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่');
      setShowAlert(true);
    } finally {
      setSearching(false);
    }
  };

  return (
    <>
      {/* โมดอลแจ้งเตือนเมื่อพบข้อผิดพลาดหรือข้อความจากระบบ */}
      <Modal transparent visible={showAlert} animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.container}>
            <View style={modalStyles.iconBadge}>
              <Text style={modalStyles.iconText}>!</Text>
            </View>
            <Text style={modalStyles.title}>แจ้งเตือน</Text>
            <Text style={modalStyles.message}>{alertMessage}</Text>
            <TouchableOpacity
              style={[
                modalStyles.actionButton,
                {backgroundColor: companyColor},
              ]}
              onPress={() => setShowAlert(false)}>
              <Text style={modalStyles.actionButtonText}>ตกลง</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* เนื้อหาหลักของหน้าจอหลัก */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView
          style={styles.screenWrapper}
          edges={['bottom', 'left', 'right']}>
          <View style={styles.welcomeWrapper}>
            <Text style={styles.welcomeText}>
              สวัสดี , {user?.name?.split(' ')[0]}
            </Text>
          </View>

          <View style={styles.contentContainer}>
            <Image
              source={require('../../assets/Delivery3.png')}
              style={styles.bannerImage}
              resizeMode="contain"
            />

            {/* ส่วนกล่องค้นหาหมายเลขพัสดุ */}
            <View style={styles.searchContainer}>
              <TextInput
                placeholder="ป้อนหมายเลขติดตาม"
                value={searchId}
                onChangeText={text => setSearchId(formatRequestId(text))}
                style={styles.searchInput}
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity
                style={[styles.searchButton, {backgroundColor: companyColor}]}
                onPress={handleSearch}
                disabled={searching}>
                {searching ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Icon name="search" size={26} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            {/* ส่วนเส้นคั่นแบ่งตัวเลือก */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* ปุ่มกดเปิดสแกนคิวอาร์โค้ด */}
            <Pressable
              style={({pressed}) => [
                styles.menuButton,
                pressed && styles.menuButtonPressed,
              ]}
              onPress={() => {
                console.log('🔍 navigating to Scan');
                navigation.navigate('Scan');
              }}>
              <Icon
                name="qr-code-scanner"
                size={28}
                color="#373737"
                style={styles.menuButtonIcon}
              />
              <Text style={styles.menuButtonText}>Scan QR-Code</Text>
            </Pressable>

            {/* ปุ่มกดบันทึกน้ำมันสำหรับพนักงานขับรถหรือขนส่ง */}
            {isDriverOrMessenger && (
              <Pressable
                style={({pressed}) => [
                  styles.menuButton,
                  pressed && styles.menuButtonPressed,
                ]}
                onPress={() => navigation.navigate('FuelEntry')}>
                <Image
                  source={require('../../assets/fuel.png')}
                  style={styles.fuelButtonIcon}
                  resizeMode="contain"
                />
                <Text style={styles.menuButtonText}>น้ำมัน</Text>
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>

      {/* โมดอลแจ้งเตือนเมื่อยังไม่ได้กรอกหมายเลขติดตามพัสดุ */}
      <Modal transparent visible={showWarning} animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.container}>
            <View style={modalStyles.iconBadge}>
              <Text style={modalStyles.iconText}>!</Text>
            </View>
            <Text style={modalStyles.title}>แจ้งเตือน</Text>
            <Text style={modalStyles.message}>กรุณาป้อนหมายเลขติดตาม</Text>
            <TouchableOpacity
              style={[
                modalStyles.actionButton,
                {backgroundColor: companyColor},
              ]}
              onPress={() => setShowWarning(false)}>
              <Text style={modalStyles.actionButtonText}>ตกลง</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

// การจัดกลุ่มสไตล์ของหน้าจอและคอมโพเนนต์หลัก
const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  welcomeWrapper: {
    backgroundColor: '#F9F9F9',
    paddingLeft: '8%',
    paddingTop: '10%',
    paddingBottom: 0,
  },
  welcomeText: {
    fontSize: 24,
    fontFamily: 'Quicksand-Bold',
    color: '#373737',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    paddingBottom: '15%',
    marginTop: 50,
  },
  bannerImage: {
    width: width * 0.82,
    height: 182,
    alignSelf: 'center',
    marginBottom: 35,
  },
  searchContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    overflow: 'hidden',
    width: '80%',
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 15,
    fontSize: 16,
    fontFamily: 'Quicksand-Medium',
  },
  searchButton: {
    width: 60,
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#CFCFCF',
    width: 95,
  },
  dividerText: {
    marginHorizontal: 15,
    fontSize: 12,
    color: '#6C7278',
  },
  menuButton: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    height: 50,
    width: '80%',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  menuButtonPressed: {
    backgroundColor: '#EAEAEA',
  },
  menuButtonText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
  },
  menuButtonIcon: {
    marginRight: 12,
  },
  fuelButtonIcon: {
    width: 25,
    height: 25,
    marginRight: 12,
  },
});

// การจัดกลุ่มสไตล์ของกล่องข้อความแจ้งเตือน (Modals)
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  container: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
  },
  iconBadge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    backgroundColor: '#F5A800',
  },
  iconText: {
    fontSize: 38,
    color: '#fff',
    fontFamily: 'Quicksand-Bold',
  },
  title: {
    fontSize: 24,
    color: '#222',
    fontFamily: 'Quicksand-Bold',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: '#373737',
    textAlign: 'center',
    fontFamily: 'Quicksand-Medium',
    marginBottom: 24,
    lineHeight: 22,
  },
  actionButton: {
    width: '70%',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Quicksand-Bold',
  },
});

export default HomeScreen;
