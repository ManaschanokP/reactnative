import React, {useState, useContext} from 'react';
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
} from 'react-native';

import {Picker} from '@react-native-picker/picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {Button} from 'react-native-elements';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import DatePicker, {DateType} from 'react-native-ui-datepicker';
import {RootStackParamList} from '../types/navigationTypes';

import {AuthContext} from '../context/AuthProvider';
import {getBaseUrlByCompany, API_ENDPOINTS} from '../config/apiConfig';

import Icon from 'react-native-vector-icons/Feather';

type Props = NativeStackScreenProps<RootStackParamList, 'FuelEntry'>;

const FuelEntryScreen: React.FC<Props> = ({navigation}) => {
  const {user} = useContext(AuthContext)!;

  const [license_no, setlicense_no] = useState('');
  const [date, setDate] = useState(new Date());
  const [mile, setMile] = useState('');
  const [liter, setliter] = useState('');
  const [price, setprice] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [loading, setLoading] = useState(false);

  // Confirm Modal
  const [showConfirm, setShowConfirm] = useState(false);

  // Warning Modal
  const [showWarning, setShowWarning] = useState(false);

  // Success Modal
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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

      console.log('obj:', res);

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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>{'‹'}</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Fuel Entry</Text>
        </View>

        <View style={styles.card}>
          <ScrollView
            style={{flex: 1}}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* วันที่ */}
            <Text style={styles.label}>วันที่ :</Text>

            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, {flex: 1}]}
                  value={date.toLocaleDateString('th-TH')}
                  editable={false}
                />

                <MaterialIcons
                  name="calendar-month"
                  size={35}
                  color="#93D500"
                  style={styles.iconcalender}
                />
              </View>
            </TouchableOpacity>

            {/* Modal Date Picker */}
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

            {/* ทะเบียน */}
            <Text style={styles.label}>ทะเบียน :</Text>

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={license_no}
                onValueChange={itemValue => setlicense_no(itemValue)}
                style={styles.picker}>
                <Picker.Item label="เลือกทะเบียน" value="" />
                <Picker.Item label="ABC-1234" value="ABC-1234" />
                <Picker.Item label="XYZ-5678" value="XYZ-5678" />
              </Picker>
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
            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled,
              ]}
              onPress={() => {
                // เช็คข้อมูลก่อน
                if (!license_no || !mile || !liter || !price) {
                  setShowWarning(true);
                  return;
                }

                // ถ้ากรอกครบ ค่อยเปิด Confirm
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
            </TouchableOpacity>

            <View style={{height: 90}} />
          </ScrollView>
        </View>

        {/* ── Confirm Modal ── */}
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
                <TouchableOpacity
                  style={modalStyles.cancelBtn}
                  onPress={() => setShowConfirm(false)}>
                  <Text style={modalStyles.cancelText}>ยกเลิก</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[modalStyles.confirmBtn, {backgroundColor: '#93D500'}]}
                  onPress={() => {
                    setShowConfirm(false);

                    setTimeout(() => {
                      handleSubmit();
                    }, 100);
                  }}>
                  <Text style={modalStyles.confirmText}>ยืนยัน</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ── Warning Modal ── */}
        <Modal transparent visible={showWarning} animationType="fade">
          <View style={modalStyles.overlay}>
            <View style={modalStyles.box}>
              <View
                style={[modalStyles.iconCircle, {backgroundColor: '#F5A800'}]}>
                <Text style={modalStyles.iconText}>!</Text>
              </View>

              <Text style={modalStyles.title}>แจ้งเตือน</Text>

              <Text style={modalStyles.message}>กรุณากรอกข้อมูลให้ครบถ้วน</Text>

              <TouchableOpacity
                style={[modalStyles.singleButton, {backgroundColor: '#93D500'}]}
                onPress={() => setShowWarning(false)}>
                <Text style={modalStyles.confirmText}>ตกลง</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── Success Modal ── */}
        <Modal transparent visible={showSuccess} animationType="fade">
          <View style={modalStyles.overlay}>
            <View style={modalStyles.box}>
              <View
                style={[modalStyles.iconCircle, {backgroundColor: '#93D500'}]}>
                <Text style={modalStyles.iconCheck}>✓</Text>
              </View>

              <Text style={modalStyles.title}>สำเร็จ</Text>

              <Text style={modalStyles.message}>บันทึกข้อมูลสำเร็จ</Text>

              <TouchableOpacity
                style={[modalStyles.fullBtn, {backgroundColor: '#93D500'}]}
                onPress={() => {
                  setShowSuccess(false);
                  navigation.goBack();
                }}>
                <Text style={modalStyles.confirmText}>ตกลง</Text>
              </TouchableOpacity>
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

  contentContainer: {
    flexGrow: 1,
    paddingTop: 20,
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
    paddingTop: 34,
    paddingLeft: 5,
  },

  headerTitle: {
    fontSize: 24,
    fontFamily: 'Quicksand-Bold',
    color: '#fff',
    paddingTop: 48,
    paddingLeft: 10,
  },

  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 24,
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

  pickerContainer: {
    borderWidth: 1,
    borderColor: '#DADADA',
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
  },

  picker: {
    height: 52,
    color: '#00000080',
    fontFamily: 'Quicksand-Medium',
    fontSize: 14,
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
    backgroundColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
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

  fullBtn: {
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
