'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  nickname?: string;
  username: string;
  email: string;
  avatar?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  logout: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('user_token');
    if (!token) {
      localStorage.removeItem('user_info');
      return null;
    }
    const saved = localStorage.getItem('user_info');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const setUserAndSave = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('user_info', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('user_info');
      localStorage.removeItem('user_token');
    }
  };

  const logout = () => {
    setUserAndSave(null);
  };

  return (
    <UserContext.Provider value={{ user, setUser: setUserAndSave, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
