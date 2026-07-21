// app/src/screens/ProfileScreen.tsx
import React, {useEffect, useState, useContext} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  BackHandler,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types/navigationTypes';
import {AuthContext} from '../context/AuthProvider';
import {ProfileForm} from '../types/authTypes';
import {getBaseUrlByCompany, API_ENDPOINTS} from '../config/apiConfig';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {SafeAreaView} from 'react-native-safe-area-context';
import CustomModal from '../components/Modal';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const ProfileScreen: React.FC<Props> = ({navigation}) => {
  const {user, logout, updateUser, companyColor} = useContext(AuthContext)!;

  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const [showBackConfirm, setShowBackConfirm] = useState(false);

  const showAlert = (title: string, message: string) => {
    setAlertModal({visible: true, title, message});
  };

  const [form, setForm] = useState<ProfileForm>({
    id: user?.id ?? '',
    name: user?.name ?? '',
    department: user?.department ?? '',
    tel: user?.tel ?? '',
    phone: user?.phone ?? '',
    company: user?.company ?? '',
  });

  const {width} = useWindowDimensions();

  const [loading, setLoading] = useState(false);

  // Hardware back button
  useEffect(() => {
    const backAction = () => {
      setShowBackConfirm(true);
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
    return () => backHandler.remove();
  }, []);

  // Sync form เมื่อ user context เปลี่ยน
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
    setShowConfirmLogout(true);
  };

  const handleSubmit = () => {
    if (!form.tel.trim() && !form.phone.trim()) {
      showAlert(
        'แจ้งเตือน',
        'กรุณากรอกเบอร์ภายในหรือเบอร์มือถืออย่างน้อย 1 ช่อง',
      );
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
      formData.append('username', form.id);
      formData.append('name', form.name);
      formData.append('department', form.department);
      formData.append('tel', form.tel);
      formData.append('phone', form.phone);
      formData.append('company', form.company);

      const response = await fetch(url, {method: 'POST', body: formData});
      const obj = await response.json();

      if (!obj.error) {
        setSuccessMessage(obj.message || 'บันทึกข้อมูลสำเร็จ');
        setShowSuccess(true);
      } else {
        showAlert('ผิดพลาด', obj.message || 'ไม่สามารถอัปเดตข้อมูลได้');
      }
    } catch (error: any) {
      showAlert('ผิดพลาด', error.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      {/*กดออกจากแอป*/}
      <CustomModal
        visible={showBackConfirm}
        icon="!"
        title="ออกจากแอป"
        message="ต้องการออกจากแอป ใช่ไหม ? "
        buttons={[
          {
            text: 'ยกเลิก',
            color: '#FFFFFF',
            textColor: '#000000',
            borderColor: '#000000',
            onPress: () => setShowBackConfirm(false),
          },
          {
            text: 'ออกจากแอป',
            color: companyColor,
            onPress: () => {
              setShowBackConfirm(false);
              setTimeout(() => BackHandler.exitApp(), 100);
            },
          },
        ]}
      />

      {/* แจ้งเตือนเมื่อไม่กรอกเบอร์โทร */}
      <CustomModal
        visible={alertModal.visible}
        icon="!"
        iconBackgroundColor="#e74c3c"
        title="แจ้งเตือน"
        message="กรุณากรอกเบอร์โทรอย่างน้อย 1 ช่อง "
        buttons={[
          {
            text: 'ตกลง',
            color: companyColor,
            onPress: () => {
              setAlertModal(prev => ({...prev, visible: false}));
            },
          },
        ]}
      />

      {/*แจ้งเตือนเมื่อกดออกจากระบบ*/}
      <CustomModal
        visible={showConfirmLogout}
        icon="!"
        title="ออกจากระบบ"
        message="ต้องการออกจากระบบ ใช่ไหม ? "
        buttons={[
          {
            text: 'ยกเลิก',
            color: '#FFFFFF',
            textColor: '#000000',
            borderColor: '#000000',
            onPress: () => setShowConfirmLogout(false),
          },
          {
            text: 'ออกจากระบบ',
            color: companyColor,
            onPress: () => {
              setShowConfirmLogout(false);
              setTimeout(() => {
                logout();
              }, 100);
            },
          },
        ]}
      />

      {/*แจ้งเตือนเมื่อกดบันทึกข้อมูลที่แก้ไขแล้ว*/}
      <CustomModal
        visible={showConfirm}
        icon="!"
        iconBackgroundColor={companyColor}
        title="บันทึก"
        message="ต้องการบันทึกข้อมูล ใช่ไหม?"
        buttons={[
          {
            text: 'ยกเลิก',
            color: '#FFFFFF',
            textColor: '#000000',
            borderColor: '#000000',
            onPress: () => setShowConfirm(false),
          },
          {
            text: 'ยืนยัน',
            color: companyColor,
            onPress: () => {
              setShowConfirm(false);

              setTimeout(() => {
                doSubmit();
              }, 100);
            },
          },
        ]}
      />

      {/*แจ้งเตือนเมื่อบันทึกข้อมูลที่แก้ไขสำเร็จ*/}
      <CustomModal
        visible={showSuccess}
        icon="✓"
        iconBackgroundColor={companyColor}
        title="สำเร็จ"
        message="บันทึกข้อมูลสำเร็จ"
        buttons={[
          {
            text: 'ตกลง',
            color: companyColor,
            onPress: () => {
              setShowSuccess(false);

              setTimeout(async () => {
                await updateUser({
                  name: form.name,
                  department: form.department,
                  tel: form.tel,
                  phone: form.phone,
                  company: form.company,
                });

                navigation.navigate('Home');
              }, 100);
            },
          },
        ]}
      />

      <View style={styles.container}>
        {/* ── Title ── */}
        <SafeAreaView edges={['top']}>
          <Text style={styles.pageTitle}>Profile</Text>
          <View style={[styles.line, {marginHorizontal: width * 0.085}]} />
          <View style={styles.empty} />
        </SafeAreaView>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
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
            placeholder="XXXX"
            onChangeText={text => handleChange('tel', text)}
          />

          <Field
            label="Mobile ( เบอร์มือถือ ) :"
            value={form.phone}
            editable={true}
            required
            keyboardType="phone-pad"
            placeholder="XXX-XXX-XXXX"
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
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.saveButtonInner}>
                  <Icon name="tray-arrow-down" size={28} color="#fff" />
                  <Text style={styles.saveText}> บันทึก</Text>
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
  content: {padding: 24, paddingTop: 20},

  pageTitle: {
    fontSize: 22,
    fontFamily: 'Quicksand-Bold',
    color: '#222',
    paddingVertical: 22,
    paddingHorizontal: 34,
    paddingTop: 15,
    paddingBottom: 15,
  },
  line: {
    height: 1,
    backgroundColor: '#CFCFCF',
  },
  empty: {
    paddingHorizontal: 2,
    paddingBottom: 15,
  },

  fieldWrap: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#6C7278',
    fontFamily: 'Quicksand-Bold',
  },
  required: {
    color: '#e74c3c',
    fontSize: 14,
    fontFamily: 'Quicksand-Bold',
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    color: '#373737',
    backgroundColor: '#fff',
    fontFamily: 'Quicksand-Bold',
  },
  fieldDisabled: {
    backgroundColor: '#f0f0f0',
    color: '#373737',
    borderColor: '#e8e8e8',
    fontFamily: 'Quicksand-Bold',
  },
  savebt: {
    marginVertical: 12,
    alignItems: 'center',
  },

  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    elevation: 2,
    width: '70%',
  },
  saveButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
  },
  buttonDisabled: {backgroundColor: '#ccc'},

  logoutLink: {
    alignItems: 'center',
    marginTop: 20,
    paddingBottom: 8,
  },
  logoutText: {
    color: '#D00000',
    fontSize: 14,
    fontFamily: 'Quicksand-Bold',
    textDecorationLine: 'underline',
  },
});

export default ProfileScreen;
