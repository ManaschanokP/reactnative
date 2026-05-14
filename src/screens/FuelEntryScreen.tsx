import React, { useState, useContext } from 'react';
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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Button } from 'react-native-elements';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import DatePicker, { DateType } from 'react-native-ui-datepicker';
import { RootStackParamList } from '../types/navigationTypes';

// นำเข้า Context และ API Config (ปรับ Path ให้ตรงกับโปรเจกต์ของคุณ)
import { AuthContext } from '../context/AuthProvider';
import { getBaseUrlByCompany, API_ENDPOINTS } from '../config/apiConfig';

type Props = NativeStackScreenProps<RootStackParamList, 'FuelEntry'>;

const FuelEntryScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useContext(AuthContext)!; // ดึงข้อมูล user ที่ล็อกอินอยู่

  const [license_no, setlicense_no] = useState('');
  const [date, setDate] = useState(new Date());
  const [mile, setMile] = useState('');
  const [liter, setliter] = useState('');
  const [price, setprice] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // เพิ่ม State สำหรับสถานะ Loading ตอนกด Submit
  const [loading, setLoading] = useState(false);

  const handleDateChange = (params: { date: DateType }) => {
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
          { text: 'ตกลง', onPress: () => navigation.goBack() } // บันทึกเสร็จให้เด้งกลับหน้าเดิม
        ]);
      } else {
        Alert.alert('เกิดข้อผิดพลาด', obj.message || 'ไม่สามารถบันทึกข้อมูลได้');
      }
    } catch (error) {
      console.error('Submit Fuel Error:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    // เปลี่ยนมาใช้ ScrollView เพื่อไม่ให้คีย์บอร์ดบังปุ่ม Submit
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.label}>วันที่ :</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(true)}>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1, color: '#000' }]}
            value={date.toLocaleDateString('th-TH')} // แสดงเป็น พ.ศ. ให้ดูง่ายขึ้น
            editable={false}
          />
          <MaterialIcons
            name="date-range"
            size={30}
            color="#93D500"
            style={styles.iconButton}
          />
        </View>
      </TouchableOpacity>

      <Modal visible={showDatePicker} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <DatePicker mode="single" date={date} onChange={handleDateChange} />
            <Button title="ปิด" onPress={() => setShowDatePicker(false)} />
          </View>
        </View>
      </Modal>

      <Text style={styles.label}>ทะเบียน :</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={license_no}
          onValueChange={itemValue => setlicense_no(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="เลือกทะเบียน" value="" />
          <Picker.Item label="ABC-1234" value="ABC-1234" />
          <Picker.Item label="XYZ-5678" value="XYZ-5678" />
        </Picker>
      </View>

      <Text style={styles.label}>เลขไมล์ :</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={mile}
        onChangeText={(text) => setMile(text.replace(/[^0-9]/g, ''))} // กันพิมพ์ตัวอักษร
        placeholder="ระบุเลขไมล์"
      />

      <Text style={styles.label}>จำนวน (ลิตร) :</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={liter}
        onChangeText={(text) => setliter(text.replace(/[^0-9.]/g, ''))} // รองรับทศนิยม
        placeholder="0.00"
      />

      <Text style={styles.label}>จำนวน (บาท) :</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={price}
        onChangeText={(text) => setprice(text.replace(/[^0-9.]/g, ''))} // รองรับทศนิยม
        placeholder="0.00"
      />

      {/* ปุ่มบันทึกข้อมูล */}
      <TouchableOpacity 
        style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>บันทึกข้อมูล</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 20,
  },
  label: {
    fontFamily: 'bold',
    marginTop: 20,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: '#fafafa',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 10,
    marginTop: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: '#fafafa',
  },
  picker: {
    height: 50,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '90%',
  },
  // Style สำหรับปุ่ม Submit
  submitButton: {
    backgroundColor: '#93D500',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 35,
    elevation: 2, // เงาสำหรับ Android
    shadowColor: '#000', // เงาสำหรับ iOS
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'bold',
  },
});

export default FuelEntryScreen;
