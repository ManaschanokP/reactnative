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
// นำเข้า Context และ API Config
import {AuthContext} from '../context/AuthProvider';
import {getBaseUrlByCompany, API_ENDPOINTS} from '../config/apiConfig';
import Icon from 'react-native-vector-icons/Feather';

type Props = NativeStackScreenProps<RootStackParamList, 'FuelEntry'>;

const FuelEntryScreen: React.FC<Props> = ({navigation}) => {
  const {user} = useContext(AuthContext)!; // ดึงข้อมูล user ที่ล็อกอินอยู่

  const [license_no, setlicense_no] = useState('');
  const [date, setDate] = useState(new Date());
  const [mile, setMile] = useState('');
  const [liter, setliter] = useState('');
  const [price, setprice] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  // เพิ่ม State สำหรับสถานะ Loading ตอนกด Submit
  const [loading, setLoading] = useState(false);
  const handleDateChange = (params: {date: DateType}) => {
    if (params.date instanceof Date) {
      setDate(params.date);
      setShowDatePicker(false);
    }
  };

  // ฟังก์ชันแปลงวันที่ส่ง API เป็น Format YYYY-MM-DD
  const toApiDate = (dateObj: Date): string => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // ฟังก์ชันสำหรับ Submit ข้อมูล
  const handleSubmit = async () => {
    // 1. ตรวจสอบว่ากรอกข้อมูลครบหรือไม่
    if (!license_no || !mile || !liter || !price) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      setLoading(true);
      const baseUrl = await getBaseUrlByCompany();
      const url = `${baseUrl}${API_ENDPOINTS.FUEL}`; // เรียกใช้ Endpoint

      const payloadLog = {
        user_id: user.id,
        date: toApiDate(date),
        license_no: license_no,
        mile: mile,
        liter: liter,
        price: price,
      };

      // 2. เตรียมข้อมูล FormData ส่งให้ API
      const formData = new FormData();
      formData.append('user_id', user.id); // รหัสพนักงานขับรถ
      formData.append('date', toApiDate(date)); // วันที่
      formData.append('license_no', license_no); // ทะเบียนรถ
      formData.append('mile', mile); // เลขไมล์
      formData.append('liter', liter); // จำนวนลิตร
      formData.append('price', price); // จำนวนเงินบาท

      console.log('กำลังส่งข้อมูล Fuel:', formData);

      // 3. ยิง API
      const res = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      const obj = await res.json();
      console.log('obj:', res);
      // 4. เช็คผลลัพธ์
      if (!obj.error) {
        Alert.alert('สำเร็จ', 'บันทึกข้อมูลการเติมน้ำมันเรียบร้อยแล้ว', [
          {text: 'ตกลง', onPress: () => navigation.goBack()}, // บันทึกเสร็จให้เด้งกลับหน้าเดิม
        ]);
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
                  name="date-range"
                  size={28}
                  color="#93D500"
                  style={styles.iconButton}
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
              onPress={handleSubmit}
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
    color: '#37373780',
    fontSize: 14,
    fontFamily: 'Quicksand-Medium',
  },

  iconButton: {
    position: 'absolute',
    right: 14,
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
    color: '#37373780',
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
    alignItems: 'center',
    paddingRight: 10,
  },
});

export default FuelEntryScreen;
