// app/src/screens/ProfileScreen.tsx
import React, { useEffect, useState, useContext } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, BackHandler, ActivityIndicator, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigationTypes';
import { AuthContext } from '../context/AuthProvider';
import { ProfileForm } from '../types/authTypes';
import { getBaseUrlByCompany, API_ENDPOINTS } from '../config/apiConfig'; // ✅ Import API Config

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext)!;

  const [form, setForm] = useState<ProfileForm>({
    id: user?.id ?? '',
    name: user?.name ?? '',
    department: user?.department ?? '',
    tel: user?.tel ?? '',
    phone: user?.phone ?? '',
    company: user?.company ?? '',
  });

  const [loading, setLoading] = useState(false); // ✅ เพิ่มสถานะ Loading

  useEffect(() => {
    const backAction = () => {
      Alert.alert('Hold on!', 'Are you sure you want to go back?', [
        { text: 'Cancel', onPress: () => null, style: 'cancel' },
        { text: 'YES', onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  const handleChange = (key: keyof ProfileForm, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const confirmLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout },
      ],
      { cancelable: true },
    );
  };

  const handleSubmit = async () => {
    const status = user?.status ?? 'U03';
    
    try {
      setLoading(true);
      
      // ✅ ดึง Base URL และ Endpoint
      const baseUrl = await getBaseUrlByCompany();
      const url = `${baseUrl}${API_ENDPOINTS.UPDATE_PROFILE}`;

      // ✅ เตรียมข้อมูล FormData เพื่อส่งไปให้ Backend
      const formData = new FormData();
      formData.append('username', form.id);
      formData.append('name', form.name);
      formData.append('department', form.department);
      formData.append('tel', form.tel);
      formData.append('phone', form.phone);
      formData.append('company', form.company);

      console.log('🚀 [POST] ยิง API อัปเดตโปรไฟล์ไปที่:', url);
      console.log('📦 [PAYLOAD]:', form);

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      const obj = await response.json();
      console.log('✅ [RESPONSE]:', obj);

      if (!obj.error) {
        Alert.alert('สำเร็จ', obj.message || 'อัปเดตข้อมูลสำเร็จ');
        
        if (status === 'U04' || status === 'Home') {
          navigation.navigate('Home');
        } else {
          navigation.navigate('Menu');
        }
      } else {
        Alert.alert('ผิดพลาด', obj.message || 'ไม่สามารถอัปเดตข้อมูลได้');
      }
    } catch (error: any) {
      console.error('❌ [ERROR]:', error);
      Alert.alert('ผิดพลาด', error.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Field label="ชื่อ-นามสกุล" value={form.name} editable={false} />
      <Field label="แผนก" value={form.department} editable={false} />
      <Field
        label="เบอร์ภายใน"
        value={form.tel}
        onChangeText={text => handleChange('tel', text)}
      />
      <Field
        label="เบอร์มือถือ"
        value={form.phone}
        onChangeText={text => handleChange('phone', text)}
      />
      <Field label="บริษัท" value={form.company} editable={false} />
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
        <View style={{ flex: 1, marginRight: 5 }}>
          {/* ✅ ใส่ Loading ตอนกดอัปเดต */}
          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>บันทึก</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, marginLeft: 5 }}>
          <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

type FieldProps = {
  label: string;
  value: string;
  editable?: boolean;
  onChangeText?: (text: string) => void;
};

const Field: React.FC<FieldProps> = ({ label, value, editable = true, onChangeText }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label} :</Text>
    <TextInput
      style={[styles.input, !editable && styles.disabled]}
      value={value}
      onChangeText={onChangeText}
      editable={editable}
      placeholder={label}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, backgroundColor: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  label: { fontWeight: 'bold', width: 110, color: '#333' },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    color: '#000',
  },
  disabled: {
    backgroundColor: '#f0f0f0',
    color: '#777',
  },
  saveButton: {
    backgroundColor: '#a7cc43',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#c44141',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default ProfileScreen;