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
import IonIcon from 'react-native-vector-icons/Ionicons';

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
            <View style={styles.detailContainer}>
              <View style={styles.detailItem}>
                <Text style={styles.icon}>⚑</Text>

                <View>
                  <Text style={styles.label}>สถานะ</Text>

                  <Text style={styles.value}>{item.status_name}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.icon}>📍</Text>

                <View>
                  <Text style={styles.label}>ปลายทาง</Text>

                  <Text style={styles.value}>{item.t_com}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.icon}>📅</Text>

                <View>
                  <Text style={styles.label}>วันที่ถึงปลายทาง</Text>

                  <Text style={styles.value}>{item.d_date}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.icon}>🕒</Text>

                <View>
                  <Text style={styles.label}>เวลาถึงปลายทาง</Text>

                  <Text style={styles.value}>{item.d_time}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.icon}>📋</Text>

                <View style={{flex: 1}}>
                  <Text style={styles.label}>รายละเอียด</Text>

                  <Text style={styles.value}>{item.remake}</Text>
                </View>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {canStartWork && (
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={handleStartWork}>
                  <Text style={styles.buttonText}>เริ่มงาน</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => navigation.goBack()}>
                <Text style={styles.buttonText}>ปิด</Text>
              </TouchableOpacity>
            </View>

            <View
              style={{
                height: insets.bottom + 20,
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

  // requestSection: {
  //   alignItems: 'center',
  //   marginBottom: 20,
  // },

  // requestLabel: {
  //   fontSize: 14,
  //   color: '#777',
  //   marginBottom: 6,
  // },

  // requestId: {
  //   fontSize: 30,
  //   fontFamily: 'bold',
  //   color: '#97d700',
  //   marginBottom: 10,
  // },

  // statusBadge: {
  //   backgroundColor: '#e7e7e7',
  //   paddingHorizontal: 16,
  //   paddingVertical: 7,
  //   borderRadius: 30,
  // },

  // statusBadgeText: {
  //   fontSize: 13,
  //   color: '#444',
  //   fontFamily: 'regular',
  // },

  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginBottom: 24,
  },

  detailContainer: {
    gap: 22,
  },

  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  // icon: {
  //   fontSize: 20,
  //   width: 35,
  //   color: '#97d700',
  // },

  label: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
    fontFamily: 'regular',
  },

  value: {
    fontSize: 18,
    color: '#222',
    fontFamily: 'bold',
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 45,
  },

  startButton: {
    backgroundColor: '#97d700',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 120,
  },

  closeButton: {
    backgroundColor: '#d90000',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 120,
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'bold',
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
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
    fontFamily: 'regular',
  },

  requestId: {
    fontSize: 28,
    color: '#93D500',
    fontFamily: 'bold',
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
    fontSize: 14,
    color: '#333',
    fontFamily: 'bold',
  },

  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 10,
    backgroundColor: '#333',
    marginLeft: 10,
  },

  document:{
    width: 30,
    height: 30,
    paddingRight: 50,
  },

});
