chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.clear();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // TODO: Here you can add logic such as e.g. disable popup button on specific pages
  console.debug('tabId', tabId, 'changeInfo', changeInfo, 'tab', tab);
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
  }

  return true;
});

export {};
