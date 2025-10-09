import type { BlockState } from '../types/messages';
import { BLOCK_ACTIONS } from '../constants/messageActions';
import { STORAGE_KEYS } from '../constants/storageKeys';

/**
 * RequestBlocker - 요청 차단 모듈
 * 
 * 역할:
 * - 웹 요청을 모니터링하고 과도한 요청을 차단
 * - 탭별 요청 수를 추적하여 1000회 초과 시 자동 차단
 * - 차단된 탭 자동 새로고침 및 대기열 요청 취소
 * - 60초마다 차단 상태 초기화 및 카운터 리셋
 * - 사용자 정의 URL 패턴에 따른 선택적 모니터링
 * 
 * 메시지 액션:
 * - setBlock: 차단 기능 활성화/비활성화
 * - setBlockUrl: 모니터링할 URL 패턴 설정
 * 
 * Public API:
 * - getBlockTabId(): 현재 차단된 탭 ID 반환
 * - resetBlockTabId(): 차단 상태 초기화
 */
class RequestBlocker {
  private reqCounts: Record<number, number> = {};
  private block: BlockState = {
    tabId: -1,
    enabled: undefined
  };
  private blockResetTimer: number | null = null;
  private blockEnabledTimer: number | null = null;

  constructor() {
    this.initializeBlocker();
    this.setupMessageListener();
  }

  private initializeBlocker() {
    chrome.storage.local.get(STORAGE_KEYS.BLOCK_URL).then(res => {
      const blockUrls = res[STORAGE_KEYS.BLOCK_URL]?.length ? res[STORAGE_KEYS.BLOCK_URL] : ['http://localhost/*'];
      chrome.webRequest.onBeforeRequest.addListener(this.blockReqHandler.bind(this), { urls: blockUrls }, []);
    });
  }

  private setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, _sendResponse) => {
      const sendResponse = _sendResponse as (...args: any[]) => void;

      switch (message.action) {
        case BLOCK_ACTIONS.SET_BLOCK:
          const enableBlock = message.payload as boolean;
          this.block.enabled = enableBlock;
          return false;

        case BLOCK_ACTIONS.SET_BLOCK_URL:
          const urlFilter = message.payload as string[];

          if (Array.isArray(urlFilter) && urlFilter.length > 0 && urlFilter.every(this.isValidMatchPattern)) {
            chrome.webRequest.onBeforeRequest.removeListener(this.blockReqHandler.bind(this));
            chrome.webRequest.onBeforeRequest.addListener(this.blockReqHandler.bind(this), { urls: urlFilter }, []);
          } else {
            sendResponse(
              `Invalid urlFilter format: "${urlFilter.filter(url => !this.isValidMatchPattern(url)).join('", "')}"`
            );
            return true;
          }
          break;

        default:
          return false;
      }

      return false;
    });
  }

  private isValidMatchPattern(pattern: string): boolean {
    // Chrome match patterns: https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns/
    // Format: <scheme>://<host><path>
    // <scheme>: http, https, file, ftp, or *
    // <host>: *, *.<domain>, <domain>
    // <path>: /* or specific path
    const matchPatternRegex = /^(?:(\*|http|https|file|ftp):\/\/)(\*|(\*\.)?([^/*]+))?(\/.*)$/;
    return typeof pattern === 'string' && matchPatternRegex.test(pattern.trim());
  }

  private blockReqHandler(details: any): chrome.webRequest.BlockingResponse | undefined {
    const tabId = details.tabId;
    if (tabId === -1) return;

    if (this.blockEnabledTimer) {
      clearTimeout(this.blockEnabledTimer);
    }
    this.blockEnabledTimer = setTimeout(() => {
      chrome.storage.local.get(STORAGE_KEYS.BLOCK_ENABLED).then(res => {
        this.block.enabled = res[STORAGE_KEYS.BLOCK_ENABLED] ?? true;
      });
    }, 300);

    if (!this.block.enabled) return;

    // count requests per tab
    this.reqCounts[tabId] = (this.reqCounts[tabId] || 0) + 1;
    // if the request count exceeds 1000, block the tab
    if (this.reqCounts[tabId] > 1000) {
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [tabId],
        addRules: [
          {
            id: tabId,
            action: { type: 'block' },
            condition: {
              urlFilter: details.initiator,
              resourceTypes: [
                'main_frame',
                'sub_frame',
                'script',
                'stylesheet',
                'image',
                'xmlhttprequest',
                'websocket',
                'other'
              ]
            }
          }
        ]
      });

      this.block.tabId = tabId;
      this.reqCounts[tabId] = 0;

      // reload the tab to cancel queued requests
      chrome.tabs.reload(tabId, { bypassCache: true }).catch(err => {
        console.error('Error reloading tab:', err);
      });
    }

    // reset blocking rules every 60 seconds
    if (!this.blockResetTimer) {
      this.blockResetTimer = setInterval(() => {
        this.reqCounts = {};
        if (this.block.tabId !== -1) {
          chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [this.block.tabId]
          });
          this.block.tabId = -1;
        }
      }, 60000);
    }

    return;
  }

  // Public method to get block state (for use by other modules)
  public getBlockTabId(): number {
    return this.block.tabId;
  }

  // Public method to reset block state (for use by other modules)
  public resetBlockTabId(): void {
    this.block.tabId = -1;
  }
}

export default RequestBlocker;