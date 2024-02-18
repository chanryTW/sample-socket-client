import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export type ErrorResponse = {
  message: string;
};

type LoginPayload = {
  username: string;
  password: string;
};
type LoginRespond = {
  message: string;
  token: string;
};
export function login(credentials: LoginPayload) {
  return new Promise<LoginRespond>((resolve, reject) => {
    axios
      .post<LoginRespond>(API_URL + '/api/login', credentials, {
        withCredentials: true,
      })
      .then((response) => {
        localStorage.setItem('token', response.data.token);
        resolve(response.data);
      })
      .catch((err) => {
        const statusCode = err.response.status;
        if (statusCode === 400 || statusCode === 401 || statusCode === 422) {
          reject(err.response.data as ErrorResponse);
        }
      });
  });
}

// 在發送每次請求前手動將 token 添加到 request headers 中
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

type RegisterPayload = {
  username: string;
  password: string;
};
type RegisterRespond = {
  message: string;
  token: string;
};
export function register(credentials: RegisterPayload) {
  return new Promise<RegisterRespond>((resolve, reject) => {
    axios
      .post<RegisterRespond>(API_URL + '/api/register', credentials, {
        withCredentials: true,
      })
      .then((response) => {
        resolve(response.data);
      })
      .catch((err) => {
        const statusCode = err.response.status;
        if (statusCode === 400 || statusCode === 401 || statusCode === 422) {
          reject(err.response.data);
        }
      });
  });
}

type LogoutRespond = {
  message: string;
};
export function logout() {
  return new Promise<LogoutRespond>((resolve, reject) => {
    axios
      .post<LogoutRespond>(API_URL + '/logout', {}, { withCredentials: true })
      .then((response) => {
        resolve(response.data);
      })
      .catch((err) => {
        const statusCode = err.response.status;
        if (statusCode === 400 || statusCode === 401 || statusCode === 422) {
          reject(err.response.data);
        }
      });
  });
}
