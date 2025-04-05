import { useEffect, useState } from 'react';

import { getRules } from '../../messages/rule';

type Props = {
  onBefore?: () => void;
  onCatch?: (reason: any) => void;
  onAfter?: () => void;
};

export const useLoadRule = ({ onAfter, onBefore, onCatch }: Props) => {
  const [ruleList, setRuleList] = useState<chrome.declarativeNetRequest.Rule[]>([]);
  const [newRuleId, setNewRuleId] = useState(1);

  useEffect(() => {
    onBefore?.();

    getRules()
      .then(rules => {
        if (ruleList.length <= 0 && rules.length > 0) {
          setNewRuleId(Math.max(...rules.map(rule => rule.id)) + 1);
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
