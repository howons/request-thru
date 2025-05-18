import { useEffect, useState } from 'react';

import { getRuleAliases, getRules } from '../../messages/rule';

type Props = {
  onBefore?: () => void;
  onCatch?: (reason: any) => void;
  onAfter?: () => void;
};

export const useLoadRule = ({ onAfter, onBefore, onCatch }: Props) => {
  const [ruleList, setRuleList] = useState<chrome.declarativeNetRequest.Rule[]>([]);
  const [newRuleId, setNewRuleId] = useState(1);
  const [ruleAliasList, setRuleAliasList] = useState<{ id: number; alias: string }[]>([]);

  useEffect(() => {
    onBefore?.();

    Promise.all([getRules(), getRuleAliases()])
      .then(([rules, aliases]) => {
        if (ruleList.length <= 0 && rules.length > 0) {
          setNewRuleId(Math.max(...rules.map(rule => rule.id)) + 1);
          setRuleList(
            rules.toSorted(
              (a, b) =>
                (aliases.find(alias => alias.id === a.id)?.alias ?? a.id.toString()).localeCompare(
                  aliases.find(alias => alias.id === b.id)?.alias ?? b.id.toString()
                ) ?? 0
            )
          );
        }
        setRuleAliasList(aliases);
      })
      .catch(onCatch)
      .finally(onAfter);
  }, []);

  return {
    ruleList,
    setRuleList,
    newRuleId,
    setNewRuleId,
    ruleAliasList
  };
};
