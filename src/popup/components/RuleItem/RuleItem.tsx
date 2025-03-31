import type { ChangeEvent } from 'react';

import { CheckBox } from '@mui/icons-material';
import { ListItem, TextField } from '@mui/material';

import { debounce } from '../../utils/debounce';

type Props = {
  headerInfo: chrome.declarativeNetRequest.ModifyHeaderInfo;
  index: number;
  rule: chrome.declarativeNetRequest.Rule;
  updateRule: (newRule: chrome.declarativeNetRequest.Rule) => void;
};

export default function RuleItem({ headerInfo, index, rule, updateRule }: Props) {
  const { header, value } = headerInfo;

  const handleHeaderChange =
    (type: keyof chrome.declarativeNetRequest.ModifyHeaderInfo) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      debounce(() => {
        const newHeaderInfo = { ...headerInfo, ...{ [type]: e.target.value } };
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
      }, 200);
    };

  return (
    <ListItem>
      <CheckBox />
      <TextField
        variant="outlined"
        label="key"
        type="text"
        defaultValue={header}
        onChange={handleHeaderChange('header')}
      />
      <TextField
        variant="outlined"
        label="value"
        type="text"
        defaultValue={value}
        onChange={handleHeaderChange('value')}
      />
    </ListItem>
  );
}
