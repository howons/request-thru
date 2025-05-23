import { type ChangeEvent, useState } from 'react';

import { Button, Checkbox, ListItem, Stack, TextField } from '@mui/material';

import { clearAutoUpdate } from '../../messages/autoUpdate';

import RuleOptions from './RuleOptions';

const OFF_RULE_PREFIX = '-off--';

type Props = {
  headerInfo: chrome.declarativeNetRequest.ModifyHeaderInfo;
  index: number;
  rule: chrome.declarativeNetRequest.Rule;
  isRulesetActive: boolean;
  isSingle: boolean;
  updateRule: (newRule: chrome.declarativeNetRequest.Rule) => void;
  deleteRuleset: () => void;
};

export default function RuleItem({
  headerInfo,
  index,
  rule,
  isRulesetActive,
  isSingle,
  updateRule,
  deleteRuleset
}: Props) {
  const { header, value } = headerInfo;
  const isActive = !header.startsWith(OFF_RULE_PREFIX);

  const ruleItemId = `reqThru_${rule.id}_${index}`;

  const [isDeleteReady, setIsDeleteReady] = useState(false);

  const handleOnOff = (e: ChangeEvent<HTMLInputElement>, checked: boolean) => {
    const newHeaderInfo = {
      ...headerInfo,
      ...{
        header:
          checked && !isActive
            ? header.split(OFF_RULE_PREFIX)[1]
            : !checked && isActive
              ? `${OFF_RULE_PREFIX}${header}`
              : header
      }
    };
    const newRule: chrome.declarativeNetRequest.Rule = {
      ...rule,
      action: {
        ...rule.action,
        requestHeaders: rule.action.requestHeaders?.map((header, idx) =>
          index === idx ? newHeaderInfo : header
        )
      }
    };
    updateRule(newRule);
  };

  const handleHeaderChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    const newHeaderInfo = {
      ...headerInfo,
      ...{ [id]: value }
    };
    const newRule: chrome.declarativeNetRequest.Rule = {
      ...rule,
      action: {
        ...rule.action,
        requestHeaders: rule.action.requestHeaders?.map((reqHeader, idx) =>
          index === idx ? newHeaderInfo : reqHeader
        )
      }
    };
    updateRule(newRule);
  };

  const handleDeleteClick = () => {
    if (!isDeleteReady) {
      setIsDeleteReady(true);
      setTimeout(() => {
        setIsDeleteReady(false);
      }, 3000);

      return;
    }

    // If the rule is the only rule in ruleset, delete the whole ruleset
    if (isSingle) {
      deleteRuleset();
    } else {
      const deletedRule: chrome.declarativeNetRequest.Rule = {
        ...rule,
        action: {
          ...rule.action,
          requestHeaders: rule.action.requestHeaders?.filter((_, idx) => index !== idx)
        }
      };
      updateRule(deletedRule);
    }
    clearAutoUpdate(ruleItemId);
  };

  return (
    <ListItem>
      <Stack gap={1}>
        <Stack direction="row" gap={2}>
          <Checkbox
            value={isActive}
            defaultChecked={isActive}
            onChange={handleOnOff}
            disabled={!isRulesetActive}
          />
          <TextField
            id="header"
            type="text"
            label="key"
            variant="outlined"
            value={header}
            disabled={!(isActive && isRulesetActive)}
            onChange={handleHeaderChange}
          />
          <TextField
            id="value"
            type="text"
            label="value"
            variant="outlined"
            value={value}
            disabled={!(isActive && isRulesetActive)}
            onChange={handleHeaderChange}
          />
          <Button
            variant={isDeleteReady ? 'contained' : 'outlined'}
            color="warning"
            onClick={handleDeleteClick}
            sx={{ minWidth: 0, padding: '3px 10px', margin: '10px 0' }}
          >
            x
          </Button>
        </Stack>
        <RuleOptions
          ruleItemId={ruleItemId}
          ruleDisabled={!(isActive && isRulesetActive)}
          updateValue={(value: string) => {
            handleHeaderChange({ target: { id: 'value', value } } as ChangeEvent<
              HTMLInputElement | HTMLTextAreaElement
            >);
          }}
        />
      </Stack>
    </ListItem>
  );
}
