export async function getRules() {
  const rules: chrome.declarativeNetRequest.Rule[] = await chrome.runtime.sendMessage({
    action: 'getRules'
  });
  console.log('get', rules);

  return rules;
}

export async function updateRules(ruleData: chrome.declarativeNetRequest.UpdateRuleOptions) {
  console.log('update', ruleData);
  return chrome.runtime.sendMessage({
    action: 'updateRules',
    payload: ruleData
  });
}
