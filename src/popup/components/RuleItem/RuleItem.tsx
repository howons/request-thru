import { type ChangeEvent, useRef, useState } from 'react';

import { Button, Checkbox, ListItem, Stack, TextField } from '@mui/material';

import RuleOptions from './RuleOptions';

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

  const [isDeleteReady, setIsDeleteReady] = useState(false);
  const deleteRef = useRef(0);

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
    clearTimeout(deleteRef.current);
    if (!isDeleteReady) {
      setIsDeleteReady(true);
      setTimeout(() => {
        setIsDeleteReady(false);
      }, 3000);

      return;
    }

    const deletedRule: chrome.declarativeNetRequest.Rule = {
      ...rule,
      action: {
        ...rule.action,
        requestHeaders: rule.action.requestHeaders?.filter((_, idx) => index !== idx)
      }
    };
    updateRule(deletedRule);
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
