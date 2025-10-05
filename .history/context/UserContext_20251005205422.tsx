import { useContext } from "react";
import { UserContext } from "../context/UserContext";

const AppNavigator = () => {
  const { user } = useContext(UserContext); // Get current user

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LandmarkProvider>
        {user ? <MainStack /> : <AuthStack />}
        <SelectedLandmarkSheet />
      </LandmarkProvider>
    </GestureHandlerRootView>
  );
};
