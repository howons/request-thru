import axios, { type AxiosRequestConfig } from 'axios';

export async function fetchData(url: string, options?: AxiosRequestConfig) {
  try {
    const response = await axios(url, { responseType: 'text', ...options });

    return response.data;
  } catch (error) {
    console.error('API 호출 중 에러 발생:', (error as { message: string })?.message);
    return null;
  }
}
