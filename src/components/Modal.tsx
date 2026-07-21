import React from 'react';
import {Modal, StyleSheet, Text, View, Pressable} from 'react-native';

interface ButtonProps {
  text: string;
  color?: string;
  pressedColor?: string;
  textColor?: string; // สีตัวอักษร
  borderColor?: string; // สีขอบ
  borderWidth?: number; // ความหนาขอบ
  onPress: () => void;
}

interface CustomModalProps {
  visible: boolean;
  icon?: string;
  title: string;
  message: string;
  buttons: ButtonProps[];
  iconBackgroundColor?: string;
  textColor?: string;
  borderColor?: string;
}

const darkenColor = (hex: string, percent: number) => {
  let color = hex.replace('#', '');

  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  const darkR = Math.max(0, Math.floor(r * (1 - percent)));
  const darkG = Math.max(0, Math.floor(g * (1 - percent)));
  const darkB = Math.max(0, Math.floor(b * (1 - percent)));

  return (
    '#' +
    [darkR, darkG, darkB].map(v => v.toString(16).padStart(2, '0')).join('')
  );
};

const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  icon = '!',
  title,
  message,
  buttons,
  iconBackgroundColor = '#F5A800',
}) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View
            style={[
              styles.iconBadge,
              {
                backgroundColor: iconBackgroundColor,
              },
            ]}>
            <Text style={styles.iconText}>{icon}</Text>
          </View>

          <Text style={styles.title}>{title}</Text>

          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <Pressable
                key={index}
                onPress={button.onPress}
                style={({pressed}) => [
                  styles.button,
                  buttons.length === 1
                    ? styles.singleButton
                    : styles.multiButton,
                  {
                    backgroundColor: pressed
                      ? darkenColor(button.color ?? '#1976D2', 0.15)
                      : button.color ?? '#1976D2',

                    borderColor: button.borderColor ?? 'transparent',
                    borderWidth: button.borderWidth ?? 1,
                  },
                ]}>
                <Text
                  style={[
                    styles.buttonText,
                    {
                      color: button.textColor ?? '#FFFFFF',
                    },
                  ]}>
                  {button.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  container: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
  },

  iconBadge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    backgroundColor: '#F5A800',
  },

  iconText: {
    fontSize: 38,
    color: '#fff',
    fontFamily: 'Quicksand-Bold',
  },

  title: {
    fontSize: 24,
    color: '#222',
    fontFamily: 'Quicksand-Bold',
    marginBottom: 10,
    textAlign: 'center',
  },

  message: {
    fontSize: 14,
    color: '#373737',
    textAlign: 'center',
    fontFamily: 'Quicksand-Medium',
    marginBottom: 24,
    lineHeight: 22,
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center', // จัดปุ่มไว้ตรงกลาง
    alignItems: 'center',
    width: '100%',
    gap: 10,
  },

  button: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  singleButton: {
    width: '60%',
  },

  multiButton: {
    flex: 1,
  },

  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Quicksand-Bold',
  },
});

export default CustomModal;
