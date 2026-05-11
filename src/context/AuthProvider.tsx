import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ สีตาม companyCode
export const getCompanyColor = (companyCode: string | null): string => {
  switch (companyCode) {
    case 'TGL': return '#93D500';
    case 'TND': return '#230785';
    default:    return '#f8ac59';
  }
};

type AuthContextType = {
  user:         any;
  companyColor: string;
  login:        (token: string, userData: any) => void;
  logout:       () => Promise<void>;
  updateUser:   (updatedFields: Partial<any>) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user,         setUser]         = useState<any>(null);
  const [companyColor, setCompanyColor] = useState<string>('#f8ac59');

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token       = await AsyncStorage.getItem('authToken');
      const userData    = await AsyncStorage.getItem('userData');
      const companyCode = await AsyncStorage.getItem('companyCode');

      if (token && userData) {
        setUser(JSON.parse(userData));
      }
      // ✅ โหลดสีตาม companyCode ที่เก็บไว้
      setCompanyColor(getCompanyColor(companyCode));
    };
    checkLoginStatus();
  }, []);

  const login = async (token: string, userData: any) => {
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
    setUser(userData);

    // ✅ อัปเดตสีหลัง login
    const companyCode = await AsyncStorage.getItem('companyCode');
    setCompanyColor(getCompanyColor(companyCode));
  };

  const logout = async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('FCM_TOKEN');
    await AsyncStorage.removeItem('companyCode');
    await AsyncStorage.removeItem('userData');
    setUser(null);
    setCompanyColor('#f8ac59');
  };

  const updateUser = async (updatedFields: Partial<any>) => {
    const updatedUser = { ...user, ...updatedFields };
    await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
    setUser(updatedUser);
    console.log('✅ user updated in context:', updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, companyColor, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};