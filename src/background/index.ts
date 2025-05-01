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
    updateRules(ruleData, sendResponse).then(() => {
      setBlockReqListener();
    });
  } else if (message.action === 'setBlock') {
    const enableBlock = message.payload as boolean;
    block.enabled = enableBlock;

    return false;
  } else {
    return false;
  }

  return true;
});

async function updateRules(
  ruleData: chrome.declarativeNetRequest.UpdateRuleOptions,
  sendResponse: (...args: any[]) => void
) {
  try {
    const urlFilter = ruleData.addRules?.[0].condition?.urlFilter;
    if (urlFilter) {
      const granted = await chrome.permissions.request({ origins: [urlFilter] });
      if (!granted) {
        console.error('Permission not granted for URL:', urlFilter);
      }
    }

    await chrome.declarativeNetRequest.updateDynamicRules(ruleData);
    sendResponse({ success: true });

    if (ruleData.removeRuleIds?.[0] === block.tabId) {
      block.tabId = -1;
    }
  } catch (error) {
    console.error('Error updating rules:', error);
    sendResponse({ success: false, error: (error as { message?: string })?.message ?? error });
  }
}

let storageItems: Record<string, any> | null = null;

chrome.tabs.onActivated.addListener(() => {
  if (storageItems) {
    updateRuleOnTabActivate(storageItems);
  } else {
    chrome.storage.local.get().then(items => {
      storageItems = items;
      updateRuleOnTabActivate(items);
    });
  }
});

function updateRuleOnTabActivate(items: Record<string, any>) {
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
}

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

let reqCounts: Record<number, number> = {};
const block: { tabId: number; enabled?: boolean } = {
  tabId: -1,
  enabled: undefined
};

function setBlockReqListener() {
  chrome.permissions.getAll().then(permissions => {
    const hostPermissions = permissions.origins ?? [];

    chrome.webRequest.onBeforeRequest.removeListener(blockReqHandler);
    chrome.webRequest.onBeforeRequest.addListener(blockReqHandler, { urls: hostPermissions }, []);
  });
}

function blockReqHandler(details: any): chrome.webRequest.BlockingResponse | undefined {
  const tabId = details.tabId;
  if (tabId === -1) return;

  if (block.enabled === undefined) {
    chrome.storage.local.get('reqThru_block').then(res => {
      block.enabled = res.reqThru_block ?? true;
    });
    return;
  }
  if (!block.enabled) return;

  reqCounts[tabId] = (reqCounts[tabId] || 0) + 1;
  if (block.tabId !== tabId && reqCounts[tabId] > 100) {
    const initiator = details.initiator ?? '*://*';
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [tabId],
      addRules: [
        {
          id: tabId,
          action: { type: 'block' },
          condition: {
            urlFilter: `${initiator}/*`
          }
        }
      ]
    });

    block.tabId = tabId;
    reqCounts[tabId] = 0;
  }

  setInterval(() => {
    reqCounts = {};
    if (block.tabId !== -1) {
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [block.tabId]
      });
      block.tabId = -1;
    }
  }, 60000);

  return;
}

export {};
