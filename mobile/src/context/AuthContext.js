import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import AsyncStorage from
  '@react-native-async-storage/async-storage';

import { api } from '../api/api';


const C = createContext(null);


export const useAuth = () =>
  useContext(C);


export function AuthProvider({
  children,
}) {

  const [token, setToken] =
    useState(null);

  const [doctor, setDoctor] =
    useState(null);

  const [user, setUser] =
    useState(null);

  const [role, setRole] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  /*
   * Global authentication/action status
   *
   * This will be used by the global
   * Veda loading UI.
   */
  const [actionLoading, setActionLoading] =
    useState(false);

  const [actionMessage, setActionMessage] =
    useState('');

  const [actionSubMessage, setActionSubMessage] =
    useState('');


  // =================================================
  // GLOBAL ACTION LOADER
  // =================================================

  const startAction = (
    message = 'Please wait...',
    subMessage = 'Veda is processing your request.'
  ) => {

    setActionMessage(message);
    setActionSubMessage(subMessage);
    setActionLoading(true);

  };


  const stopAction = () => {

    setActionLoading(false);
    setActionMessage('');
    setActionSubMessage('');

  };


  // =================================================
  // LOAD SAVED AUTH
  // =================================================

  useEffect(() => {

    const loadAuth = async () => {

      try {

        const savedToken =
          await AsyncStorage.getItem(
            'rxvault_token'
          );

        const savedDoctor =
          await AsyncStorage.getItem(
            'rxvault_doctor'
          );

        const savedUser =
          await AsyncStorage.getItem(
            'rxvault_user'
          );

        const savedRole =
          await AsyncStorage.getItem(
            'rxvault_role'
          );


        if (savedToken) {

          setToken(savedToken);

        }


        if (savedDoctor) {

          setDoctor(
            JSON.parse(savedDoctor)
          );

        }


        if (savedUser) {

          setUser(
            JSON.parse(savedUser)
          );

        }


        if (savedRole) {

          setRole(savedRole);

        }

      } catch (error) {

        console.error(
          'AUTH LOAD ERROR:',
          error
        );

      } finally {

        setLoading(false);

      }

    };


    loadAuth();

  }, []);


  // =================================================
  // LOGIN
  // =================================================

  const login = async (
    email,
    password
  ) => {

    startAction(
      'Connecting to Veda...',
      'Securely connecting to healthcare services.'
    );


    try {

      /*
       * Render may be sleeping.
       *
       * The request can therefore take a little
       * longer while the server wakes up.
       */

      setActionMessage(
        'Waking up Veda server...'
      );

      setActionSubMessage(
        'Please wait while we establish a secure connection.'
      );


      const response =
        await api.post(
          '/auth/login',
          {
            email,
            password,
          }
        );


      setActionMessage(
        'Verifying your account...'
      );

      setActionSubMessage(
        'Checking your secure Veda credentials.'
      );


      const data =
        response.data;


      if (!data?.token) {

        throw new Error(
          'Login was unsuccessful. Please try again.'
        );

      }


      await AsyncStorage.setItem(
        'rxvault_token',
        data.token
      );


      if (data.role) {

        await AsyncStorage.setItem(
          'rxvault_role',
          data.role
        );

      }


      if (data.user) {

        await AsyncStorage.setItem(
          'rxvault_user',
          JSON.stringify(
            data.user
          )
        );

        setUser(data.user);

      }


      if (data.doctor) {

        await AsyncStorage.setItem(
          'rxvault_doctor',
          JSON.stringify(
            data.doctor
          )
        );

        setDoctor(data.doctor);

      }


      setActionMessage(
        'Preparing your workspace...'
      );

      setActionSubMessage(
        'Almost there. Your Veda dashboard is getting ready.'
      );


      setToken(data.token);
      setRole(data.role);


      /*
       * Small delay gives the user a smooth
       * transition instead of an instant jump.
       */

      await new Promise(
        (resolve) =>
          setTimeout(resolve, 500)
      );


      stopAction();


      return data;

    } catch (error) {

      stopAction();

      throw error;

    }

  };


  // =================================================
  // REGISTER
  // =================================================

  const register = async (
    data
  ) => {

    startAction(
      'Creating your account...',
      'Connecting securely to Veda.'
    );


    try {

      setActionMessage(
        'Creating your profile...'
      );

      setActionSubMessage(
        'Please wait while your information is being processed.'
      );


      const response =
        await api.post(
          '/auth/register',
          data
        );


      const result =
        response.data;


      /*
       * If admin approval system is enabled,
       * registration may return 202 instead of token.
       */

      if (
        result.token &&
        result.doctor
      ) {

        setActionMessage(
          'Setting up your workspace...'
        );

        setActionSubMessage(
          'Your Veda profile is almost ready.'
        );


        await AsyncStorage.setItem(
          'rxvault_token',
          result.token
        );


        await AsyncStorage.setItem(
          'rxvault_role',
          'doctor'
        );


        await AsyncStorage.setItem(
          'rxvault_doctor',
          JSON.stringify(
            result.doctor
          )
        );


        await AsyncStorage.setItem(
          'rxvault_user',
          JSON.stringify(
            result.doctor
          )
        );


        setToken(result.token);
        setRole('doctor');
        setDoctor(result.doctor);
        setUser(result.doctor);


        await new Promise(
          (resolve) =>
            setTimeout(resolve, 500)
        );

      }


      stopAction();


      return result;

    } catch (error) {

      stopAction();

      throw error;

    }

  };


  // =================================================
  // UPDATE DOCTOR
  // =================================================

  const updateDoctor = async (
    updatedDoctor
  ) => {

    startAction(
      'Updating profile...',
      'Saving your professional information.'
    );


    try {

      setDoctor(updatedDoctor);
      setUser(updatedDoctor);


      await AsyncStorage.setItem(
        'rxvault_doctor',
        JSON.stringify(
          updatedDoctor
        )
      );


      await AsyncStorage.setItem(
        'rxvault_user',
        JSON.stringify(
          updatedDoctor
        )
      );


      await new Promise(
        (resolve) =>
          setTimeout(resolve, 350)
      );


      stopAction();

    } catch (error) {

      stopAction();

      throw error;

    }

  };


  // =================================================
  // LOGOUT
  // =================================================

  const logout = async () => {

    startAction(
      'Signing you out...',
      'Clearing your secure Veda session.'
    );


    try {

      await AsyncStorage.multiRemove([
        'rxvault_token',
        'rxvault_doctor',
        'rxvault_user',
        'rxvault_role',
      ]);


      setToken(null);
      setDoctor(null);
      setUser(null);
      setRole(null);


      await new Promise(
        (resolve) =>
          setTimeout(resolve, 350)
      );


      stopAction();

    } catch (error) {

      stopAction();

      throw error;

    }

  };


  // =================================================
  // PROVIDER
  // =================================================

  return (
    <C.Provider
      value={{
        token,
        doctor,
        user,
        role,

        loading,

        /*
         * Global action state
         */
        actionLoading,
        actionMessage,
        actionSubMessage,

        startAction,
        stopAction,

        login,
        register,
        updateDoctor,
        logout,
      }}
    >
      {children}
    </C.Provider>
  );

}