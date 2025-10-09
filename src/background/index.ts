import type { UpdateHeaderProps } from './types/messages';
import RequestBlocker from './modules/requestBlocker';
import AutoUpdater from './modules/autoUpdater';

// Initialize modules
const requestBlocker = new RequestBlocker();
const autoUpdater = new AutoUpdater();

// messages related with rules
chrome.runtime.onMessage.addListener((message, sender, _sendResponse) => {
  const sendResponse = _sendResponse as (...args: any[]) => void;

  if (message.action === 'getRules') {
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
  } else if (message.action === 'updateRules') {
    const ruleData: chrome.declarativeNetRequest.UpdateRuleOptions = message.payload;
    updateRules(ruleData, sendResponse);

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
    if (ruleData.removeRuleIds?.[0] === requestBlocker.getBlockTabId()) {
      requestBlocker.resetBlockTabId();
    }

    sendResponse?.({ success: true });
  } catch (error) {
    console.error('Error updating rules:', error);
    sendResponse?.({ success: false, error: (error as { message?: string })?.message ?? error });
  }
}

function updateHeader({ ruleItemId, value }: UpdateHeaderProps) {
  const [, ruleIdStr, indexStr] = ruleItemId.split('_');
  const ruleId = Number(ruleIdStr);
  const index = Number(indexStr);

  return chrome.declarativeNetRequest.getDynamicRules().then(rules => {
    const modifyingRule = rules.find(rule => rule.id === ruleId);
    if (!modifyingRule || !modifyingRule.action.requestHeaders) return;

    modifyingRule.action.requestHeaders[index].value = value;

    updateRules({
      removeRuleIds: [ruleId],
      addRules: [modifyingRule]
    });
  });
}

export {};
