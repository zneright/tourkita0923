import React, { useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    StyleSheet,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navigation/types';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import Icon from 'react-native-vector-icons/Feather';
import { useUser } from '../context/UserContext';
import { loginAsGuest } from '../utils/guestLogin';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const { setUser, setIsGuest } = useUser();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loadingLogin, setLoadingLogin] = useState(false);
    const [loadingGuest, setLoadingGuest] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isLoading = loadingLogin || loadingGuest;

    const handleLogin = async () => {
        if (isLoading) return;

        if (!/\S+@\S+\.\S+/.test(email)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }

        if (!email || !password) {
            Alert.alert('Missing Fields', 'Please enter both email and password.');
            return;
        }

        setLoadingLogin(true);

        try {
            const archivedQuery = query(
                collection(db, 'archived_users'),
                where('email', '==', email.trim().toLowerCase())
            );
            const archivedSnap = await getDocs(archivedQuery);

            if (!archivedSnap.empty) {
                const data = archivedSnap.docs[0]?.data() || {};
                const reason = data.archiveReason ?? 'No reason provided';


                Alert.alert(
                    'Access Denied',
                    `Your account has been archived.\n\nReason: ${reason}`
                );

                setLoadingLogin(false);
                return;
            }

            const userCredential = await signInWithEmailAndPassword(
                auth,
                email.trim().toLowerCase(),
                password.trim()
            );
            const user = userCredential.user;

            if (!user.emailVerified) {
                await auth.signOut();
                Alert.alert('Email Not Verified', 'Please verify your email before logging in.');
                setLoadingLogin(false);
                return;
            }

            setUser(user);
            setIsGuest(false);
            navigation.replace('Maps');
        } catch (error: any) {
            console.error('Login error:', error);
            const errorMessages: Record<string, string> = {
                'auth/user-not-found': 'No user found with that email.',
                'auth/wrong-password': 'Incorrect password.',
                'auth/invalid-email': 'Invalid email format.',
            };
            const message = errorMessages[error.code] || 'Login failed. Please try again.';
            Alert.alert('Login Error', message);
        } finally {
            setLoadingLogin(false);
        }
    };

    const handleGuestLogin = async () => {
        if (isLoading) return;
        setLoadingGuest(true);
        try {
            const user = await loginAsGuest();
            setUser(user);
            setIsGuest(true);
            navigation.replace('Maps');
        } catch (error) {
            console.error('Guest login error:', error);
            Alert.alert('Guest Login Failed', 'Could not log in as guest.');
        } finally {
            setLoadingGuest(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                style={styles.container}
            >

                <Image
                    source={require('../assets/TourkitaLogo.jpg')}
                    resizeMode="contain"
                    style={styles.logo}
                />

                <Text style={styles.agreementText}>
                    By signing in you are agreeing to our{' '}
                    <Text
                        style={styles.linkText}
                        onPress={() => !isLoading && navigation.navigate('Terms')}
                    >
                        Terms and Privacy Policy
                    </Text>
                </Text>

                <View style={styles.tabContainer}>
                    <Text style={styles.activeTab}>Login</Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('SignUp')}
                        disabled={isLoading}
                    >
                        <Text style={styles.inactiveTab}>Sign Up</Text>
                    </TouchableOpacity>
                </View>

                <TextInput
                    style={styles.input}
                    placeholder="Enter email"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    editable={!isLoading}
                />

                <View style={styles.passwordContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter password"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                        editable={!isLoading}
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                        disabled={isLoading}
                    >
                        <Icon name={showPassword ? 'eye' : 'eye-off'} size={20} color="#603F26" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    onPress={() => navigation.navigate('ForgotPassword')}
                    style={styles.forgotPasswordContainer}
                    disabled={isLoading}
                >
                    <Text style={styles.forgotPassword}>Forget password?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleLogin}
                    disabled={isLoading}
                >
                    <Text style={styles.loginText}>
                        {loadingLogin ? 'Logging in...' : 'Login'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleGuestLogin}
                    disabled={isLoading}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }}
                >
                    {loadingGuest && (
                        <ActivityIndicator size="small" color="#603F26" style={{ marginRight: 8 }} />
                    )}
                    <Text style={styles.guestText}>Log in as Guest</Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default LoginScreen;

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 20,
        paddingBottom: 190,
    },
    logo: { width: 200, height: 200 },
    agreementText: {
        color: '#6B5E5E',
        fontSize: 13,
        textAlign: 'center',
        width: width * 0.8,
        marginBottom: 20
    },
    linkText: { fontWeight: 'bold', color: '#603F26', },
    tabContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
    activeTab: { color: '#603F26', fontSize: 20 },
    inactiveTab: { color: '#A5A5A5', fontSize: 20, marginLeft: 26 },
    input: {
        height: 45,
        backgroundColor: '#FFFFFF',
        borderColor: '#603F26',
        borderRadius: 15,
        borderWidth: 1,
        paddingHorizontal: 15,
        width: width * 0.8,
        marginBottom: 10,
        paddingRight: 40,
    },
    passwordContainer: {
        flexDirection: 'row',
        width: width * 0.8,
        marginBottom: 10,
        position: 'relative',
    },
    eyeIcon: { position: 'absolute', right: 10, top: 12 },
    forgotPasswordContainer: { alignSelf: 'flex-end', marginRight: 48 },
    forgotPassword: { color: '#603F26', fontSize: 10 },
    loginButton: {
        alignItems: 'center',
        backgroundColor: '#603F26',
        borderRadius: 5,
        paddingVertical: 11,
        width: width * 0.8,
        marginVertical: 10,
        elevation: 4,
    },
    loginText: { color: '#FFFFFF', fontSize: 20 },
    guestText: { color: '#603F26', fontSize: 14, marginTop: 6, marginBottom: 10 },
});
