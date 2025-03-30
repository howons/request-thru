import { useEffect, useRef, useState } from 'react';

type Props = {
  onBeforeInit?: () => void;
  onCatch?: (reason: any) => void;
  onAfterInit?: () => void;
};

export const useRuleList = ({ onAfterInit, onBeforeInit, onCatch }: Props) => {
  const initUrlRuleRef = useRef<Record<string, chrome.declarativeNetRequest.Rule[] | undefined>>(
    {}
  );
  const [urlList, setUrlList] = useState<string[]>([]);

  const [newRuleId, setNewRuleId] = useState(0);

  useEffect(() => {
    onBeforeInit?.();

    chrome.declarativeNetRequest
      .getDynamicRules()
      .then(rules => {
        setNewRuleId(Math.max(...rules.map(rule => rule.id)) + 1);

        if (urlList.length <= 0 && rules.length > 0) {
          rules.forEach(rule => {
            const url = rule.condition.urlFilter;
            if (url === undefined) return;

            if (initUrlRuleRef.current[url] !== undefined) {
              initUrlRuleRef.current[url].push(rule);
            } else {
              initUrlRuleRef.current[url] = [rule];
            }
          });

          setUrlList(
            Array.from(
              rules.reduce((set, req) => {
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
    initUrlRuleRef,
    urlList,
    setUrlList,
    newRuleId,
    setNewRuleId
  };
};
