import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = "https://veda-v3wh.onrender.com/api";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('rxvault_token');

    const method = (config.method || 'get').toUpperCase();
    const url = `${config.baseURL || ''}${config.url || ''}`;

    console.log('====================================');
    console.log('➡️ API REQUEST');
    console.log('METHOD:', method);
    console.log('URL:', url);
    console.log('TOKEN:', token ? 'Token exists' : 'NO TOKEN');
    console.log('====================================');

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.log('❌ REQUEST INTERCEPTOR ERROR:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('====================================');
    console.log('✅ API RESPONSE');
    console.log('STATUS:', response.status);
    console.log(
      'METHOD:',
      (response.config?.method || 'get').toUpperCase()
    );
    console.log('URL:', response.config?.url);
    console.log('DATA:', response.data);
    console.log('====================================');

    return response;
  },
  (error) => {
    console.log('====================================');
    console.log('❌ API ERROR');

    if (error.response) {
      console.log('STATUS:', error.response.status);
      console.log('URL:', error.config?.url);
      console.log('METHOD:', error.config?.method?.toUpperCase());
      console.log('DATA:', error.response.data);
    } else {
      console.log('MESSAGE:', error.message);
    }

    console.log('====================================');

    return Promise.reject(error);
  }
);

export default api;