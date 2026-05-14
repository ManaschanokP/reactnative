// app/src/screens/ProfileScreen.tsx
import React, {useEffect, useState, useContext} from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  BackHandler,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types/navigationTypes';
import {AuthContext} from '../context/AuthProvider';
import {ProfileForm} from '../types/authTypes';
import {getBaseUrlByCompany, API_ENDPOINTS} from '../config/apiConfig';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const ProfileScreen: React.FC<Props> = ({navigation}) => {
  const {user, logout, updateUser} = useContext(AuthContext)!;

  const [form, setForm] = useState<ProfileForm>({
    id: user?.id ?? '',
    name: user?.name ?? '',
    department: user?.department ?? '',
    tel: user?.tel ?? '',
    phone: user?.phone ?? '',
    company: user?.company ?? '',
  });

  const [loading, setLoading] = useState(false);

  //Hardware back button
  useEffect(() => {
    const backAction = () => {
      Alert.alert('Hold on!', 'Are you sure you want to go back?', [
        {text: 'Cancel', style: 'cancel'},
        {text: 'YES', onPress: () => BackHandler.exitApp()},
      ]);
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
    return () => backHandler.remove();
  }, []);

  //Sync form เมื่อ user context เปลี่ยน
  useEffect(() => {
    if (user) {
      setForm({
        id: user.id ?? '',
        name: user.name ?? '',
        department: user.department ?? '',
        tel: user.tel ?? '',
        phone: user.phone ?? '',
        company: user.company ?? '',
      });
    }
  }, [user]);

  const handleChange = (key: keyof ProfileForm, value: string) => {
    setForm(prev => ({...prev, [key]: value}));
  };

  const confirmLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Logout', onPress: logout},
      ],
      {cancelable: true},
    );
  };

  //Submit
  const handleSubmit = async () => {
    //Validation
    if (!form.tel.trim() && !form.phone.trim()) {
      Alert.alert(
        'แจ้งเตือน',
        'กรุณากรอกเบอร์ภายในหรือเบอร์มือถืออย่างน้อย 1 ช่อง',
      );
      return;
    }

    try {
      setLoading(true);

      const baseUrl = await getBaseUrlByCompany();
      const url = `${baseUrl}${API_ENDPOINTS.UPDATE_PROFILE}`;

      const formData = new FormData();
      formData.append('username', form.id);
      formData.append('name', form.name);
      formData.append('department', form.department);
      formData.append('tel', form.tel);
      formData.append('phone', form.phone);
      formData.append('company', form.company);

      console.log('📡 POST UpdateProfile:', url);
      console.log('📦 payload:', form);

      const response = await fetch(url, {method: 'POST', body: formData});
      const obj = await response.json();
      console.log('response:', obj);

      if (!obj.error) {
        //อัปเดต context + AsyncStorage ทันที ไม่ต้อง login ใหม่
        await updateUser({
          name: form.name,
          department: form.department,
          tel: form.tel,
          phone: form.phone,
          company: form.company,
        });

        Alert.alert('สำเร็จ', obj.message || 'อัปเดตข้อมูลสำเร็จ', [
          {
            text: 'ตกลง',
            onPress: () => {
              const status = user?.status ?? '';
              if (status === 'U04' || status === 'Home') {
                navigation.navigate('Home');
              } else {
                navigation.navigate('Home');
              }
            },
          },
        ]);
      } else {
        Alert.alert('ผิดพลาด', obj.message || 'ไม่สามารถอัปเดตข้อมูลได้');
      }
    } catch (error: any) {
      console.error('error:', error);
      Alert.alert(
        'ผิดพลาด',
        error.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้',
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      {/*Header*/}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {form.name ? form.name.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <Text style={styles.headerName}>{form.name}</Text>
        <Text style={styles.headerDept}>{form.department}</Text>
      </View>

      {/* ── Form Card ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>ข้อมูลส่วนตัว</Text>

        <Field label="ชื่อ-นามสกุล" value={form.name} editable={false} />
        <Field label="แผนก" value={form.department} editable={false} />
        <Field label="บริษัท" value={form.company} editable={false} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>ข้อมูลติดต่อ</Text>

        <Field
          label="เบอร์ภายใน"
          value={form.tel}
          editable={true}
          keyboardType="phone-pad"
          onChangeText={text => handleChange('tel', text)}
          placeholder="กรอกเบอร์ภายใน"
        />
        <Field
          label="เบอร์มือถือ"
          value={form.phone}
          editable={true}
          keyboardType="phone-pad"
          onChangeText={text => handleChange('phone', text)}
          placeholder="กรอกเบอร์มือถือ"
        />
      </View>

      {/*Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}> บันทึก</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
          <Text style={styles.buttonText}> Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={{height: 40}} />
    </ScrollView>
  );
};

//Field component
type FieldProps = {
  label: string;
  value: string;
  editable?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'numeric' | 'email-address';
  placeholder?: string;
  onChangeText?: (text: string) => void;
};

const Field: React.FC<FieldProps> = ({
  label,
  value,
  editable = true,
  keyboardType = 'default',
  placeholder,
  onChangeText,
}) => (
  <View style={styles.fieldRow}>
    <Text style={styles.fieldLabel}>{label} :</Text>
    <TextInput
      style={[styles.fieldInput, !editable && styles.fieldDisabled]}
      value={value}
      onChangeText={onChangeText}
      editable={editable}
      keyboardType={keyboardType}
      placeholder={placeholder ?? label}
      placeholderTextColor="#bbb"
    />
  </View>
);

//Styles
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  content: {padding: 16},

  // Header
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#a7cc43',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 3,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerDept: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#a7cc43',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },

  // Field
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  fieldLabel: {
    width: 110,
    fontWeight: 'bold',
    fontSize: 13,
    color: '#555',
  },
  fieldInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#333',
  },
  fieldDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999',
    borderBottomColor: '#eee',
  },

  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#a7cc43',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },
  logoutButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },
  buttonDisabled: {backgroundColor: '#ccc'},
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default ProfileScreen;
