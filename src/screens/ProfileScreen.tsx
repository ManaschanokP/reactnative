// app/src/screens/ProfileScreen.tsx
import React, { useEffect, useState, useContext } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, BackHandler } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigationTypes';
import { updateUser } from '../services/apiService';
import { AuthContext } from '../context/AuthProvider';
import { ProfileForm } from '../types/authTypes';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const ProfileScreen: React.FC<Props> = ({ navigation }) => {

  // ✅ ย้าย useContext มาอยู่ข้างนอก useEffect
  const { user, logout } = useContext(AuthContext)!;

  const [form, setForm] = useState<ProfileForm>({
    id: user?.id ?? '',
    name: user?.name ?? '',
    department: user?.department ?? '',
    tel: user?.tel ?? '',
    phone: user?.phone ?? '',
    company: user?.company ?? '',
  });

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
        { text: 'Logout', onPress: logout }, // ✅ เปลี่ยนจาก string 'logout' เป็น function
      ],
      { cancelable: true },
    );
  };

  const handleSubmit = async () => {
    const status = user.status ?? 'U03';
    try {
      const dataUpdateUser = {
        username: form.id,
        name: form.name,
        department: form.department,
        tel: form.tel,
        phone: form.phone,
        company: form.company,
      };

      const responseUpdateUser = await updateUser(dataUpdateUser);

      if (!responseUpdateUser.error) {
        Alert.alert('สำเร็จ', responseUpdateUser.message || 'อัปเดตข้อมูลสำเร็จ');
        if (status === 'U04' || status === 'Home') {
          navigation.navigate('Home');
        } else {
          navigation.navigate('Menu');
        }
      } else {
        Alert.alert('ผิดพลาด', responseUpdateUser.message || 'ไม่สามารถอัปเดตข้อมูลได้');
      }
    } catch (error: any) {
      Alert.alert('ผิดพลาด', error.message || 'ไม่สามารถอัปเดตข้อมูลได้');
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
      <Button title="บันทึก" onPress={handleSubmit} color="#1E8449" />
      <Button title="logout" onPress={confirmLogout} color="#a10101" />

      {/* <TouchableOpacity 
              style={styles.navButton}
              onPress={confirmLogout}>
              <Text style={styles.navButtonText}>Profile</Text>
      </TouchableOpacity> */}
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
  label: { fontWeight: 'bold', width: 110 },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  disabled: {
    backgroundColor: '#f0f0f0',
  },
});

export default ProfileScreen;
