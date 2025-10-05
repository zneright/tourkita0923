// UserContext.tsx
import React, { createContext, useContext, useState } from 'react';

export type UserContextType = {
    user: any;
    isGuest: boolean;
    setUser: (user: any) => void;
    setIsGuest: (value: boolean) => void;
};

const UserContext = createContext<UserContextType>({
    user: null,
    isGuest: false,
    setUser: () => { },
    setIsGuest: () => { },
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [isGuest, setIsGuest] = useState(false);

    return (
        <UserContext.Provider value={{ user, isGuest, setUser, setIsGuest }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);