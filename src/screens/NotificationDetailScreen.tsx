import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NotificationItem } from '../types/notificationTypes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type RootStackParamList = {
  NotificationList: undefined;
  NotificationDetail: { item: NotificationItem };
};

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationDetail'>;

const NotificationDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { item } = route.params; // ✅ รับข้อมูลที่ส่งมาจากหน้า List
  const insets        = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Request ID :</Text>
      <Text style={styles.text}>{item.request_id}</Text>

      <Text style={styles.label}>สถานะ :</Text>
      <Text style={styles.text}>{item.status_name}</Text>

      <Text style={styles.label}>ปลายทาง :</Text>
      <Text style={styles.text}>{item.t_com}</Text>

      <Text style={styles.label}>วันที่ถึงปลายทาง :</Text>
      <Text style={styles.text}>{item.d_date}</Text>

      <Text style={styles.label}>เวลาถึงปลายทาง :</Text>
      <Text style={styles.text}>{item.d_time}</Text>

      <Text style={styles.label}>รายละเอียด :</Text>
      <Text style={styles.text}>{item.remake}</Text>

      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Text style={styles.closeText}>ปิด</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.workButton} onPress={() => navigation.goBack()}>
        <Text style={styles.closeText}>เริ่มงาน</Text>
      </TouchableOpacity>
      <View style={{ height: insets.bottom + 44 }} />
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
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 20,
    color: '#333',
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
    color: '#555',
  },
  closeButton: {
    marginTop: 30,
    backgroundColor: '#C0392B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  workButton: {
    marginTop: 30,
    backgroundColor: '#3ddf6d',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});

export default NotificationDetailScreen;