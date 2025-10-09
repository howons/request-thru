import { LOCAL_KEYS } from '../../popup/constants/rules';
import type { AutoUpdateProps } from '../../popup/messages/autoUpdate';
import { fetchData, matchResult } from '../../popup/utils/fetch';
import type { UpdateHeaderProps } from '../types/messages';

class AutoUpdater {
  constructor() {
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
      if (message.action === 'setAutoUpdate') {
        const { ruleItemId, value } = message.payload as AutoUpdateProps;
        const localKey = `${ruleItemId}_auto`;

        this.updateHeader({ ruleItemId, value }).then(() => {
          chrome.storage.local.set({ [localKey]: Date.now() });
          sendResponse();
        });
      } else if (message.action === 'clearAutoUpdate') {
        const ruleItemId = message.payload as string;
        const localKey = `${ruleItemId}_auto`;
        chrome.storage.local.remove(localKey);
        sendResponse();
      } else if (message.action === 'clearAllAutoUpdate') {
        chrome.storage.local.get().then(items => {
          Object.entries(items).forEach(([key]) => {
            if (!(key.startsWith('reqThru') && key.endsWith('_auto'))) return;
            chrome.storage.local.remove(key);
          });
          sendResponse();
        });
      }

      return true;
    });
  }

  // update rules with auto update enabled
  private updateRuleOnTabActivate(items: Record<string, any>) {
    Object.entries(items).forEach(async ([key, updatedAt]) => {
      if (!(key.startsWith('reqThru') && key.endsWith('_auto'))) return;
      const ruleItemId = key.split('_auto')[0];

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
        this.updateHeader({ ruleItemId, value: regResult });
        chrome.action.setBadgeText({ text: '✅' });
        chrome.storage.local.set({ [key]: Date.now() });
      }, 1000);

      setTimeout(() => {
        chrome.action.setBadgeText({ text: '' });
      }, 2000);
    });
  }

  private updateHeader({ ruleItemId, value }: UpdateHeaderProps) {
    const [, ruleIdStr, indexStr] = ruleItemId.split('_');
    const ruleId = Number(ruleIdStr);
    const index = Number(indexStr);

    return chrome.declarativeNetRequest.getDynamicRules().then(rules => {
      const modifyingRule = rules.find(rule => rule.id === ruleId);
      if (!modifyingRule || !modifyingRule.action.requestHeaders) return;

      modifyingRule.action.requestHeaders[index].value = value;

      // Import updateRules function from the main module
      // We'll need to pass this as a dependency or make it available
      return this.updateRules({
        removeRuleIds: [ruleId],
        addRules: [modifyingRule]
      });
    });
  }

  // This method needs access to the updateRules function from the main module
  // We'll handle this dependency injection in the next step
  private async updateRules(ruleData: chrome.declarativeNetRequest.UpdateRuleOptions) {
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
    } catch (error) {
      console.error('Error updating rules:', error);
    }
  }
}

export default AutoUpdater;