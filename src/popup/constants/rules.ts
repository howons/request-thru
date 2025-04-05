type elementType<T> = T extends (infer U)[] ? U : T;

export const emptyCondition: chrome.declarativeNetRequest.Rule['condition'] = {
  urlFilter: '/*'
};

export const emptyRequestHeader: elementType<
  Exclude<chrome.declarativeNetRequest.Rule['action']['requestHeaders'], undefined>
> = {
  header: 'key',
  operation: 'set',
  value: ''
};
