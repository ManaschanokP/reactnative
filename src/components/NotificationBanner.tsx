import React, {useEffect, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

const {width} = Dimensions.get('window');

export type BannerType = 'success' | 'error' | 'warning' | 'info';

interface NotificationBannerProps {
  visible: boolean;
  message: string;
  type?: BannerType;
  onClose: () => void;
  duration?: number; // เวลาที่จะให้ซ่อนอัตโนมัติ (มิลลิวินาที)
}

const BANNER_CONFIG = {
  success: {backgroundColor: '#4CAF50', icon: 'check-circle'},
  error: {backgroundColor: '#F44336', icon: 'error'},
  warning: {backgroundColor: '#FF9800', icon: 'warning'},
  info: {backgroundColor: '#2196F3', icon: 'info'},
};

const NotificationBanner: React.FC<NotificationBannerProps> = ({
  visible,
  message,
  type = 'info',
  onClose,
  duration = 3000,
}) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-100)).current; // เริ่มต้นที่ซ่อนอยู่ด้านบนนอกจอ

  const [shouldRender, setShouldRender] = React.useState(false);

  useEffect(() => {
    if (visible) {
      setShouldRender(true); // เปิดให้เรนเดอร์ก่อนเริ่มแอนิเมชัน
      Animated.timing(slideAnim, {
        toValue: insets.top + 10,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // ตั้งเวลาปิดอัตโนมัติ
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      handleDismiss();
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShouldRender(false); // แอนิเมชันหุบเสร็จแล้ว -> ถอดออกจากหน้าจอ
      if (visible) onClose();
    });
  };

 if (!shouldRender) return null;

  const currentConfig = BANNER_CONFIG[type];

  return (
    <Animated.View
      style={[
        styles.bannerContainer,
        {
          transform: [{translateY: slideAnim}],
          backgroundColor: currentConfig.backgroundColor,
        },
      ]}>
      <View style={styles.content}>
        <Icon name={currentConfig.icon} size={24} color="#030101" />
        <Text style={styles.messageText} numberOfLines={2}>
          {message}
        </Text>
        <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
          <Icon name="close" size={18} color="#0c0404" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    width: width - 32,
    borderRadius: 12,
    padding: 16,
    zIndex: 9999, // บังคับให้อยู่บนสุดเสมอ
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageText: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Quicksand-Bold', // แมตช์กับฟอนต์เดิมในโปรเจกต์คุณ
    marginLeft: 12,
    marginRight: 8,
  },
  closeButton: {
    padding: 4,
  },
});

export default NotificationBanner;
