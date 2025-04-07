import type { ChangeEvent } from 'react';

import { Checkbox, ListItem, TextField } from '@mui/material';

import useDebounce from '../../utils/useDebounce';

type Props = {
  headerInfo: chrome.declarativeNetRequest.ModifyHeaderInfo;
  index: number;
  rule: chrome.declarativeNetRequest.Rule;
  isRulesetActive: boolean;
  updateRule: (newRule: chrome.declarativeNetRequest.Rule) => void;
};

export default function RuleItem({ headerInfo, index, rule, isRulesetActive, updateRule }: Props) {
  const { header, value } = headerInfo;

  const isActive = !header.startsWith('-off--');

  const handleOnOff = (e: ChangeEvent<HTMLInputElement>, checked: boolean) => {
    const newHeaderInfo = {
      ...headerInfo,
      ...{
        header:
          checked && !isActive
            ? header.split('-off--')[1]
            : !checked && isActive
              ? `-off--${header}`
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

  const handleHeaderChange = useDebounce(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    },
    200
  );

  return (
    <ListItem>
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
        defaultValue={header}
        disabled={!(isActive && isRulesetActive)}
        onChange={handleHeaderChange}
      />
      <TextField
        id="value"
        type="text"
        label="value"
        variant="outlined"
        defaultValue={value}
        disabled={!(isActive && isRulesetActive)}
        onChange={handleHeaderChange}
      />
    </ListItem>
  );
}
