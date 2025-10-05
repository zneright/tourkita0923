import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

type UserContextType = {
    user: FirebaseUser | null;
    setUser: (user: FirebaseUser | null) => void;
    isGuest: boolean;
    setIsGuest: (val: boolean) => void;
    loading: boolean;
};

const UserContext = createContext<UserContextType>({
    user: null,
    setUser: () => { },
    isGuest: false,
    setIsGuest: () => { },
    loading: true,
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [isGuest, setIsGuest] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                setIsGuest(false);
            } else {
                setUser(null);
                setIsGuest(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, isGuest, setIsGuest, loading }}>
            {children}
        </UserContext.Provider>
    );
};

// ✅ Custom hook to use the context
export const useUser = () => useContext(UserContext);
