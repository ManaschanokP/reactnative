import React, { useEffect, useState, useContext } from 'react';
import {
  View, FlatList, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthProvider';
import { getNotifications } from '../services/apiService';
import { NotificationItem } from '../types/notificationTypes';

type RootStackParamList = {
  NotificationList: undefined;
  NotificationDetail: { item: NotificationItem };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'NotificationList'>;

const NotificationListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useContext(AuthContext)!;

  const [data, setData] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('👤 user:', JSON.stringify(user));

      const params = {
      user_status: user.status,
      requester: user.id,
      page: 'Driver',
    };
      
      console.log('📤 params ที่ส่ง:', JSON.stringify(params));

      const response = await getNotifications(params);
      console.log('📦 response:', JSON.stringify(response));

      if (response.error) {
        throw new Error(response.message ?? 'เกิดข้อผิดพลาด');
      }

      setData(response.Notification); // ✅ ตรงกับ response จริง
    } catch (err) {
      setError('โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => navigation.navigate('NotificationDetail', { item })}
      activeOpacity={0.7}
    >
      <Text style={styles.requestId}>Request ID: {item.request_id}</Text>
      <Text style={styles.detail}>สถานะ: {item.status_name}</Text>
      <Text style={styles.detail}>ปลายทาง: {item.t_com}</Text>
      <Text style={styles.detail}>วันที่: {item.d_date} {item.d_time}</Text>
      <Text style={styles.detail}>รายละเอียด: {item.remake}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#a7cc43" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchNotifications}>
          <Text style={styles.retryText}>ลองใหม่</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.request_id}
        renderItem={renderItem}
        style={styles.listView}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  listView: { flex: 1 },
  listItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    gap: 4,
  },
  requestId: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  detail: { fontSize: 14, color: '#666' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#e74c3c', marginBottom: 12 },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#a7cc43',
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontSize: 15 },
});

export default NotificationListScreen;