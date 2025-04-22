export type AutoUpdateProps = {
  ruleItemId: string;
  value: string;
};

export async function setAutoUpdate(props: AutoUpdateProps) {
  return chrome.runtime.sendMessage({
    action: 'setAutoUpdate',
    payload: props
  });
}

export async function clearAutoUpdate(ruleItemId: string) {
  return chrome.runtime.sendMessage({
    action: 'clearAutoUpdate',
    payload: ruleItemId
  });
}

export async function clearAllAutoUpdate() {
  return chrome.runtime.sendMessage({
    action: 'clearAllAutoUpdate'
  });
}
