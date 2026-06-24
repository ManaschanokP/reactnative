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
  Pressable,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {getCompanyColor} from '../context/AuthProvider';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Icon6 from 'react-native-vector-icons/FontAwesome6';
import Icons from 'react-native-vector-icons/Ionicons';
import IconO from 'react-native-vector-icons/Octicons';
import CalenderTGL from '../../assets/CalendarThaiGL.svg';
import License from '../../assets/license.svg';
import {RootStackParamList} from '../types/navigationTypes';

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationDetail'>;

const NotificationDetailScreen: React.FC<Props> = ({route, navigation}) => {
  const {item} = route.params;

  const insets = useSafeAreaInsets();

  const companyColor = getCompanyColor(item.companyCode);

  const canStartWork = item.status_name !== 'การดำเนินการสำเร็จ';

  const handleStartWork = () => {
    console.log(
      '[Debug] item.type_name:',
      item.type_name,
      item.request_id,
      item.t_com,
      item.remake,
    );
    navigation.navigate('ViewDetail', {
      item: {
        request_id: item.request_id,
        status_id: 'SD00',
        status_name: 'กำลังไปรับของ',
        type_name: item.remake ?? '',
        to_company: item.t_com ?? '',
        d_date: item.d_date ?? '',
        d_time: item.d_time ?? '',
        pickup_date: item.pickup_date ?? '',
        pickup_time: item.pickup_time ?? '',
        license_no: item.license_no ?? '',
      },

      fromScreen: 'NotificationList',
    });
  };

  return (
    <SafeAreaView style={styles.containerNobackground}>
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
              <Text style={styles.requestLabel}>Request ID</Text>
              <View style={styles.requestRow}>
                <Image
                  source={require('../../assets/document.png')}
                  style={styles.document}
                  resizeMode="contain"
                />

                <View>
                  <Text style={styles.requestId}>{item.request_id}</Text>

                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>
                      {/* {item.status_name} */} รอดำเนินการ
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
                <Text style={styles.label1}>ปลายทาง</Text>
                <Text style={styles.value1}>{item.t_com}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <CalenderTGL width={24} height={30} style={styles.icon} />

              <View>
                <Text style={styles.label}>วันที่ขึ้นของ</Text>
                <Text style={styles.value}>
                  {item.pickup_date} {item.pickup_time}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <CalenderTGL width={24} height={30} style={styles.icon} />

              <View>
                <Text style={styles.label}>วันที่ถึงปลายทาง</Text>
                <Text style={styles.value}>
                  {item.d_date} {item.d_time}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <License style={styles.icon} />

              <View>
                <Text style={styles.label}>ทะเบียน</Text>
                <Text style={styles.value}>{item.license_no}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Icon
                name="format-list-bulleted"
                size={24}
                color="#8BC400"
                style={styles.icon}
              />

              <View>
                <Text style={styles.label}>ประเภทการบริการ</Text>
                <Text style={styles.value}>{item.remake}</Text>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {canStartWork && (
                <Pressable
                  style={({pressed}) => [
                    styles.startButton,
                    {
                      backgroundColor: pressed ? '#7AB100' : '#93D500',
                    },
                  ]}
                  onPress={handleStartWork}>
                  <Icons
                    name="play-skip-back-circle-sharp"
                    size={24}
                    color="#ffffff"
                    style={styles.iconbottom}
                  />
                  <Text style={styles.buttonText}>เริ่มงาน</Text>
                </Pressable>
              )}

              <Pressable
                style={({pressed}) => [
                  styles.closeButton,
                  {
                    backgroundColor: pressed ? '#8F0000' : '#C00000',
                  },
                ]}
                onPress={() => navigation.goBack()}>
                <IconO
                  name="x-circle-fill"
                  size={20}
                  color="#ffffff"
                  style={styles.iconbottom}
                />
                <Text style={styles.buttonText}>ปิด</Text>
              </Pressable>
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

  containerNobackground: {
    flex: 1,
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
    paddingTop: 2,
    paddingLeft: 5,
  },

  headerTitle: {
    fontSize: 24,
    fontFamily: 'Quicksand-Bold',
    color: '#fff',
    paddingTop: 8,
    paddingLeft: 10,
  },

  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingTop: 0,
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
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 120,
    width: 100,
    height: 40,
    justifyContent: 'space-between',
  },

  closeButton: {
    flexDirection: 'row',
    backgroundColor: '#D00000',
    paddingHorizontal: 28,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 120,
    width: 100,
    height: 40,
    justifyContent: 'space-between',
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
    //alignItems: 'center',
    alignItems: 'flex-start',
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
    marginLeft: 51,
    marginTop: 10,
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

    backgroundColor: '#fffde6',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },

  statusBadgeText: {
    fontSize: 12,
    color: '#D98600',
    fontFamily: 'Quicksand-Bold',
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: '#D98600',
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

  label1: {
    fontSize: 12,
    color: '#37373780',
    marginBottom: 4,
    fontFamily: 'Quicksand-SemiBold',
    paddingLeft: 4,
  },

  value1: {
    fontSize: 16,
    color: '#373737',
    fontFamily: 'Quicksand-Bold',
    paddingLeft: 4,
  },
});
