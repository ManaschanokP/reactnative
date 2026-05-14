import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigationTypes';
import { submitSignature } from '../services/apiService';

type Props = NativeStackScreenProps<RootStackParamList, 'Signature'>;

const SignaturePadScreen: React.FC<Props> = ({ route, navigation }) => {
  const { request_id, status_id } = route.params;
  const ref = useRef<SignatureViewRef>(null); // ✅ ใช้ SignatureViewRef แทน typeof SignatureScreen
  const [saving, setSaving] = useState(false);

  const handleClear = () => {
    ref.current?.clearSignature();
  };

  const handleSave = () => {
    ref.current?.readSignature();
  };

  const handleOK = async (signature: string) => {
    const base64 = signature.replace('data:image/png;base64,', '');
    try {
      setSaving(true);
      const response = await submitSignature({ request_id, status_id, picture: base64 });
      Alert.alert('สำเร็จ', response.message, [
        {
          text: 'ตกลง',
          onPress: () => {
            if (status_id === 'SD05' || status_id === 'SD09') {
              navigation.navigate('Evaluation', { request_id, status_id });
            } else {
              navigation.navigate('JobList');
            }
          },
        },
      ]);
    } catch (err) {
      Alert.alert('ข้อผิดพลาด', 'บันทึกลายเซ็นไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>ลายเซ็น :</Text>

      <View style={styles.signatureBox}>
        <SignatureScreen
          ref={ref}
          onOK={handleOK}
          onEmpty={() => Alert.alert('แจ้งเตือน', 'กรุณาเซ็นลายมือก่อน')}
          descriptionText="เซ็นที่นี่"
          clearText=""
          confirmText=""
          webStyle=".m-signature-pad--footer { display: none; }"
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Text style={styles.clearText}>ลบ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveText}>บันทึก</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  label: {
    fontFamily: 'bold',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  signatureBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  clearButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C0392B',
    alignItems: 'center',
  },
  clearText: { color: '#C0392B', fontSize: 16, fontFamily: 'bold' },
  saveButton: {
    flex: 2,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#1E8449',
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontSize: 16, fontFamily: 'bold' },
  disabled: { backgroundColor: '#ccc' },
});

export default SignaturePadScreen;