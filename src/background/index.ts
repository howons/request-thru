import { LOCAL_KEYS } from '../popup/constants/rules';
import type { AutoUpdateProps } from '../popup/messages/autoUpdate';
import { fetchData, matchResult } from '../popup/utils/fetch';

chrome.runtime.onMessage.addListener((message, sender, _sendResponse) => {
  const sendResponse = _sendResponse as (...args: any[]) => void;

  if (message.action === 'getRules') {
    chrome.declarativeNetRequest
      .getDynamicRules()
      .then(rules => {
        const filteredRules = rules.filter(rule => rule.condition.requestDomains === undefined);
        sendResponse(filteredRules);
      })
      .catch(reason => {
        console.error(reason);
      });
  } else if (message.action === 'updateRules') {
    const ruleData: chrome.declarativeNetRequest.UpdateRuleOptions = message.payload;
    updateRules(ruleData, sendResponse);
  } else if (message.action === 'setBlock') {
    const enableBlock = message.payload as boolean;
    block.enabled = enableBlock;

    return false;
  } else if (message.action === 'getRuleAliases') {
    chrome.storage.local.get().then(res => {
      const ruleAliases = Object.entries(res)
        .filter(([key]) => key.startsWith('reqThru') && key.endsWith('_alias'))
        .map(([key, value]) => ({
          id: Number(key.split('_')[1]),
          alias: value as string
        }));

      sendResponse(ruleAliases);
    });
  } else if (message.action === 'updateRuleAlias') {
    const { id, alias } = message.payload as { id: number; alias: string };
    const localKey = `reqThru_${id}_alias`;
    const localValue = alias || '';
    const localData = { [localKey]: localValue };
    chrome.storage.local.set(localData).then(() => {
      sendResponse({ success: true });
    });
  } else if (message.action === 'deleteRuleAlias') {
    const { id } = message.payload as { id: number };
    const localKey = `reqThru_${id}_alias`;
    chrome.storage.local.remove(localKey).then(() => {
      sendResponse({ success: true });
    });
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

chrome.webRequest.onBeforeRequest.addListener(
  blockReqHandler,
  { urls: ['http://*/*', 'https://*/*'] },
  []
);

let blockResetTimer: number | null = null;

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
  if (reqCounts[tabId] > 1000) {
    const initiator = (details.initiator ?? '').split('://')[1].split('/')[0].split(':')[0];
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [tabId],
      addRules: [
        {
          id: tabId,
          action: { type: 'block' },
          condition: {
            initiatorDomains: [initiator],
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

    block.tabId = tabId;
    reqCounts[tabId] = 0;
    chrome.tabs.reload(tabId, { bypassCache: true }).catch(err => {
      console.error('Error reloading tab:', err);
    });
  }

  if (!blockResetTimer) {
    blockResetTimer = setInterval(() => {
      reqCounts = {};
      if (block.tabId !== -1) {
        chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: [block.tabId]
        });
        block.tabId = -1;
      }
    }, 60000);
  }

  return;
}

export {};
