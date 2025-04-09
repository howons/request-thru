import { type ChangeEvent, useRef, useState } from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  List,
  Stack,
  Switch,
  TextField
} from '@mui/material';

import { emptyRequestHeader } from '../../constants/rules';
import useDebounce from '../../utils/useDebounce';
import RuleItem from '../RuleItem/RuleItem';

type Props = {
  rule: chrome.declarativeNetRequest.Rule;
  updateRuleset: (newRule: chrome.declarativeNetRequest.Rule) => void;
  deleteRuleset: () => void;
};

export default function Ruleset({ rule, updateRuleset, deleteRuleset }: Props) {
  const url = rule.condition.urlFilter;
  const requestHeaders = rule.action.requestHeaders;

  const isActive = !rule.condition.excludedRequestMethods?.length;

  const [isDeleteReady, setIsDeleteReady] = useState(false);
  const deleteRef = useRef(0);

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

  const handleDeleteClick = () => {
    clearTimeout(deleteRef.current);
    if (!isDeleteReady) {
      setIsDeleteReady(true);
      setTimeout(() => {
        setIsDeleteReady(false);
      }, 3000);

      return;
    }

    deleteRuleset();
  };

  return (
    <Accordion defaultExpanded={isActive}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`panel${rule.id}-content`}
        id={`panel${rule.id}-header`}
      >
        <Switch
          value={isActive}
          defaultChecked={isActive}
          onChange={handleOnOff}
          onClick={e => {
            e.stopPropagation();
          }}
        />
        <TextField
          variant="standard"
          label="target URL"
          type="url"
          defaultValue={url}
          disabled={!isActive}
          onChange={handleUrlChange}
          onClick={e => {
            e.stopPropagation();
          }}
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
        <Stack direction="row" spacing={3}>
          <Button
            variant={isDeleteReady ? 'contained' : 'outlined'}
            color="error"
            onClick={handleDeleteClick}
            sx={{ marginLeft: 'auto' }}
          >
            삭제
          </Button>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
