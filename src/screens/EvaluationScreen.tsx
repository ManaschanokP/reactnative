import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types/navigationTypes';
import {submitEvaluation} from '../services/apiService';

type Props = NativeStackScreenProps<RootStackParamList, 'Evaluation'>;

const EvaluationScreen: React.FC<Props> = ({route, navigation}) => {
  const {request_id, status_id} = route.params;
  const [rating, setRating] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (rating === 0) {
      Alert.alert('แจ้งเตือน', 'กรุณาให้คะแนนก่อน');
      return;
    }
    try {
      setSaving(true);
      const response = await submitEvaluation({
        request_id,
        status_id,
        eval: rating.toString(),
      });
      Alert.alert('สำเร็จ', response.message, [
        {text: 'ตกลง', onPress: () => navigation.navigate('JobList')},
      ]);
    } catch (err) {
      Alert.alert('ข้อผิดพลาด', 'บันทึกการประเมินไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ประเมินความพึงพอใจ</Text>
      <Text style={styles.subtitle}>Request ID: {request_id}</Text>

      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Text style={[styles.star, star <= rating && styles.starActive]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.ratingText}>
        {rating > 0 ? `${rating} / 5 ดาว` : 'กรุณาเลือกคะแนน'}
      </Text>

      <TouchableOpacity
        style={[styles.saveButton, (saving || rating === 0) && styles.disabled]}
        onPress={handleSave}
        disabled={saving || rating === 0}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveText}>บันทึกการประเมิน</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
  },
  title: {fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#333'},
  subtitle: {fontSize: 14, color: '#888', marginBottom: 32},
  starsRow: {flexDirection: 'row', gap: 8, marginBottom: 16},
  star: {fontSize: 48, color: '#ddd'},
  starActive: {color: '#f1c40f'},
  ratingText: {fontSize: 16, color: '#555', marginBottom: 32},
  saveButton: {
    width: '100%',
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#a7cc43',
    alignItems: 'center',
  },
  saveText: {color: '#fff', fontSize: 16, fontWeight: 'bold'},
  disabled: {backgroundColor: '#ccc'},
});

export default EvaluationScreen;
