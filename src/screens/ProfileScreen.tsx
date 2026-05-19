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
  Modal,
  useWindowDimensions,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types/navigationTypes';
import {AuthContext} from '../context/AuthProvider';
import {ProfileForm} from '../types/authTypes';
import {getBaseUrlByCompany, API_ENDPOINTS} from '../config/apiConfig';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {SafeAreaView} from 'react-native-safe-area-context';


type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const ProfileScreen: React.FC<Props> = ({navigation}) => {
  const {user, logout, updateUser,companyColor} = useContext(AuthContext)!;

  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [form, setForm] = useState<ProfileForm>({
    id:         user?.id         ?? '',
    name:       user?.name       ?? '',
    department: user?.department ?? '',
    tel:        user?.tel        ?? '',
    phone:      user?.phone      ?? '',
    company:    user?.company    ?? '',
  });

  const { width } = useWindowDimensions();

  const [loading, setLoading] = useState(false);

  // Hardware back button
  useEffect(() => {
    const backAction = () => {
      Alert.alert('Hold on!', 'Are you sure you want to go back?', [
        {text: 'Cancel', style: 'cancel'},
        {text: 'YES', onPress: () => BackHandler.exitApp()},
      ]);
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  // Sync form เมื่อ user context เปลี่ยน
  useEffect(() => {
    if (user) {
      setForm({
        id:         user.id         ?? '',
        name:       user.name       ?? '',
        department: user.department ?? '',
        tel:        user.tel        ?? '',
        phone:      user.phone      ?? '',
        company:    user.company    ?? '',
      });
    }
  }, [user]);

  const handleChange = (key: keyof ProfileForm, value: string) => {
    setForm(prev => ({...prev, [key]: value}));
  };

  const confirmLogout = () => {
    
      setShowConfirmLogout(true);
    
  };

  const handleSubmit = () => {
  if (!form.tel.trim() && !form.phone.trim()) {
    Alert.alert('แจ้งเตือน', 'กรุณากรอกเบอร์ภายในหรือเบอร์มือถืออย่างน้อย 1 ช่อง');
    return;
  }
  setShowConfirm(true);
};

const doSubmit = async () => {
  try {
    setLoading(true);
    const baseUrl = await getBaseUrlByCompany();
    const url = `${baseUrl}${API_ENDPOINTS.UPDATE_PROFILE}`;
    const formData = new FormData();
    formData.append('username',   form.id);
    formData.append('name',       form.name);
    formData.append('department', form.department);
    formData.append('tel',        form.tel);
    formData.append('phone',      form.phone);
    formData.append('company',    form.company);

    const response = await fetch(url, {method: 'POST', body: formData});
    const obj = await response.json();

    if (!obj.error) {
      
      setSuccessMessage(obj.message || 'บันทึกข้อมูลสำเร็จ');
      setShowSuccess(true);
    } else {
      Alert.alert('ผิดพลาด', obj.message || 'ไม่สามารถอัปเดตข้อมูลได้');
    }
  } catch (error: any) {
    Alert.alert('ผิดพลาด', error.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
  } finally {
    setLoading(false);
  }
};
  return (
    <>
     {/* ── ConfirmLogout Modal ── */}
  <Modal transparent visible={showConfirmLogout} animationType="fade">
    <View style={modalStyles.overlay}>
      <View style={modalStyles.box}>
        <View style={[modalStyles.iconCircle, {backgroundColor:  '#F5A800'}]}>
          <Text style={modalStyles.iconText}>!</Text>
        </View>
        <Text style={modalStyles.title}>ออกจากระบบ</Text>
        <Text style={modalStyles.message}>
          ต้องการ "ออกจากระบบ" ใช่ไหม ?
        </Text>
        <View style={modalStyles.buttons}>
          <TouchableOpacity
            style={modalStyles.cancelBtn}
            onPress={() => setShowConfirmLogout(false)}
          >
            <Text style={modalStyles.cancelText}>ยกเลิก</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[modalStyles.confirmBtn, {backgroundColor: companyColor ?? '#a7cc43'}]}
            onPress={() => {
              setShowConfirmLogout(false);
              setTimeout(() => {
                logout();
              }, 100);
            }}
          >
            <Text style={modalStyles.confirmText}>ออกจากระบบ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
    {/* ── Confirm Modal ── */}
  <Modal transparent visible={showConfirm} animationType="fade">
    <View style={modalStyles.overlay}>
      <View style={modalStyles.box}>
        <View style={[modalStyles.iconCircle, {backgroundColor: companyColor ?? '#a7cc43'}]}>
          <Text style={modalStyles.iconText}>!</Text>
        </View>
        <Text style={modalStyles.title}>บันทึก</Text>
        <Text style={modalStyles.message}>
          ต้องการบันทึก "ข้อมูล" ใช่ไหม ?
        </Text>
        <View style={modalStyles.buttons}>
          <TouchableOpacity
            style={modalStyles.cancelBtn}
            onPress={() => setShowConfirm(false)}
          >
            <Text style={modalStyles.cancelText}>ยกเลิก</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[modalStyles.confirmBtn, {backgroundColor: companyColor ?? '#a7cc43'}]}
            onPress={() => {
              setShowConfirm(false);
              setTimeout(() => {
                doSubmit();
              }, 100);
            }}
          >
            <Text style={modalStyles.confirmText}>ยืนยัน</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>

  {/* ── Success Modal ── */}
  <Modal transparent visible={showSuccess} animationType="fade">
    <View style={modalStyles.overlay}>
      <View style={modalStyles.box}>
        <View style={[modalStyles.iconCircle, {backgroundColor: companyColor ?? '#a7cc43'}]}>
          <Text style={modalStyles.iconCheck}>✓</Text>
        </View>
        <Text style={modalStyles.title}>สำเร็จ</Text>
        <Text style={modalStyles.message}>บันทึกข้อมูลสำเร็จ</Text>
        <TouchableOpacity
          style={[modalStyles.fullBtn, {backgroundColor: companyColor ?? '#a7cc43'}]}
          onPress={async () => {
            setShowSuccess(false);
            await updateUser({
            name: form.name, department: form.department,
            tel: form.tel, phone: form.phone, company: form.company,
          });
            navigation.navigate('Home');
          }}
        >
          <Text style={modalStyles.confirmText}>ตกลง</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
    <View style={styles.container}>
      {/* ── Title ── */}
      <SafeAreaView edges={['top']}>
             
        <Text style={styles.pageTitle}>Profile</Text>
        <View style={[styles.line, { marginHorizontal: width * 0.085 }]} />
        <View style={styles.empty} />
      </SafeAreaView>
    
      <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      
      <Field
        label="Name ( ชื่อ - นามสกุล ) :"
        value={form.name}
        editable={false}
        placeholder="Firstname Lastname"
      />

      <Field
        label="Department ( แผนก ) :"
        value={form.department}
        editable={false}
        placeholder="Department"
      />

      <Field
        label="Ext. ( เบอร์ติดต่อภายใน ) :"
        value={form.tel}
        editable={true}
        required
        keyboardType="phone-pad"
        placeholder="081-234-5678"
        onChangeText={text => handleChange('tel', text)}
      />

      <Field
        label="Mobile ( เบอร์มือถือ ) :"
        value={form.phone}
        editable={true}
        required
        keyboardType="phone-pad"
        placeholder="091-234-5678"
        onChangeText={text => handleChange('phone', text)}
      />

      <Field
        label="Company ( บริษัท ) :"
        value={form.company}
        editable={false}
        placeholder="TGL"
      />

      {/* ── Save Button ── */}
      <View style={styles.savebt}>
      <TouchableOpacity
        style={[
          styles.saveButton,
          {backgroundColor: companyColor ?? '#F5A800'},
          loading && styles.buttonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.saveButtonInner}>
            <Icon name="tray-arrow-down" size={28} color="#fff" />
            <Text style={styles.saveText}>  บันทึก</Text>
          </View>
        )}
      </TouchableOpacity>
      </View>
      {/* ── Logout Link ── */}
      <TouchableOpacity style={styles.logoutLink} onPress={confirmLogout}>
        <Text style={styles.logoutText}>ออกจากระบบ</Text>
      </TouchableOpacity>

      <View style={{height: 90}} />
    </ScrollView>
    </View>
    </>
  );
};

// ── Field Component ──
type FieldProps = {
  label: string;
  value: string;
  editable?: boolean;
  required?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'numeric' | 'email-address';
  placeholder?: string;
  onChangeText?: (text: string) => void;
};

const Field: React.FC<FieldProps> = ({
  label,
  value,
  editable = true,
  required = false,
  keyboardType = 'default',
  placeholder,
  onChangeText,
}) => (
  <View style={styles.fieldWrap}>
    <View style={styles.labelRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {required && <Text style={styles.required}> *</Text>}
    </View>
    <TextInput
      style={[styles.fieldInput, !editable && styles.fieldDisabled]}
      value={value}
      onChangeText={onChangeText}
      editable={editable}
      keyboardType={keyboardType}
      placeholder={placeholder}
      placeholderTextColor="#bbb"
    />
  </View>
);

// ── Styles ──
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  content:   {padding: 24, paddingTop: 20},

  pageTitle: {
    fontSize:   22,
    fontFamily: 'Quicksand-Bold',
    color:      '#222',
    paddingVertical: 22,
    paddingHorizontal: 34,
    paddingTop:        15,  
    paddingBottom:     15,
  },
   line: {
    height: 1,
    backgroundColor: '#CFCFCF',
  },
  empty:{
    paddingHorizontal: 2,
    paddingBottom:     15,
  },

  fieldWrap: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  6,
  },
  fieldLabel: {
    fontSize:   14,
    color:      '#6C7278',
    fontFamily: 'Quicksand-Bold',
  },
  required: {
    color:      '#e74c3c',
    fontSize:   14,
    fontFamily: 'Quicksand-Bold',
  },
  fieldInput: {
    borderWidth:     1,
    borderColor:     '#ddd',
    borderRadius:    10,
    padding:         14,
    fontSize:        14,
    color:           '#373737',
    backgroundColor: '#fff',
    fontFamily: 'Quicksand-Bold'
  },
  fieldDisabled: {
    backgroundColor: '#f0f0f0',
    color:           '#373737',
    borderColor:     '#e8e8e8',
    fontFamily: 'Quicksand-Bold'
  },
  savebt:{
    marginVertical: 12, 
    alignItems: 'center'
  },

  saveButton: {
    
    padding:         16,
    borderRadius:    12,
    alignItems:      'center',
    justifyContent: 'center',
    marginTop:       8,
    elevation:       2,
    width:          '70%',
  },
  saveButtonInner: {
  flexDirection: 'row',
  alignItems:    'center',
  justifyContent: 'center',
},
  saveText: {
    color:      '#fff',
    fontSize:   16,
    fontFamily: 'Quicksand-Bold',
  },
  buttonDisabled: {backgroundColor: '#ccc'},

  logoutLink: {
    alignItems:    'center',
    marginTop:     20,
    paddingBottom: 8,
  },
  logoutText: {
    color:              '#D00000',
    fontSize:           14,
    fontFamily:         'Quicksand-Bold',
    textDecorationLine: 'underline',
  },
});
const modalStyles = StyleSheet.create({
  overlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent:  'center',
    alignItems:      'center',
  },
  box: {
    backgroundColor: '#fff',
    borderRadius:    16,
    padding:         24,
    width:           '80%',
    alignItems:      'center',
    elevation:       5,
  },
  iconCircle: {
    width:          60,
    height:         60,
    borderRadius:   30,
    justifyContent: 'center',
    alignItems:     'center',
    marginBottom:   16,
  },
  iconText:  {color: '#fff', fontSize: 30, fontFamily: 'Quicksand-Bold'},
  iconCheck: {color: '#fff', fontSize: 28, fontFamily: 'Quicksand-Bold'},
  title: {
    fontSize:     20,
    fontFamily:   'Quicksand-Bold',
    color:        '#333',
    marginBottom: 8,
  },
  message: {
    fontSize:     14,
    color:        '#555',
    textAlign:    'center',
    marginBottom: 24,
    lineHeight:   22,
  },
  buttons: {flexDirection: 'row', gap: 12, width: '100%'},
  cancelBtn: {
    flex:         1,
    padding:      12,
    borderRadius: 8,
    borderWidth:  1,
    borderColor:  '#ccc',
    alignItems:   'center',
  },
  cancelText:  {color: '#666', fontSize: 15, fontFamily: 'Quicksand-Bold'},
  confirmBtn:  {flex: 1, padding: 12, borderRadius: 8, alignItems: 'center'},
  confirmText: {color: '#fff', fontSize: 15, fontFamily: 'Quicksand-Bold'},
  fullBtn:     {width: '100%', padding: 12, borderRadius: 8, alignItems: 'center'},
});

export default ProfileScreen;