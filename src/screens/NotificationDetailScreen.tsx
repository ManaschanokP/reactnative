import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {NotificationItem} from '../types/notificationTypes';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {getCompanyColor} from '../context/AuthProvider';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Icon6 from 'react-native-vector-icons/FontAwesome6';
import Icons from 'react-native-vector-icons/Ionicons';
import IconO from 'react-native-vector-icons/Octicons';

type RootStackParamList = {
  NotificationList: undefined;

  NotificationDetail: {
    item: NotificationItem;
  };

  ViewDetail: {
    item: {
      request_id: string;
      status_id: string;
      status_name: string;
      type_name: string;
      to_company: string;
      d_date: string;
      d_time: string;
    };

    fromScreen?: string;
  };
};

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationDetail'>;

const NotificationDetailScreen: React.FC<Props> = ({route, navigation}) => {
  const {item} = route.params;

  const insets = useSafeAreaInsets();

  const companyColor = getCompanyColor(item.company_code);

  const canStartWork = item.status_name !== 'การดำเนินการสำเร็จ';

  const handleStartWork = () => {
    navigation.navigate('ViewDetail', {
      item: {
        request_id: item.request_id,
        status_id: 'SD00',
        status_name: 'กำลังไปรับของ',
        type_name: item.type_name ?? '',
        to_company: item.t_com ?? '',
        d_date: item.d_date ?? '',
        d_time: item.d_time ?? '',
      },

      fromScreen: 'NotificationList',
    });
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <View style={styles.container}>
        <StatusBar backgroundColor={companyColor} barStyle="light-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>{'‹'}</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Notification Detail</Text>
        </View>

        {/* Content */}
        <View style={styles.card}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Request */}
            <View style={styles.requestSection}>
              <View style={styles.requestRow}>
                {/* Icon */}
                <Image
                  source={require('../../assets/document.png')}
                  style={styles.document}
                  resizeMode="contain"
                />

                {/* Right Content */}
                <View>
                  <Text style={styles.requestLabel}>Request ID</Text>

                  <Text style={styles.requestId}>{item.request_id}</Text>

                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>
                      {item.status_name}
                    </Text>

                    <View style={styles.statusDot} />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Detail List */}
            <View style={styles.detailItem}>
              <Icon name="flag" size={24} color="#8BC400" style={styles.icon} />

              <View>
                <Text style={styles.label}>สถานะ</Text>
                <Text style={styles.value}>{item.status_name}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Icon6
                name="location-dot"
                size={24}
                color="#8BC400"
                style={styles.icon}
              />

              <View>
                <Text style={styles.label}>ปลายทาง</Text>
                <Text style={styles.value}>{item.t_com}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Icon
                name="calendar-month"
                size={24}
                color="#8BC400"
                style={styles.icon}
              />

              <View>
                <Text style={styles.label}>วันที่ถึงปลายทาง</Text>
                <Text style={styles.value}>{item.d_date}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Icon6
                name="clock"
                size={24}
                color="#8BC400"
                style={styles.icon}
              />

              <View>
                <Text style={styles.label}>เวลาที่ถึงปลายทาง</Text>
                <Text style={styles.value}>{item.d_time}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Icon
                name="format-list-bulleted"
                size={24}
                color="#8BC400"
                style={styles.icon}
              />

              <View style={{flex: 1}}>
                <Text style={styles.label}>รายละเอียด</Text>
                <Text style={styles.value}>{item.remake}</Text>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {canStartWork && (
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={handleStartWork}>
                  <Icons
                    name="play-skip-back-circle-sharp"
                    size={24}
                    color="#ffffff"
                    style={styles.iconbottom}
                  />
                  <Text style={styles.buttonText}>เริ่มงาน</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => navigation.goBack()}>
                <IconO
                  name="x-circle-fill"
                  size={20}
                  color="#ffffff"
                  style={styles.iconbottom}
                />
                <Text style={styles.buttonText}>ปิด</Text>
              </TouchableOpacity>
            </View>

            <View
              style={{
                height: insets.bottom + 30,
              }}
            />
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default NotificationDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#97d700',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 15,
  },

  backButton: {
    fontSize: 45,
    fontFamily: 'Quicksand-Bold',
    color: '#fff',
    marginRight: 10,
    paddingTop: 34,
    paddingLeft: 5,
  },

  headerTitle: {
    fontSize: 24,
    fontFamily: 'Quicksand-Bold',
    color: '#fff',
    paddingTop: 48,
    paddingLeft: 10,
  },

  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
  },

  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginBottom: 24,
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 35,
    marginBottom: 45,
  },

  startButton: {
    flexDirection: 'row',
    backgroundColor: '#93D500',
    //paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 120,
    width: 100,
    height: 40,
  },

  closeButton: {
    flexDirection: 'row',
    backgroundColor: '#D00000',
    //paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 120,
    width: 100,
    height: 40,
  },

  iconbottom: {
    alignItems: 'center',
    paddingRight: 10,
  },

  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Quicksand-Bold',
  },

  //request ID
  requestSection: {
    marginBottom: 20,
  },

  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  requestIcon: {
    fontSize: 40,
    marginRight: 16,
  },

  requestLabel: {
    fontSize: 12,
    color: '#373737',
    marginBottom: 4,
    fontFamily: 'Quicksand-SemiBold',
  },

  requestId: {
    fontSize: 24,
    color: '#93D500',
    fontFamily: 'Quicksand-Bold',
    marginBottom: 10,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',

    backgroundColor: '#d9d9d9',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },

  statusBadgeText: {
    fontSize: 12,
    color: '#373737',
    fontFamily: 'Quicksand-Bold',
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: '#373737',
    marginLeft: 10,
  },

  document: {
    width: 30,
    height: 30,
    paddingRight: 50,
  },

  detailContainer: {
    backgroundColor: '#F3F3F3',
    borderRadius: 12,
    padding: 20,
  },

  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },

  icon: {
    marginRight: 16,
    marginTop: 15,
    marginLeft: 15,
  },

  label: {
    fontSize: 12,
    color: '#37373780',
    marginBottom: 4,
    fontFamily: 'Quicksand-SemiBold',
  },

  value: {
    fontSize: 16,
    color: '#373737',
    fontFamily: 'Quicksand-Bold',
  },
});
