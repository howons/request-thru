export async function getRules() {
  const rules: chrome.declarativeNetRequest.Rule[] = await chrome.runtime.sendMessage({
    action: 'getRules'
  });

  return rules;
}

export async function updateRules(ruleData: chrome.declarativeNetRequest.UpdateRuleOptions) {
  return await chrome.runtime.sendMessage({
    action: 'updateRules',
    payload: ruleData
  });
}

export async function getRuleAliases() {
  const ruleAliases: { id: number; alias: string }[] = await chrome.runtime.sendMessage({
    action: 'getRuleAliases'
  });

  return ruleAliases;
}

export async function updateRuleAlias(id: number, alias: string) {
  return await chrome.runtime.sendMessage({
    action: 'updateRuleAlias',
    payload: { id, alias }
  });
}

export async function setBlock(enableBlock: boolean) {
  return await chrome.runtime.sendMessage({
    action: 'setBlock',
    payload: enableBlock
  });
}
