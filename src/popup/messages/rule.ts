export async function getRules() {
  const rules: chrome.declarativeNetRequest.Rule[] = await chrome.runtime.sendMessage({
    action: 'getRules'
  });

  return rules;
}

export async function updateRules(ruleData: chrome.declarativeNetRequest.UpdateRuleOptions) {
  return chrome.runtime.sendMessage({
    action: 'updateRules',
    payload: ruleData
  });
}
