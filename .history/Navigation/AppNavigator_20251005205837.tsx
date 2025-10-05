import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import TermsScreen from '../screens/TermsScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import EmailVerificationScreen from '../screens/EmailVerificationSreen';
import MapsScreen from '../screens/MapScreen';
import SupportScreen from '../screens/SupportScreen';
import SearchScreen from '../screens/SearchScreen';
import ArCamScreen from '../screens/ArCamScreen';
import NotificationScreen from '../screens/NotificationScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import LandmarkProvider from '../provider/LandmarkProvider';
import SelectedLandmarkSheet from '../components/selectedLandmarkSheet';
import ViewProfileScreen from '../screens/ViewProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import SplashScreen from "../screens/SplashScreen";
import DeleteAccountScreen from '../screens/DeleteAccountScreen';
import CalendarViewScreen from '../screens/CalendarViewScreen';
import FAQScreen from '../screens/FAQScreen';


const Stack = createNativeStackNavigator<RootStackParamList>();
const AppNavigator = () => {
    return (
        <GestureHandlerRootView>
            <LandmarkProvider>
                <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Map">
                    <Stack.Screen name="Map" component={MapsScreen} />
                    <Stack.Screen name="Splash" component={SplashScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="SignUp" component={SignUpScreen} />
                    <Stack.Screen name="Terms" component={TermsScreen} />
                    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                    <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
                    <Stack.Screen name="Maps" component={MapsScreen} />
                    <Stack.Screen name="Support" component={SupportScreen} />
                    <Stack.Screen name="Search" component={SearchScreen} />
                    <Stack.Screen name="ArCam" component={ArCamScreen} />
                    <Stack.Screen name="Notification" component={NotificationScreen} />
                    <Stack.Screen name="Profile" component={ProfileScreen} />
                    <Stack.Screen name="ViewProfile" component={ViewProfileScreen} />
                    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
                    <Stack.Screen name="Feedback" component={FeedbackScreen} />
                    <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
                    <Stack.Screen name="CalendarView" component={CalendarViewScreen} />
                    <Stack.Screen name="FAQScreen" component={FAQScreen} />
                </Stack.Navigator>n
                <SelectedLandmarkSheet />
            </LandmarkProvider>
        </GestureHandlerRootView>
    );
};

export default AppNavigator;
