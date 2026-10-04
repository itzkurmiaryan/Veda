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
import AdminRevenue from './src/screens/AdminRevenue';
import AdminDoctorDashboard from './src/screens/AdminDoctorDashboard';
import AdminDoctorEdit from './src/screens/AdminDoctorEdit';

import Profile from './src/screens/Profile';

import Patients from './src/screens/Patients';
import AddPatient from './src/screens/AddPatient';
import PatientDetail from './src/screens/PatientDetail';

import CreateVisit from './src/screens/CreateVisit';
import EditVisit from './src/screens/EditVisit';
import VisitDetail from './src/screens/VisitDetail';

import PaymentDetails from './src/screens/PaymentDetails';

import About from './src/screens/About';
import Help from './src/screens/Help';

import LoginReminder from './src/components/LoginReminder';

import AppUpdateChecker from './src/components/AppUpdateChecker';


const Stack =
  createNativeStackNavigator();


export const navigationRef =
  React.createRef();


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
              backgroundColor:
                '#EEF5FF',
            },
          }}
        >

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

            <>
              <Stack.Screen
                name="AdminDashboard"
                component={AdminDashboard}
              />

              <Stack.Screen
                name="AdminRevenue"
                component={AdminRevenue}
              />

              <Stack.Screen
                name="AdminDoctorDashboard"
                component={AdminDoctorDashboard}
              />

              <Stack.Screen
                name="AdminDoctorEdit"
                component={AdminDoctorEdit}
              />

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

            <>
              <Stack.Screen
                name="Dashboard"
                component={Dashboard}
              />

              <Stack.Screen
                name="PaymentDetails"
                component={PaymentDetails}
              />

              <Stack.Screen
                name="Profile"
                component={Profile}
              />

              <Stack.Screen
                name="Patients"
                component={Patients}
              />

              <Stack.Screen
                name="AddPatient"
                component={AddPatient}
              />

              <Stack.Screen
                name="PatientDetail"
                component={PatientDetail}
              />

              <Stack.Screen
                name="CreateVisit"
                component={CreateVisit}
              />

              <Stack.Screen
                name="EditVisit"
                component={EditVisit}
              />

              <Stack.Screen
                name="VisitDetail"
                component={VisitDetail}
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

          )}

        </Stack.Navigator>

      </NavigationContainer>


      <LoginReminder
        navigationRef={
          navigationRef
        }
      />


      {/*
      |--------------------------------------------------------------------------
      | Veda Native Update Checker
      |--------------------------------------------------------------------------
      |
      | This is outside NavigationContainer so the update popup
      | can appear globally on any Veda screen.
      |
      */}

      <AppUpdateChecker />

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