import { LOCAL_KEYS } from '../popup/constants/rules';
import type { AutoUpdateProps } from '../popup/messages/autoUpdate';
import { fetchData, matchResult } from '../popup/utils/fetch';

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

chrome.tabs.onActivated.addListener(() => {
  chrome.storage.local.get().then(items => {
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

      autoUpdateRule({ ruleItemId, value: regResult });
    });
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendMessage) => {
  if (message.action === 'setAutoUpdate') {
    const { ruleItemId, value } = message.payload as AutoUpdateProps;

    const localKey = `${ruleItemId}_auto`;

    autoUpdateRule({ ruleItemId, value }).then(() => {
      chrome.storage.local.set({ [localKey]: Date.now() });
      sendMessage();
    });
  } else if (message.action === 'clearAutoUpdate') {
    const ruleItemId = message.payload as string;

    const localKey = `${ruleItemId}_auto`;
    chrome.storage.local.remove(localKey);
    sendMessage();
  } else if (message.action === 'clearAllAutoUpdate') {
    chrome.storage.local.get().then(items => {
      Object.entries(items).forEach(([key]) => {
        if (!(key.startsWith('reqThru') && key.endsWith('_auto'))) return;

        chrome.storage.local.remove(key);
      });

      sendMessage();
    });
  }

  return true;
});

type FetchAndUpdateRuleProps = {
  ruleItemId: string;
  value: string;
};

function autoUpdateRule({ ruleItemId, value }: FetchAndUpdateRuleProps) {
  const [, ruleIdStr, indexStr] = ruleItemId.split('_');
  const ruleId = Number(ruleIdStr);
  const index = Number(indexStr);

  return chrome.declarativeNetRequest.getDynamicRules().then(rules => {
    const modifyingRule = rules.find(rule => rule.id === ruleId);
    if (!modifyingRule || !modifyingRule.action.requestHeaders) return;

    modifyingRule.action.requestHeaders[index].value = value;

    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [ruleId],
      addRules: [modifyingRule]
    });
  });
}

export {};
