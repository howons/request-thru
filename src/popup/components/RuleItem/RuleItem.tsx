import type { ChangeEvent } from 'react';

import { CheckBox } from '@mui/icons-material';
import { ListItem, TextField } from '@mui/material';

import useDebounce from '../../utils/useDebounce';

type Props = {
  headerInfo: chrome.declarativeNetRequest.ModifyHeaderInfo;
  index: number;
  rule: chrome.declarativeNetRequest.Rule;
  isActive: boolean;
  updateRule: (newRule: chrome.declarativeNetRequest.Rule) => void;
};

export default function RuleItem({ headerInfo, index, rule, isActive, updateRule }: Props) {
  const { header, value } = headerInfo;

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
          requestHeaders: rule.action.requestHeaders?.map((header, idx) =>
            index === idx ? newHeaderInfo : header
          )
        }
      };
      updateRule(newRule);
    },
    200
  );

  return (
    <ListItem>
      <CheckBox />
      <TextField
        id="header"
        type="text"
        label="key"
        variant="outlined"
        defaultValue={header}
        disabled={!isActive}
        onChange={handleHeaderChange}
      />
      <TextField
        id="value"
        type="text"
        label="value"
        variant="outlined"
        defaultValue={value}
        disabled={!isActive}
        onChange={handleHeaderChange}
      />
    </ListItem>
  );
}
