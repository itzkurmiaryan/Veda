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

    const response =
      await api.post(
        '/auth/login',
        {
          email,
          password,
        }
      );


    const data =
      response.data;


    await AsyncStorage.setItem(
      'rxvault_token',
      data.token
    );


    await AsyncStorage.setItem(
      'rxvault_role',
      data.role
    );


    if (data.user) {

      await AsyncStorage.setItem(
        'rxvault_user',
        JSON.stringify(data.user)
      );

      setUser(data.user);

    }


    if (data.doctor) {

      await AsyncStorage.setItem(
        'rxvault_doctor',
        JSON.stringify(data.doctor)
      );

      setDoctor(data.doctor);

    }


    setToken(data.token);
    setRole(data.role);

    return data;

  };


  // =================================================
  // REGISTER
  // =================================================

  const register = async (
    data
  ) => {

    const response =
      await api.post(
        '/auth/register',
        data
      );


    const result =
      response.data;


    // If admin approval system is enabled,
    // registration may return 202 instead of token.

    if (
      result.token &&
      result.doctor
    ) {

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

    }


    return result;

  };


  // =================================================
  // UPDATE DOCTOR
  // =================================================

  const updateDoctor = async (
    updatedDoctor
  ) => {

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

  };


  // =================================================
  // LOGOUT
  // =================================================

  const logout = async () => {

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

  };


  return (
    <C.Provider
      value={{
        token,
        doctor,
        user,
        role,
        loading,
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