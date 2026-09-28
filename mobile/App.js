import React from 'react';

import {
  NavigationContainer,
} from '@react-navigation/native';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import {
  AuthProvider,
  useAuth,
} from './src/context/AuthContext';

import Login from './src/screens/Login';
import Register from './src/screens/Register';

import Dashboard from './src/screens/Dashboard';
import AdminDashboard from './src/screens/AdminDashboard';
import AdminDoctorDashboard from './src/screens/AdminDoctorDashboard';
import AdminDoctorEdit from './src/screens/AdminDoctorEdit';

import Profile from './src/screens/Profile';

import Patients from './src/screens/Patients';
import AddPatient from './src/screens/AddPatient';
import PatientDetail from './src/screens/PatientDetail';

import CreateVisit from './src/screens/CreateVisit';
import EditVisit from './src/screens/EditVisit';
import VisitDetail from './src/screens/VisitDetail';

import About from './src/screens/About';
import Help from './src/screens/Help';

import LoginReminder from './src/components/LoginReminder';

const Stack = createNativeStackNavigator();

/*
  Global navigation reference.
  LoginReminder uses this to open Login
  even though it is outside individual screens.
*/
export const navigationRef = React.createRef();

function AppNav() {
  const {
    token,
    role,
    loading,
  } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <>
      <NavigationContainer
        ref={navigationRef}
      >
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'fade',

            contentStyle: {
              backgroundColor: '#EEF5FF',
            },
          }}
        >

          {/* =========================
              PUBLIC SCREENS
          ========================= */}

          {!token ? (
            <>
              <Stack.Screen
                name="Login"
                component={Login}
              />

              <Stack.Screen
                name="Register"
                component={Register}
              />

              <Stack.Screen
                name="About"
                component={About}
              />

              <Stack.Screen
                name="Help"
                component={Help}
              />
            </>

          ) : role === 'admin' ? (

            /* =========================
               ADMIN SCREENS
            ========================= */

            <>
              {/* Admin Main Dashboard */}
              <Stack.Screen
                name="AdminDashboard"
                component={AdminDashboard}
              />

              {/* 
                Doctor Analytics + Profile
                Admin clicks a doctor from AdminDashboard
                and comes here.
              */}
              <Stack.Screen
                name="AdminDoctorDashboard"
                component={AdminDoctorDashboard}
              />

              {/* Doctor Profile Edit */}
              <Stack.Screen
                name="AdminDoctorEdit"
                component={AdminDoctorEdit}
              />

              {/* Admin Profile */}
              <Stack.Screen
                name="Profile"
                component={Profile}
              />

              <Stack.Screen
                name="About"
                component={About}
              />

              <Stack.Screen
                name="Help"
                component={Help}
              />
            </>

          ) : (

            /* =========================
               DOCTOR SCREENS
            ========================= */

            <>
              {/* Doctor Dashboard */}
              <Stack.Screen
                name="Dashboard"
                component={Dashboard}
              />

              {/* Doctor Profile */}
              <Stack.Screen
                name="Profile"
                component={Profile}
              />

              {/* Patients */}
              <Stack.Screen
                name="Patients"
                component={Patients}
              />

              {/* Add Patient */}
              <Stack.Screen
                name="AddPatient"
                component={AddPatient}
              />

              {/* Patient Details */}
              <Stack.Screen
                name="PatientDetail"
                component={PatientDetail}
              />

              {/* Create Visit */}
              <Stack.Screen
                name="CreateVisit"
                component={CreateVisit}
              />

              {/* Edit Visit */}
              <Stack.Screen
                name="EditVisit"
                component={EditVisit}
              />

              {/* Visit Details */}
              <Stack.Screen
                name="VisitDetail"
                component={VisitDetail}
              />

              {/* About */}
              <Stack.Screen
                name="About"
                component={About}
              />

              {/* Help */}
              <Stack.Screen
                name="Help"
                component={Help}
              />
            </>
          )}

        </Stack.Navigator>
      </NavigationContainer>

      {/* ==================================
          GLOBAL LOGIN REMINDER
          Only appears when user is logged out
      ================================== */}

      <LoginReminder
        navigationRef={navigationRef}
      />

    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}