import type { AutoUpdateProps } from '../popup/messages/autoUpdate';
import { fetchData, matchResult } from '../popup/utils/fetch';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.clear();
});

chrome.runtime.onMessage.addListener((message, sender, _sendResponse) => {
  const sendResponse = _sendResponse as (...args: any[]) => void;

  if (message.action === 'getRules') {
    chrome.declarativeNetRequest
      .getDynamicRules()
      .then(rules => {
        sendResponse(rules);
      })
      .catch(reason => {
        console.error(reason);
      });
  } else if (message.action === 'updateRules') {
    const ruleData: chrome.declarativeNetRequest.UpdateRuleOptions = message.payload;
    chrome.declarativeNetRequest
      .updateDynamicRules(ruleData)
      .then(() => {
        sendResponse();
      })
      .catch(reason => {
        console.error(reason);
      });
  } else {
    return false;
  }

  return true;
});

chrome.runtime.onMessage.addListener(message => {
  if (message.action === 'setAutoUpdate') {
    const { ruleItemId, apiUrl, regFlag, regMatcher, regPlacer, revalidationInterval } =
      message.payload as AutoUpdateProps;

    const localKey = `${ruleItemId}_timerId`;
    chrome.storage.local.get(localKey).then(({ localKey: timerId }) => {
      if (timerId) {
        clearInterval(timerId);
      }
    });

    fetchData(apiUrl).then(result => {
      const regResult = matchResult(result, regMatcher, regFlag, regPlacer);

      const timerId = setInterval(() => {
        const [, ruleIdStr, indexStr] = ruleItemId.split('_');
        const ruleId = Number(ruleIdStr);
        const index = Number(indexStr);

        chrome.declarativeNetRequest.getDynamicRules().then(rules => {
          const modifyingRule = rules.find(rule => rule.id === ruleId);
          if (!modifyingRule || !modifyingRule.action.requestHeaders) return;

          modifyingRule.action.requestHeaders[index].value = regResult;

          chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [ruleId],
            addRules: [modifyingRule]
          });
        });
      }, revalidationInterval);

      chrome.storage.local.set({ [localKey]: timerId });
    });
  } else if (message.action === 'clearAutoUpdate') {
    const ruleItemId = message.payload as string;

    const localKey = `${ruleItemId}_timerId`;
    chrome.storage.local.get(localKey).then(({ [localKey]: timerId }) => {
      if (timerId) {
        clearInterval(timerId);
      }
    });
  }

  return false;
});

export {};
