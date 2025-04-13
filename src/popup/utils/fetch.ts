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

export function matchResult(result: string, reg: string, regFlag: string, regPlacer: string) {
  try {
    const regExp = new RegExp(reg, regFlag);
    const match = regExp.exec(result);

    if (!match) return result;
    if (regPlacer.length < 1) return match[0];

    let regResult = regPlacer;
    for (let i = 0; i < match.length; i++) {
      regResult = regPlacer.replace(`$${i}`, match[i]);
    }

    return regResult;
  } catch (error) {
    console.error('정규표현식 매칭 중 에러 발생:', (error as { message: string })?.message);
    return result;
  }
}
