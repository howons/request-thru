import type { UpdateHeaderProps } from '../types/messages';
import { RULE_ACTIONS } from '../constants/messageActions';
import { STORAGE_KEYS, createStorageKey } from '../constants/storageKeys';

/**
 * RuleManager - 규칙 관리 모듈
 * 
 * 역할:
 * - Chrome 확장의 declarativeNetRequest 규칙 CRUD 작업 관리
 * - 규칙 별칭(alias) 생성, 수정, 삭제 기능 제공
 * - 규칙 헤더 값 업데이트 및 동기화 처리
 * - initiatorDomains와 requestDomains의 중복 규칙 자동 생성
 * - RequestBlocker와 연동하여 차단 규칙 상태 관리
 * 
 * 메시지 액션:
 * - getRules: 현재 등록된 규칙 목록 반환
 * - updateRules: 규칙 추가/삭제/수정
 * - getRuleAliases: 규칙 별칭 목록 반환
 * - updateRuleAlias: 규칙 별칭 수정
 * - deleteRuleAlias: 규칙 별칭 삭제
 */
class RuleManager {
  private requestBlocker: any; // Will receive as dependency

  constructor(requestBlocker: any) {
    this.requestBlocker = requestBlocker;
    this.setupMessageListener();
  }

  private setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, _sendResponse) => {
      const sendResponse = _sendResponse as (...args: any[]) => void;

      switch (message.action) {
        case RULE_ACTIONS.GET_RULES:
          chrome.declarativeNetRequest
            .getDynamicRules()
            .then(rules => {
              // only return rules with initiatorDomains to hide duplicated rules with requestDomains
              const filteredRules = rules.filter(rule => rule.condition.requestDomains === undefined);
              sendResponse(filteredRules);
            })
            .catch(reason => {
              console.error(reason);
            });
          break;

        case RULE_ACTIONS.UPDATE_RULES:
          const ruleData: chrome.declarativeNetRequest.UpdateRuleOptions = message.payload;
          this.updateRules(ruleData, sendResponse);
          break;

        case RULE_ACTIONS.GET_RULE_ALIASES:
          chrome.storage.local.get().then(res => {
            const ruleAliases = Object.entries(res)
              .filter(([key]) => key.startsWith(STORAGE_KEYS.PREFIX) && key.endsWith(STORAGE_KEYS.SUFFIXES.ALIAS))
              .map(([key, value]) => ({
                id: Number(key.split('_')[1]),
                alias: value as string
              }));

            sendResponse(ruleAliases);
          });
          break;

        case RULE_ACTIONS.UPDATE_RULE_ALIAS:
          const { id, alias } = message.payload as { id: number; alias: string };
          const aliasLocalKey = createStorageKey.ruleAlias(id);
          const localValue = alias || '';
          const localData = { [aliasLocalKey]: localValue };
          chrome.storage.local.set(localData).then(() => {
            sendResponse({ success: true });
          });
          break;

        case RULE_ACTIONS.DELETE_RULE_ALIAS:
          const { id: deleteId } = message.payload as { id: number };
          const deleteLocalKey = createStorageKey.ruleAlias(deleteId);
          chrome.storage.local.remove(deleteLocalKey).then(() => {
            sendResponse({ success: true });
          });
          break;

        default:
          return false;
      }

      return true;
    });
  }

  public async updateRules(
    ruleData: chrome.declarativeNetRequest.UpdateRuleOptions,
    sendResponse?: (...args: any[]) => void
  ) {
    try {
      // update the rule with duplicated rule to register both initiatorDomains and requestDomains
      const duplicatedUpdateRule: chrome.declarativeNetRequest.UpdateRuleOptions = {
        removeRuleIds: ruleData.removeRuleIds
          ? [...ruleData.removeRuleIds, ...ruleData.removeRuleIds.map(id => 100000 + id)]
          : undefined,
        addRules: ruleData.addRules
          ? [
              ...ruleData.addRules,
              ...ruleData.addRules.map(({ condition, ...rule }) => ({
                ...rule,
                id: 100000 + rule.id,
                condition: {
                  ...condition,
                  initiatorDomains: undefined,
                  requestDomains: condition.initiatorDomains
                    ? [...condition.initiatorDomains]
                    : undefined
                }
              }))
            ]
          : undefined
      };

      await chrome.declarativeNetRequest.updateDynamicRules(duplicatedUpdateRule);

      // if removed rule is blocking rule, reset the block tabId
      if (ruleData.removeRuleIds?.[0] === this.requestBlocker.getBlockTabId()) {
        this.requestBlocker.resetBlockTabId();
      }

      sendResponse?.({ success: true });
    } catch (error) {
      console.error('Error updating rules:', error);
      sendResponse?.({ success: false, error: (error as { message?: string })?.message ?? error });
    }
  }

  public updateHeader({ ruleItemId, value }: UpdateHeaderProps) {
    const [, ruleIdStr, indexStr] = ruleItemId.split('_');
    const ruleId = Number(ruleIdStr);
    const index = Number(indexStr);

    return chrome.declarativeNetRequest.getDynamicRules().then(rules => {
      const modifyingRule = rules.find(rule => rule.id === ruleId);
      if (!modifyingRule || !modifyingRule.action.requestHeaders) return;

      modifyingRule.action.requestHeaders[index].value = value;

      this.updateRules({
        removeRuleIds: [ruleId],
        addRules: [modifyingRule]
      });
    });
  }
}

export default RuleManager;