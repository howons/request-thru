import { type ChangeEventHandler } from 'react';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  List,
  Switch,
  TextField
} from '@mui/material';

import { debounce } from '../../utils/debounce';
import RuleItem from '../RuleItem/RuleItem';

type Props = {
  rule: chrome.declarativeNetRequest.Rule;
  updateRule: (newRule: chrome.declarativeNetRequest.Rule) => void;
};

export default function Ruleset({ rule, updateRule }: Props) {
  const url = rule.condition.urlFilter;
  const requestHeaders = rule.action.requestHeaders;

  const handleUrlChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = e => {
    debounce(() => {
      const newUrl = e.target.value;
      const newRule = {
        ...rule,
        condition: { ...rule.condition, urlFilter: newUrl }
      };
      updateRule(newRule);
    }, 200);
  };

  return (
    <Accordion>
      <AccordionSummary>
        <Switch />
        <TextField
          variant="standard"
          label="target URL"
          type="url"
          defaultValue={url}
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
                updateRule={updateRule}
              />
            ))}
        </List>
      </AccordionDetails>
    </Accordion>
  );
}
