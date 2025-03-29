import { useEffect, useMemo, useState } from 'react';

type Props = {
  onBeforeInit?: () => void;
  onCatch?: (reason: any) => void;
  onAfterInit?: () => void;
};

export const useRuleList = ({ onAfterInit, onBeforeInit, onCatch }: Props) => {
  const [reqList, setReqList] = useState<chrome.declarativeNetRequest.Rule[]>([]);
  const [urlList, setUrlList] = useState<string[]>([]);

  const newRuleId = useMemo(() => Math.max(...reqList.map(req => req.id)), [reqList]);

  useEffect(() => {
    onBeforeInit?.();

    chrome.declarativeNetRequest
      .getDynamicRules()
      .then(rules => {
        setReqList(rules);

        if (urlList.length <= 0 && reqList.length > 0) {
          setUrlList(
            Array.from(
              reqList.reduce((set, req) => {
                const urlFilter = req.condition.urlFilter;
                if (urlFilter && !set.has(urlFilter)) {
                  set.add(urlFilter);
                }

                return set;
              }, new Set<string>())
            )
          );
        }
      })
      .catch(onCatch)
      .finally(onAfterInit);
  }, []);

  return {
    reqList,
    setReqList,
    urlList,
    setUrlList,
    newRuleId
  };
};
