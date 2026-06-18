import React, {useState, useContext, useCallback} from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  useWindowDimensions,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {AuthContext} from '../context/AuthProvider';
import {getNotifications} from '../services/apiService';
import {NotificationItem} from '../types/notificationTypes';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {SafeAreaView} from 'react-native-safe-area-context';
import StatusIdCardIcon from '../../assets/ID-TGL.svg';
import StatusMask from '../../assets/Status-Mark.svg';
import StatusCalendar from '../../assets/Status-Calendar.svg';
import StatusPackage from '../../assets/Status-Package.svg';
import StatusCar from '../../assets/Status-Car.svg';
import LicenseCar from '../../assets/car.svg';
import notifee, {AndroidImportance} from '@notifee/react-native';
//import {JobItem} from '../types/NotificationTypes';

type RootStackParamList = {
  NotificationList: undefined;
  NotificationDetail: {item: NotificationItem};
};

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'NotificationList'
>;

const getStatusStyle = (statusName: string) => {
  // if (statusName === 'มอบหมายงานสำเร็จ') {
  //   return {bg: '#e8f5e9', text: '#27ae60', dot: '#27ae60'};
  // }
  if (statusName === 'มอบหมายงานสำเร็จ')
    return {bg: '#fffde6', text: '#D98600', dot: '#D98600'};
  if (statusName === 'ยกเลิก') {
    return {bg: '#fdecea', text: '#e74c3c', dot: '#e74c3c'};
  }
  if (statusName === 'การดำเนินการสำเร็จ') {
    return {bg: '#e4e4e4', text: '#373737', dot: '#373737'};
  }
  return {bg: '#e8f5e9', text: '#27ae60', dot: '#27ae60'};
};

const getFilterStatusLabel = (
  statusId: string,
  statusName?: string,
): string => {
  if (statusId === 'SD09' || statusName === 'ดำเนินการสำเร็จ')
    return 'ดำเนินการสำเร็จ';
  if (statusId === 'SD04' || statusName === 'พบปัญหา') return 'พบปัญหา';
  if (statusId === 'SD10' || statusName === 'ยกเลิก') return 'ยกเลิก';
  if (statusId === 'S002' || statusName === 'มอบหมายงานสำเร็จ')
    return 'รอดำเนินการ';
  return 'กำลังดำเนินการ';
};

const NotificationListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {user, companyColor, setHasUnreadNoti} = useContext(AuthContext)!;
  const insets = useSafeAreaInsets();

  const [data, setData] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {width} = useWindowDimensions();
  const numColumns = width >= 600 ? 2 : 1; // tablet = 2 col, phone = 1 col
  const ICON_SIZE = Math.round(width * 0.08);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [user]),
  );

  const triggerSystemNotification = async (
    requestId: string,
    destination: string,
  ) => {
    // 1. ขอสิทธิ์แจ้งเตือน (จำเป็นมากสำหรับ iOS และ Android 13+)
    await notifee.requestPermission();

    // 2. สร้าง Channel สำหรับ Android (ถ้าไม่สร้าง แจ้งเตือนจะไม่ขึ้นใน Android)
    const channelId = await notifee.createChannel({
      id: 'job-notifications',
      name: 'การแจ้งเตือนงานใหม่',
      importance: AndroidImportance.HIGH, // ความสำคัญสูงเพื่อให้เด้งเป็น Banner ลงมาบนจอ
    });

    // 3. สั่งแสดงผลแจ้งเตือนบนตัวเครื่อง
    await notifee.displayNotification({
      title: '🔔 มีงานใหม่เข้ามา!',
      body: `รหัสงาน: ${requestId} | ปลายทาง: ${destination}`,
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        pressAction: {
          id: 'default',
        },
      },
    });
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        user_status: user.status,
        requester: user.id,
        page: 'Driver',
      };

      const response = await getNotifications(params);
      if (response.error) throw new Error(response.message ?? 'เกิดข้อผิดพลาด');

      const filtered = response.Notification.filter(
        (item: NotificationItem) => item.status_name === 'มอบหมายงานสำเร็จ',
      );

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

      setData(prevData => {
        if (prevData.length > 0 && sorted.length > 0) {
          const newestJob = sorted[0];
          const isBrandNewJob = !prevData.some(
            oldItem => oldItem.request_id === newestJob.request_id,
          );

          if (isBrandNewJob) {
            // 🔥 สั่งเด้งแจ้งเตือนบนแถบ Noti ของมือถือทันที
            triggerSystemNotification(newestJob.request_id, newestJob.t_com);
          }
        }
        return sorted;
      });
      setHasUnreadNoti(sorted.length > 0);
    } catch (err) {
      setError('โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = (dateStr: string, timeStr: string): boolean => {
    try {
      let isoDate = dateStr;
      if (dateStr.includes('/')) {
        const [d, m, y] = dateStr.split('/');
        isoDate = `${y}-${m}-${d}`;
      }
      const jobTime = new Date(`${isoDate} ${timeStr}`);
      return jobTime < new Date();
    } catch {
      return false;
    }
  };

  const isPickupOverdue = (dateStr: string, timeStr: string): boolean => {
    try {
      let isoDate = dateStr;
      if (dateStr.includes('/')) {
        const [d, m, y] = dateStr.split('/');
        isoDate = `${y}-${m}-${d}`;
      }
      const pickupTime = new Date(`${isoDate} ${timeStr}`);
      return pickupTime < new Date();
    } catch {
      return false;
    }
  };

  const renderItem = ({item}: {item: NotificationItem}) => {
    const statusStyle = getStatusStyle(item.status_name);
    const overdue = isOverdue(item.pickup_date, item.pickup_time);
    const pickupOverdue = isPickupOverdue(item.pickup_date, item.pickup_time);
    return (
      <View style={styles.cardWrapper}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('NotificationDetail', {item})}
          activeOpacity={0.8}>
          {/* ── Header ── */}
          {/* ── Header row ── */}
          <View style={styles.cardHeader}>
            <View>
              <View style={styles.idRow}>
                <StatusIdCardIcon width={30} height={30} />
                <Text style={styles.requestId}>{item.request_id}</Text>
              </View>

              <View style={styles.dateRow2}>
                <Text style={styles.dateSubtitle}>วันที่ถึงปลายทาง</Text>
                <Text style={styles.timeSubtitle}>
                  {item.d_date} {item.d_time}
                </Text>
              </View>
            </View>

            <View
              style={[styles.statusBadge, {backgroundColor: statusStyle.bg}]}>
              <Text style={[styles.statusText, {color: statusStyle.text}]}>
                {getFilterStatusLabel(item.status_id, item.status_name)}
              </Text>
              <View
                style={[styles.statusDot, {backgroundColor: statusStyle.dot}]}
              />
            </View>
          </View>

          <View style={styles.divider} />

          {/* ── ปลายทาง ── */}
          <View style={styles.infoRow}>
            <StatusMask width={20} height={20} color="#373737" />
            <View>
              <Text style={styles.infoLabel}>ปลายทาง</Text>
              <Text style={styles.infoValue}>{item.t_com}</Text>
            </View>
          </View>
          {/* ── ประเภทบริการ ── */}
          <View style={styles.infoRow}>
            <StatusPackage width={20} height={20} color="#373737" />
            <View>
              <Text style={styles.infoLabel}>ประเภทการบริการ</Text>
              <Text style={styles.infoValue}>{item.remake}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <StatusCalendar width={20} height={20} color={pickupOverdue ? '#e74c3c' : '#373737'} />
            <View>
              <Text style={styles.infoLabel}>วันที่ขึ้นของ</Text>
              <Text
                style={[
                  styles.footerDate,
                  pickupOverdue && {
                    color: '#e74c3c',
                    fontFamily: 'Quicksand-Bold',
                  },
                ]}>
                {item.pickup_date} {item.pickup_time}
              </Text>
            </View>
          </View>

          {/* ── วันที่ + สถานะล่าง ── */}
          {/* ── Footer ── */}
          <View style={styles.infoRow}>
            <View style={styles.footerItemLeft}>
              <LicenseCar width={20} height={20} color="#373737" />
              <View>
                <Text style={styles.infoLabel}>ทะเบียน</Text>
                <Text style={styles.footerDate}>{item.license_no}</Text>
              </View>
            </View>
            <View style={[styles.footerItemRight]}>
              <StatusCar width={20} height={20} color="#373737" />
              <View>
                <Text style={styles.infoLabel}>สถานะ</Text>
                <Text
                  style={[
                    styles.statusText,
                    item.status_id === 'SD04' && {color: '#e74c3c'},
                    item.status_id === 'SD10' && {color: '#e74c3c'},
                  ]}>
                  {item.status_name}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
        {overdue && (
          <View style={styles.overdotBadge}>
            <Text style={styles.overdotText}>!</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={companyColor} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, {backgroundColor: companyColor}]}
          onPress={fetchNotifications}>
          <Text style={styles.retryText}>ลองใหม่</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <Text style={styles.titleText}>Notification List</Text>
      </SafeAreaView>

      <FlatList
        data={data}
        keyExtractor={item => item.request_id}
        renderItem={renderItem}
        key={numColumns}
        numColumns={numColumns}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        onRefresh={fetchNotifications}
        refreshing={loading}
        ListEmptyComponent={
          <View style={styles.emptyCon}>
            <View style={styles.emptyCon}>
              <Image
                source={require('../../assets/NoJob3.png')}
                style={[styles.delivery]}
                resizeMode="contain"
              />
              <Text style={styles.emptyText}>ไม่พบข้อมูล</Text>
            </View>
          </View>
        }
      />
      <View style={{height: insets.bottom + 60}} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f4f6f8'},
  listContent: {
    padding: 12,
    gap: 12,
    flexGrow: 1,
  },
  delivery: {
    height: 195,
    marginBottom: 24,
  },

  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10, // ชิดบน ไม่ใช่ตรงกลาง
  },

  // Title bar
  titleBar: {
    flexDirection: 'column',
    backgroundColor: '#f4f6f8',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 26,
    paddingVertical: 46,
    elevation: 2,
  },
  titleText: {
    fontSize: 22,
    fontFamily: 'Quicksand-Bold',
    color: '#222',
    paddingHorizontal: 32,
    paddingTop: 12,
    paddingBottom: 12,
  },
  columnWrapper: {
    gap: 12,
    paddingHorizontal: 12,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    elevation: 2,
    gap: 8,
    // flex: 1, // ✅ เพิ่ม — ทำให้ card ยืดเต็ม column
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  idRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  idIcon: {
    width: 44,
    height: 44,
  },
  requestId: {
    fontSize: 18,
    fontFamily: 'Quicksand-Bold',
    color: '#222',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {fontSize: 12, fontFamily: 'Quicksand-Bold', marginBottom: 3},
  statusDot: {width: 7, height: 7, borderRadius: 4},
  divider: {height: 1, backgroundColor: '#f0f0f0'},

  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  infoLabel: {fontSize: 10, color: '#373737', fontFamily: 'Quicksand-Regular'},
  infoValue: {fontSize: 16, color: '#373737', fontFamily: 'Quicksand-Medium'},

  // Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerItemLeft: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    flex: 1,
  },
  footerItemRight: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingRight: 0, // ✅ ปรับให้ตรงกับ statusBadge
  },

  footerDate: {fontSize: 14, color: '#373737', fontFamily: 'Quicksand-Medium'},
  footerStatus: {
    fontSize: 12,
    color: '#373737',
    fontFamily: 'Quicksand-Medium',
  },

  // States
  centered: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  errorText: {
    color: '#e74c3c',
    fontSize: 15,
    fontFamily: 'Quicksand-Medium',
    marginBottom: 12,
  },
  retryButton: {paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8},
  retryText: {color: '#fff', fontSize: 15, fontFamily: 'Quicksand-Medium'},
  emptyText: {
    color: '#bbb',
    fontSize: 14,
    marginTop: 12,
    fontFamily: 'Quicksand-Regular',
  },
  emptyCon: {flex: 1, justifyContent: 'center', alignItems: 'center'},

  dateSubtitle: {
    fontSize: 8,
    color: '#373737',
    fontFamily: 'Quicksand-Regular',
    marginTop: 4,
    paddingRight: 8,
  },
  timeSubtitle: {
    fontSize: 12,
    color: '#373737',
    fontFamily: 'Quicksand-Medium',
    marginTop: 2,
  },
  dateRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  infoContainer: {
    marginLeft: 8,
  },
  cardWrapper: {
    flex: 1,
    position: 'relative', // ✅ ให้จุดแดง absolute ได้
  },
  overdotBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    zIndex: 10,
  },
  overdotText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Quicksand-Bold',
  },
});

export default NotificationListScreen;
