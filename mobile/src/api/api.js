import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = "https://veda-v3wh.onrender.com/api";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 120000, // 120 seconds to allow Render free instance to spin up from sleep
  headers: {
    'Content-Type': 'application/json',
  },
});

export const pingServer = async () => {
  try {
    await api.get('/app-version', { timeout: 35000 });
    return true;
  } catch {
    return false;
  }
};

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
      if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
        error.message = 'The server is taking longer than expected to wake up. Please try again in a few moments.';
      } else if (error.message?.toLowerCase().includes('network')) {
        error.message = 'Unable to connect to server. Please check your internet connection or wait a moment for the cloud server to wake up.';
      }
    }

    console.log('====================================');

    return Promise.reject(error);
  }
);

export default api;