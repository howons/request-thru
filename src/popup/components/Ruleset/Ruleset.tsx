import { type ChangeEventHandler } from 'react';

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
import { debounce } from '../../utils/debounce';
import RuleItem from '../RuleItem/RuleItem';

type Props = {
  rule: chrome.declarativeNetRequest.Rule;
  disableAppendButton: boolean;
  updateRuleset: (newRule: chrome.declarativeNetRequest.Rule) => void;
};

export default function Ruleset({ rule, disableAppendButton, updateRuleset }: Props) {
  const url = rule.condition.urlFilter;
  const requestHeaders = rule.action.requestHeaders;

  const handleUrlChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = e => {
    debounce(() => {
      const newUrl = e.target.value;
      const newRule = {
        ...rule,
        condition: { ...rule.condition, urlFilter: newUrl }
      };
      updateRuleset(newRule);
    }, 200);
  };

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
                updateRule={updateRuleset}
              />
            ))}
        </List>
        <Button
          className="append-button"
          variant="contained"
          disabled={disableAppendButton}
          onClick={appendRule}
        >
          Header 추가
        </Button>
      </AccordionDetails>
    </Accordion>
  );
}
