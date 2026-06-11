import React, {createContext, useState, useEffect, useRef} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getNotifications} from '../services/apiService'; 

export const getCompanyColor = (companyCode: string | null): string => {
  switch (companyCode) {
    case 'TGL': return '#93D500';
    case 'TND': return '#230785';
    default:    return '#93D500';
  }
};

type AuthContextType = {
  user:             any;
  companyColor:     string;
  login:            (token: string, userData: any) => void;
  logout:           () => Promise<void>;
  updateUser:       (updatedFields: Partial<any>) => Promise<void>;
  hasUnreadNoti:    boolean;
  setHasUnreadNoti: (val: boolean) => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [user,             setUser]             = useState<any>(null);
  const [companyColor,     setCompanyColor]     = useState<string>('#93D500');
  const [hasUnreadNoti,    setHasUnreadNoti]    = useState(false); 
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkUnreadNoti = async (currentUser: any) => {
    if (!currentUser) return;
      try {
        const response = await getNotifications({
          user_status: currentUser.status,
          requester:   currentUser.id,
          page:        'Driver',
        });
        if (!response.error) {
          const filtered = response.Notification.filter(
            (item: any) => item.status_name === 'มอบหมายงานสำเร็จ',
          );
          setHasUnreadNoti(filtered.length > 0);
        }
      } catch (e) {
        console.log('noti poll error:', e);
      }
    };

    // ✅ เริ่ม/หยุด polling ตาม user
    useEffect(() => {
      if (user) {
        checkUnreadNoti(user); // เช็คทันทีตอน login หรือ app เปิด

        pollingRef.current = setInterval(() => {
          checkUnreadNoti(user);
        }, 30000); // ✅ ทุก 30 วินาที
      } else {
        // user ออกจากระบบ — หยุด polling
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        setHasUnreadNoti(false);
      }

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      };
    }, [user]);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token       = await AsyncStorage.getItem('authToken');
      const userData    = await AsyncStorage.getItem('userData');
      const companyCode = await AsyncStorage.getItem('companyCode');
      if (token && userData) setUser(JSON.parse(userData));
      setCompanyColor(getCompanyColor(companyCode));
    };
    checkLoginStatus();
  }, []);

  const login = async (token: string, userData: any) => {
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
    setUser(userData);
    const companyCode = await AsyncStorage.getItem('companyCode');
    setCompanyColor(getCompanyColor(companyCode));
  };

  const logout = async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('FCM_TOKEN');
    await AsyncStorage.removeItem('companyCode');
    await AsyncStorage.removeItem('userData');
    setUser(null);
    setCompanyColor('#93D500');
    setHasUnreadNoti(false); // ✅ reset ตอน logout
  };

  const updateUser = async (updatedFields: Partial<any>) => {
    const updatedUser = {...user, ...updatedFields};
    await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{
      user,
      companyColor,
      login,
      logout,
      updateUser,
      hasUnreadNoti,
      setHasUnreadNoti,
    }}>
      {children}
    </AuthContext.Provider>
  );
};