import React, {useContext, useState} from 'react'; //เพิ่ม useState
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
} from 'react-native'; // เพิ่ม TextInput, Alert
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types/navigationTypes';
import {AuthContext, getCompanyColor} from '../context/AuthProvider';
import {getBaseUrlByCompany, API_ENDPOINTS} from '../config/apiConfig';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {SafeAreaView} from 'react-native-safe-area-context';
import IonIcon from 'react-native-vector-icons/Ionicons';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({navigation}) => {
  const {user, companyColor} = useContext(AuthContext)!;

  //เพิ่ม state สำหรับค้นหา
  const [searchId, setSearchId] = useState('');
  console.log('User Home Screen:', user);
  console.log('User Status Home Screen:', user?.status);

  const [searching, setSearching] = useState(false);

  //เพิ่ม function ค้นหา
  const handleSearch = async() => {
    if (!searchId.trim()) {
      setShowWarning(true);
      

      return;
    }
    try {
    setSearching(true);
    const baseUrl = await getBaseUrlByCompany();
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
    } catch (e) {
      setAlertMessage('ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่');
      setShowAlert(true);
    } finally {
      setSearching(false);
    }
  };

  const [showWarning, setShowWarning] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  

  const isDriverOrMessenger = user?.status === 'U04' || user?.status === 'U05';
  //format function
  const formatRequestId = (value: string) => {
  // แยก raw ออกก่อน (ลบ - ออก)
    let cleaned = value.replace(/-/g, '');

    // 2 ตัวแรก = ตัวอักษรเท่านั้น (A-Z)
    const letters = cleaned.slice(0, 2).replace(/[^A-Za-z]/g, '').toUpperCase();

    // ที่เหลือ = ตัวเลขเท่านั้น (0-9)
    const digits = cleaned.slice(2).replace(/[^0-9]/g, '');

    // รวมกัน จำกัด 9 ตัว (2 ตัวอักษร + 7 ตัวเลข)
    const raw = (letters + digits).slice(0, 9);

    // ใส่ - คั่น format XX-XX-XXXXX
    if (raw.length <= 2) return raw;
    if (raw.length <= 4) return `${raw.slice(0, 2)}-${raw.slice(2)}`;
    return `${raw.slice(0, 2)}-${raw.slice(2, 4)}-${raw.slice(4)}`;
  };

  return (
    <>
    {/* ── Alert Modal ── */}
          <Modal transparent visible={showAlert} animationType="fade">
            <View style={styles.modalAlertOverlay}>
              <View style={styles.modalAlertBox}>
                <View style={[styles.modalAlertIcon, {backgroundColor: '#FBC900'}]}>
                  <Text style={styles.modalAlertIconText}>!</Text>
                </View>
                <Text style={styles.modalAlertTitle}>แจ้งเตือน</Text>
                <Text style={styles.modalAlertMessage}>{alertMessage}</Text>
                <TouchableOpacity
                  style={[styles.modalAlertBtn, {backgroundColor: companyColor}]}
                  onPress={() => setShowAlert(false)}>
                  <Text style={styles.modalAlertBtnText}>ตกลง</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
    
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={{flex: 1}}>
          <View style={styles.hello1}>
            <Text style={styles.hello}>
              สวัสดี , {user?.name?.split(' ')[0]}
            </Text>
          </View>
          <View style={styles.container}>
            <Image
              source={require('../../assets/Delivery3.png')}
              style={styles.delivery}
              resizeMode="contain"
            />
            <View style={styles.searchBox}>
              <TextInput
                placeholder="ป้อนหมายเลขติดตาม"
                value={searchId}
                onChangeText={text => {
                  const formatted = formatRequestId(text);
                  setSearchId(formatted);
                }}
                style={styles.input}
                onSubmitEditing={handleSearch}
              />

              <TouchableOpacity
                style={[styles.searchButton, {backgroundColor: companyColor}]}
                onPress={handleSearch}
                disabled={searching}>
                {searching
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Icon name="search" size={26} color="#fff" />}
              </TouchableOpacity>
            </View>

            <View style={styles.orContainer}>
              <View style={styles.line} />

              <Text style={styles.orText}>Or</Text>

              <View style={styles.line} />
            </View>

            <TouchableOpacity
              style={[styles.button]}
              onPress={() => {
                console.log('Scan QR-Code Pressed');
                navigation.navigate('Scan');
              }}>
              <Icon
                name="qr-code-scanner"
                size={28}
                color="#373737"
                style={styles.leftIcon}
              />
              <Text style={styles.buttonText}>Scan QR-Code</Text>
            </TouchableOpacity>

            {isDriverOrMessenger && (
              <TouchableOpacity
                style={[styles.button]}
                onPress={() => navigation.navigate('FuelEntry')}>
                <Image
                  source={require('../../assets/fuel.png')}
                  style={styles.vectoricon}
                  resizeMode="contain"
                />
                <Text style={styles.buttonText}>น้ำมัน</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>

      {/* WARNING MODAL */}
      <Modal transparent visible={showWarning} animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.box}>
            <View
              style={[modalStyles.iconCircle, {backgroundColor: '#F5A800'}]}>
              <Text style={modalStyles.iconText}>!</Text>
            </View>

            <Text style={modalStyles.title}>แจ้งเตือน</Text>

            <Text style={modalStyles.message}>ป้อนหมายเลขติดตาม</Text>

            <TouchableOpacity
              style={[
                modalStyles.singleButton,
                {backgroundColor: companyColor},
              ]}
              onPress={() => setShowWarning(false)}>
              <Text style={modalStyles.confirmText}>ตกลง</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const {width, height} = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    paddingBottom: '15%',
  },

  //เพิ่ม style search
  searchBox: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    overflow: 'hidden',
    width: '80%',
    marginBottom: 20,
    backgroundColor: '#fff',
  },

  input: {
    flex: 1,
    paddingHorizontal: 15,
    fontSize: 16,
    fontFamily: 'Quicksand-Medium',
  },

  searchButton: {
    justifyContent: 'center',
    paddingHorizontal: 15,
  },

  leftIcon: {
    marginRight: 12,
  },

  vectoricon: {
    width: 25,
    height: 25,
    paddingRight: 50,
  },

  //ของเดิม
  button: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    Height: 60,
    width: '80%',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
  },
  bottomNav: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 2,
    justifyContent: 'space-around',
  },
  navButton: {
    padding: 2,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  delivery: {
    width: width * 0.82,
    height: 182,
    alignSelf: 'center',
    marginBottom: 35,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },

  line: {
    height: 1,
    backgroundColor: '#CFCFCF',
    width: 95,
  },

  orText: {
    marginHorizontal: 15,
    fontSize: 12,
    color: '#6C7278',
  },

  hello: {
    fontSize: 24,
    fontFamily: 'Quicksand-Bold',
    color: '#373737',
    justifyContent: 'flex-end',
  },
  hello1: {
    //flex: 1,
    justifyContent: 'flex-start',
    //alignItems: 'center',
    backgroundColor: '#F9F9F9',
    paddingLeft: '8%',
    paddingTop: '10%',
    paddingBottom: 0,
  },
  modalAlertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAlertBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    elevation: 5,
  },
  modalAlertIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalAlertIconText: {
    color: '#fff',
    fontSize: 30,
    fontFamily: 'Quicksand-Bold',
  },
  modalAlertTitle: {
    fontSize: 20,
    fontFamily: 'Quicksand-Bold',
    color: '#333',
    marginBottom: 8,
  },
  modalAlertMessage: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalAlertBtn: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalAlertBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Quicksand-Bold',
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  box: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },

  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },

  iconText: {
    fontSize: 38,
    color: '#fff',
    fontFamily: 'Quicksand-Bold',
  },

  title: {
    fontSize: 28,
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
  },

  singleButton: {
    width: '70%',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  confirmText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Quicksand-Bold',
  },
});

export default HomeScreen;
