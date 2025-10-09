import { LOCAL_KEYS } from '../../popup/constants/rules';
import type { AutoUpdateProps } from '../../popup/messages/autoUpdate';
import { fetchData, matchResult } from '../../popup/utils/fetch';
import { AUTO_UPDATE_ACTIONS } from '../constants/messageActions';
import { STORAGE_KEYS, createStorageKey } from '../constants/storageKeys';

/**
 * AutoUpdater - 자동 업데이트 모듈
 * 
 * 역할:
 * - 규칙의 헤더 값을 외부 API로부터 자동으로 업데이트
 * - 탭 활성화 시 설정된 재검증 간격에 따라 자동 업데이트 실행
 * - 정규식 매칭을 통한 API 응답 데이터 파싱 및 추출
 * - 업데이트 상태를 브라우저 뱃지로 시각적 피드백 제공
 * - Chrome Storage를 통한 업데이트 타임스탬프 관리
 * 
 * 메시지 액션:
 * - setAutoUpdate: 특정 규칙에 대한 자동 업데이트 설정
 * - clearAutoUpdate: 특정 규칙의 자동 업데이트 해제
 * - clearAllAutoUpdate: 모든 규칙의 자동 업데이트 해제
 * 
 * 의존성:
 * - RuleManager: 규칙 헤더 업데이트 실행
 */
class AutoUpdater {
  private ruleManager: any; // Will receive as dependency

  constructor(ruleManager: any) {
    this.ruleManager = ruleManager;
    this.setupTabActivationListener();
    this.setupMessageListener();
  }

  private setupTabActivationListener() {
    chrome.tabs.onActivated.addListener(() => {
      chrome.storage.local.get().then(items => {
        this.updateRuleOnTabActivate(items);
      });
    });
  }

  private setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.action) {
        case AUTO_UPDATE_ACTIONS.SET_AUTO_UPDATE:
          const { ruleItemId, value } = message.payload as AutoUpdateProps;
          const autoLocalKey = createStorageKey.autoUpdate(ruleItemId);

          this.ruleManager.updateHeader({ ruleItemId, value }).then(() => {
            chrome.storage.local.set({ [autoLocalKey]: Date.now() });
            sendResponse();
          });
          break;

        case AUTO_UPDATE_ACTIONS.CLEAR_AUTO_UPDATE:
          const clearRuleItemId = message.payload as string;
          const clearLocalKey = createStorageKey.autoUpdate(clearRuleItemId);
          chrome.storage.local.remove(clearLocalKey);
          sendResponse();
          break;

        case AUTO_UPDATE_ACTIONS.CLEAR_ALL_AUTO_UPDATE:
          chrome.storage.local.get().then(items => {
            Object.entries(items).forEach(([key]) => {
              if (!(key.startsWith(STORAGE_KEYS.PREFIX) && key.endsWith(STORAGE_KEYS.SUFFIXES.AUTO))) return;
              chrome.storage.local.remove(key);
            });
            sendResponse();
          });
          break;

        default:
          return false;
      }

      return true;
    });
  }

  // update rules with auto update enabled
  private updateRuleOnTabActivate(items: Record<string, any>) {
    Object.entries(items).forEach(async ([key, updatedAt]) => {
      if (!(key.startsWith(STORAGE_KEYS.PREFIX) && key.endsWith(STORAGE_KEYS.SUFFIXES.AUTO))) return;
      const ruleItemId = key.split(STORAGE_KEYS.SUFFIXES.AUTO)[0];

      const revalidationKey = `${ruleItemId}_${LOCAL_KEYS[5]}`;
      const revalidationInterval =
        ((await chrome.storage.local.get(revalidationKey))[revalidationKey] as number) ??
        24 * 3600000;

      const timeFromUpdate = Date.now() - Number(updatedAt);
      if (revalidationInterval > timeFromUpdate) return;

      const itemLocalKeys = LOCAL_KEYS.slice(1, 5).map(key => `${ruleItemId}_${key}`);
      const {
        [itemLocalKeys[0]]: apiUrl,
        [itemLocalKeys[1]]: regMatcher,
        [itemLocalKeys[2]]: regFlag,
        [itemLocalKeys[3]]: regPlacer
      } = await chrome.storage.local.get([
        itemLocalKeys[0],
        itemLocalKeys[1],
        itemLocalKeys[2],
        itemLocalKeys[3]
      ]);

      const result = await fetchData(apiUrl);
      const regResult = matchResult(result, regMatcher, regFlag, regPlacer);

      chrome.action.setBadgeText({ text: '🔄️' });

      setTimeout(() => {
        this.ruleManager.updateHeader({ ruleItemId, value: regResult });
        chrome.action.setBadgeText({ text: '✅' });
        chrome.storage.local.set({ [key]: Date.now() });
      }, 1000);

      setTimeout(() => {
        chrome.action.setBadgeText({ text: '' });
      }, 2000);
    });
  }
}

export default AutoUpdater;