type elementType<T> = T extends (infer U)[] ? U : T;

export const emptyCondition: chrome.declarativeNetRequest.Rule['condition'] = {
  urlFilter: 'http://*/*'
};

export const emptyRequestHeader: elementType<
  Exclude<chrome.declarativeNetRequest.Rule['action']['requestHeaders'], undefined>
> = {
  header: 'key',
  operation: 'set',
  value: ''
};

export const LOCAL_KEYS = [
  'isAutoUpdate',
  'apiUrl',
  'regMatcher',
  'regFlag',
  'regPlacer',
  'revalidationInterval'
] as const;
