import React, {useState, useContext, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Pressable,
  StatusBar,
} from 'react-native';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {Button} from 'react-native-elements';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import DatePicker, {DateType} from 'react-native-ui-datepicker';
import {RootStackParamList} from '../types/navigationTypes';

import {AuthContext} from '../context/AuthProvider';
import {getBaseUrlByCompany, API_ENDPOINTS} from '../config/apiConfig';

import Icon from 'react-native-vector-icons/Feather';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import CalenderTGL from '../../assets/CalendarThaiGL.svg';


type Props = NativeStackScreenProps<RootStackParamList, 'FuelEntry'>;

const FuelEntryScreen: React.FC<Props> = ({navigation}) => {
  const {user,companyColor} = useContext(AuthContext)!;

  // STATE
  const [license_no, setlicense_no] = useState('');
  const [licenseList, setLicenseList] = useState<any[]>([]);
  const [showLicenseDropdown, setShowLicenseDropdown] = useState(false);

  const [date, setDate] = useState(new Date());
  const [mile, setMile] = useState('');
  const [liter, setliter] = useState('');
  const [price, setprice] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [loading, setLoading] = useState(false);

  // Modal
  const [showConfirm, setShowConfirm] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  //FETCH LICENSE
  const fetchLicenseList = async () => {
    try {
      const baseUrl = await getBaseUrlByCompany();

      const url = `${baseUrl}${API_ENDPOINTS.LIST_LICENSE}`;

      console.log('URL:', url);
      console.log('STATUS:', user.status);

      const body = `user_status=${user.status}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      const json = await res.json();

      console.log('ทะเบียนรถ:', JSON.stringify(json, null, 2));

      if (!json.error && Array.isArray(json.listlicense)) {
        setLicenseList(json.listlicense);
      } else {
        setLicenseList([]);
      }
    } catch (error) {
      console.log('โหลดทะเบียนรถไม่สำเร็จ', error);
    }
  };

  useEffect(() => {
    fetchLicenseList();
  }, []);

  // DATE
  const handleDateChange = (params: {date: DateType}) => {
    if (params.date instanceof Date) {
      setDate(params.date);
      setShowDatePicker(false);
    }
  };

  const toApiDate = (dateObj: Date): string => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');

    return `${y}-${m}-${d}`;
  };

  // SUBMIT
  const handleSubmit = async () => {
    try {
      setLoading(true);

      const baseUrl = await getBaseUrlByCompany();

      const url = `${baseUrl}${API_ENDPOINTS.FUEL}`;

      const formData = new FormData();

      formData.append('user_id', user.id);
      formData.append('date', toApiDate(date));
      formData.append('license_no', license_no);
      formData.append('mile', mile);
      formData.append('liter', liter);
      formData.append('price', price);

      console.log('กำลังส่งข้อมูล Fuel:', formData);

      const res = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      const obj = await res.json();

      console.log('obj:', obj);

      if (!obj.error) {
        setSuccessMessage('บันทึกข้อมูลการเติมน้ำมันเรียบร้อยแล้ว');
        setShowSuccess(true);
      } else {
        Alert.alert(
          'เกิดข้อผิดพลาด',
          obj.message || 'ไม่สามารถบันทึกข้อมูลได้',
        );
      }
    } catch (error) {
      console.error('Submit Fuel Error:', error);

      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <StatusBar  backgroundColor={companyColor} barStyle="light-content" />
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>{'‹'}</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Fuel Entry</Text>
        </View>

        {/* CONTENT */}
        <View style={styles.card}>
          <KeyboardAwareScrollView
            style={{flex: 1}}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            enableOnAndroid={true}
            extraScrollHeight={20}
            keyboardShouldPersistTaps="handled">
            {/* วันที่ */}
            <Text style={styles.label}>วันที่ :</Text>

            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, {flex: 1}]}
                  value={date.toLocaleDateString('th-TH')}
                  editable={false}
                />

                <CalenderTGL
                  width={36}
                  height={36}
                  style={styles.iconcalender}
                />
              </View>
            </TouchableOpacity>

            {/* Date Picker */}
            <Modal visible={showDatePicker} transparent animationType="slide">
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <DatePicker
                    mode="single"
                    date={date}
                    onChange={handleDateChange}
                  />

                  <Button
                    title="ปิด"
                    onPress={() => setShowDatePicker(false)}
                  />
                </View>
              </View>
            </Modal>

            {/* ทะเบียนรถ */}
            <Text style={styles.label}>ทะเบียน :</Text>

            <View>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setShowLicenseDropdown(prev => !prev)}>
                <Text
                  style={[
                    styles.dropdownBtnText,
                    license_no && styles.dropdownBtnTextSelected, // ถ้ามีค่าแล้วใช้สีดำ
                  ]}>
                  {license_no || 'เลือกทะเบียนรถ'}
                </Text>

                <MaterialIcons
                  name={
                    showLicenseDropdown
                      ? 'keyboard-arrow-up'
                      : 'keyboard-arrow-down'
                  }
                  size={24}
                  color="#555"
                />
              </TouchableOpacity>

              {showLicenseDropdown && (
                <View style={styles.dropdownList}>
                  <ScrollView nestedScrollEnabled style={{maxHeight: 220}}>
                    {Array.isArray(licenseList) &&
                      licenseList.map((item, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setlicense_no(item.license_no);
                            setShowLicenseDropdown(false);
                          }}>
                          <Text
                            style={[
                              styles.dropdownItemText,
                              license_no === item.license_no && {
                                color: '#93D500',
                                fontFamily: 'Quicksand-Bold',
                              },
                            ]}>
                            {item.license_no}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* เลขไมล์ */}
            <Text style={styles.label}>เลขไมล์ :</Text>

            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={mile}
              onChangeText={text => setMile(text.replace(/[^0-9]/g, ''))}
              placeholder="ระบุเลขไมล์"
              placeholderTextColor="#999"
            />

            {/* จำนวนลิตร */}
            <Text style={styles.label}>จำนวน (ลิตร) :</Text>

            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={liter}
              onChangeText={text => setliter(text.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
              placeholderTextColor="#999"
            />

            {/* จำนวนเงิน */}
            <Text style={styles.label}>จำนวน (บาท) :</Text>

            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={price}
              onChangeText={text => setprice(text.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
              placeholderTextColor="#999"
            />

            {/* ปุ่มบันทึก */}
            <Pressable
              style={({pressed}) => [
                styles.submitButton,
                loading && styles.submitButtonDisabled,
                pressed &&
                  !loading && {
                    backgroundColor: '#7AB100', // สีตอนกด
                  },
              ]}
              onPress={() => {
                if (!license_no || !mile || !liter || !price) {
                  setShowWarning(true);
                  return;
                }

                setShowConfirm(true);
              }}
              disabled={loading}>
              <Icon
                name="download"
                size={24}
                color="#ffffff"
                style={styles.iconbottom}
              />

              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>บันทึก</Text>
              )}
            </Pressable>

            <View style={{height: 90}} />
          </KeyboardAwareScrollView>
        </View>

        {/* CONFIRM MODAL */}
        <Modal transparent visible={showConfirm} animationType="fade">
          <View style={modalStyles.overlay}>
            <View style={modalStyles.box}>
              <View
                style={[modalStyles.iconCircle, {backgroundColor: '#93D500'}]}>
                <Text style={modalStyles.iconText}>!</Text>
              </View>

              <Text style={modalStyles.title}>บันทึก</Text>

              <Text style={modalStyles.message}>
                ต้องการบันทึก "ข้อมูล" ใช่ไหม ?
              </Text>

              <View style={modalStyles.buttons}>
                <Pressable
                  style={({pressed}) => [
                    modalStyles.cancelBtn,
                    {
                      backgroundColor: pressed ? '#E0E0E0' : '#FFFFFF',
                    },
                  ]}
                  onPress={() => setShowConfirm(false)}>
                  <Text style={modalStyles.cancelText}>ยกเลิก</Text>
                </Pressable>

                <Pressable
                  style={({pressed}) => [
                    modalStyles.confirmBtn,
                    {
                      backgroundColor: pressed ? '#7AB100' : '#93D500',
                    },
                  ]}
                  onPress={() => {
                    setShowConfirm(false);

                    setTimeout(() => {
                      handleSubmit();
                    }, 100);
                  }}>
                  <Text style={modalStyles.confirmText}>ยืนยัน</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* WARNING MODAL */}
        <Modal transparent visible={showWarning} animationType="fade">
          <View style={modalStyles.overlay}>
            <View style={modalStyles.box}>
              <View
                style={[modalStyles.iconCircle, {backgroundColor: '#F5A800'}]}>
                <Text style={modalStyles.iconText}>!</Text>
              </View>

              <Text style={modalStyles.title}>แจ้งเตือน</Text>

              <Text style={modalStyles.message}>กรุณากรอกข้อมูลให้ครบถ้วน</Text>

              <Pressable
                style={({pressed}) => [
                  modalStyles.singleButton,
                  {
                    backgroundColor: pressed ? '#7AB100' : '#93D500',
                  },
                ]}
                onPress={() => setShowWarning(false)}>
                <Text style={modalStyles.confirmText}>ตกลง</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* SUCCESS MODAL */}
        <Modal transparent visible={showSuccess} animationType="fade">
          <View style={modalStyles.overlay}>
            <View style={modalStyles.box}>
              <View
                style={[modalStyles.iconCircle, {backgroundColor: '#93D500'}]}>
                <Text style={modalStyles.iconCheck}>✓</Text>
              </View>

              <Text style={modalStyles.title}>สำเร็จ</Text>

              <Text style={modalStyles.message}>{successMessage}</Text>

              <Pressable
                style={({pressed}) => [
                  modalStyles.singleButton,
                  {
                    backgroundColor: pressed ? '#7AB100' : '#93D500',
                  },
                ]}
                onPress={() => {
                  setShowSuccess(false);
                  navigation.goBack();
                }}>
                <Text style={modalStyles.confirmText}>ตกลง</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },

  safeArea: {
    flex: 1,
    backgroundColor: '#93D500',
  },

  container: {
    flex: 1,
    backgroundColor: '#93D500',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 15,
  },

  backButton: {
    fontSize: 45,
    fontFamily: 'Quicksand-Bold',
    color: '#fff',
    marginRight: 10,
    paddingTop: 2,
    paddingLeft: 5,
  },

  headerTitle: {
    fontSize: 24,
    fontFamily: 'Quicksand-Bold',
    color: '#fff',
    paddingTop: 8,
    paddingLeft: 10,
  },

  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
  },

  label: {
    marginTop: 18,
    marginBottom: 8,
    color: '#373737',
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  input: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderColor: '#DADADA',
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: '#FAFAFA',
    color: '#000',
    fontSize: 14,
    fontFamily: 'Quicksand-Medium',
  },

  dropdownBtn: {
    height: 52,
    borderWidth: 1,
    borderColor: '#DADADA',
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dropdownBtnText: {
    color: '#999',
    fontSize: 14,
    fontFamily: 'Quicksand-Medium',
  },

  dropdownBtnTextSelected: {
    color: '#000', // สีดำเมื่อเลือกแล้ว
  },

  dropdownList: {
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#DADADA',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },

  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },

  dropdownItemText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Quicksand-Medium',
  },

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  modalContent: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },

  submitButton: {
    height: 50,
    width: 220,
    backgroundColor: '#93D500',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 35,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    alignSelf: 'center',
    flexDirection: 'row',
  },

  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },

  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Quicksand-Bold',
  },

  iconbottom: {
    paddingRight: 10,
  },

  iconcalender: {
    marginLeft: 10,
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

  iconCheck: {
    fontSize: 34,
    color: '#fff',
    fontFamily: 'Quicksand-Bold',
  },

  title: {
    fontSize: 32,
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

  buttons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },

  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#000000',
  },

  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },

  singleButton: {
    width: '70%',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cancelText: {
    color: '#333',
    fontSize: 14,
    fontFamily: 'Quicksand-Bold',
  },

  confirmText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Quicksand-Bold',
  },
});

export default FuelEntryScreen;
