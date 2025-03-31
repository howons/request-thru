import { useEffect, useState } from 'react';

type Props = {
  onBefore?: () => void;
  onCatch?: (reason: any) => void;
  onAfter?: () => void;
};

export const useLoadRule = ({ onAfter, onBefore, onCatch }: Props) => {
  const [ruleList, setRuleList] = useState<chrome.declarativeNetRequest.Rule[]>([]);
  const [newRuleId, setNewRuleId] = useState(0);

  useEffect(() => {
    onBefore?.();

    chrome.declarativeNetRequest
      .getDynamicRules()
      .then(rules => {
        setNewRuleId(Math.max(...rules.map(rule => rule.id)) + 1);

        if (ruleList.length <= 0 && rules.length > 0) {
          setRuleList(rules);
        }
      })
      .catch(onCatch)
      .finally(onAfter);
  }, []);

  return {
    ruleList,
    setRuleList,
    newRuleId,
    setNewRuleId
  };
};
