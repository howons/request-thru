import { type ChangeEvent, useState } from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  List,
  Switch,
  TextField
} from '@mui/material';

import { emptyRequestHeader } from '../../constants/rules';
import useDebounce from '../../utils/useDebounce';
import RuleItem from '../RuleItem/RuleItem';

type Props = {
  rule: chrome.declarativeNetRequest.Rule;
  updateRuleset: (newRule: chrome.declarativeNetRequest.Rule) => void;
};

export default function Ruleset({ rule, updateRuleset }: Props) {
  const url = rule.condition.urlFilter;
  const requestHeaders = rule.action.requestHeaders;

  const isActive = !rule.condition.excludedRequestMethods?.length;

  const handleOnOff = (e: ChangeEvent<HTMLInputElement>, checked: boolean) => {
    const newRule: chrome.declarativeNetRequest.Rule = {
      ...rule,
      condition: {
        ...rule.condition,
        excludedRequestMethods: checked
          ? undefined
          : ['connect', 'delete', 'get', 'head', 'options', 'other', 'patch', 'post', 'put']
      }
    };
    updateRuleset(newRule);
  };

  const handleUrlChange = useDebounce((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newUrl = e.target.value;
    const newRule: chrome.declarativeNetRequest.Rule = {
      ...rule,
      condition: { ...rule.condition, urlFilter: newUrl }
    };
    updateRuleset(newRule);
  }, 200);

  const appendRule = () => {
    const newRule: chrome.declarativeNetRequest.Rule = {
      ...rule,
      action: {
        ...rule.action,
        requestHeaders: [...(requestHeaders ?? []), emptyRequestHeader]
      }
    };
    updateRuleset(newRule);
  };

  return (
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`panel${rule.id}-content`}
        id={`panel${rule.id}-header`}
      >
        <Switch value={isActive} defaultChecked={isActive} onChange={handleOnOff} />
        <TextField
          variant="standard"
          label="target URL"
          type="url"
          defaultValue={url}
          disabled={!isActive}
          onChange={handleUrlChange}
        />
      </AccordionSummary>
      <AccordionDetails>
        <List>
          {requestHeaders &&
            requestHeaders.map((headerInfo, index) => (
              <RuleItem
                key={index}
                headerInfo={headerInfo}
                index={index}
                rule={rule}
                isRulesetActive={isActive}
                updateRule={updateRuleset}
              />
            ))}
        </List>
        <Button className="append-button" variant="contained" onClick={appendRule}>
          Header 추가
        </Button>
      </AccordionDetails>
    </Accordion>
  );
}
