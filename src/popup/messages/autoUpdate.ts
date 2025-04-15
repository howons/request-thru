export type AutoUpdateProps = {
  ruleItemId: string;
  apiUrl: string;
  regMatcher: string;
  regFlag: string;
  regPlacer: string;
  revalidationInterval: number;
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
