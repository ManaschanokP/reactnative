import React, { useState, useContext, useCallback } from 'react';
import {
  View, FlatList, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; //เพิ่ม useFocusEffect
import { AuthContext } from '../context/AuthProvider';
import { getNotifications } from '../services/apiService';
import { NotificationItem } from '../types/notificationTypes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type RootStackParamList = {
  NotificationList: undefined;
  NotificationDetail: { item: NotificationItem };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'NotificationList'>;

const NotificationListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>(); 
  const { user }   = useContext(AuthContext)!;
  const insets     = useSafeAreaInsets();

  const [data,    setData]    = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  //re-fetch ทุกครั้งที่หน้านี้ได้ focus (กลับมาจาก NotificationDetail)
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [user]),
  );

  const fetchNotifications = async () => {
  try {
    setLoading(true);
    setError(null);

    const params = {
      user_status: user.status,
      requester:   user.id,
      page:        'Driver',
    };

    const response = await getNotifications(params);

    if (response.error) throw new Error(response.message ?? 'เกิดข้อผิดพลาด');

    //filter ก่อน
    const filtered = response.Notification.filter(
      (item: NotificationItem) => item.status_name === 'มอบหมายงานสำเร็จ',
    );

    console.log(`Total: ${response.Notification.length} | Filtered: ${filtered.length}`);

    //sort จาก filtered ไม่ใช่ response.Notification
    const sorted = [...filtered].sort((a, b) => {
      const parseDate = (date: string, time: string) => {
        if (date.includes('/')) {
          const [d, m, y] = date.split('/');
          return new Date(`${y}-${m}-${d} ${time}`).getTime();
        }
        return new Date(`${date} ${time}`).getTime();
      };
      return parseDate(b.d_date, b.d_time) - parseDate(a.d_date, a.d_time);
    });

    setData(sorted); //ถูกต้อง

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
        //pull to refresh
        onRefresh={fetchNotifications}
        refreshing={loading}
      />
      <View style={{ height: insets.bottom + 44 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#fff' },
  listView:    { flex: 1 },
  listItem: {
    padding:           15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    gap:               4,
  },
  requestId:   { fontSize: 16, fontWeight: 'bold', color: '#333' },
  detail:      { fontSize: 14, color: '#666' },
  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText:   { fontSize: 16, color: '#e74c3c', marginBottom: 12 },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical:   10,
    backgroundColor:   '#a7cc43',
    borderRadius:      8,
  },
  retryText: { color: '#fff', fontSize: 15 },
});

export default NotificationListScreen;