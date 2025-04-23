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
  TextField,
  Typography
} from '@mui/material';

import { emptyRequestHeader } from '../../constants/rules';
import { clearAutoUpdate } from '../../messages/autoUpdate';
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

  const isBlock = rule.action.type === 'block';

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

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newUrl = e.target.value;
    const newRule: chrome.declarativeNetRequest.Rule = {
      ...rule,
      condition: { ...rule.condition, urlFilter: newUrl }
    };
    updateRuleset(newRule);
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
    requestHeaders?.forEach((_, i) => {
      clearAutoUpdate(`reqThru_${rule.id}_${i}`);
    });
  };

  return (
    <Accordion defaultExpanded={isActive}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`panel${rule.id}-content`}
        id={`panel${rule.id}-header`}
      >
        <Switch
          checked={isActive}
          onChange={handleOnOff}
          onClick={e => {
            e.stopPropagation();
          }}
        />
        <TextField
          variant="standard"
          label="target URL"
          type="url"
          value={url}
          disabled={!isActive}
          onChange={handleUrlChange}
          onClick={e => {
            e.stopPropagation();
          }}
        />
      </AccordionSummary>
      <AccordionDetails>
        {!isBlock ? (
          <>
            <List>
              {requestHeaders &&
                requestHeaders.map((headerInfo, index) => (
                  <RuleItem
                    key={index}
                    headerInfo={headerInfo}
                    index={index}
                    rule={rule}
                    isRulesetActive={isActive}
                    isSingle={requestHeaders.length === 1}
                    updateRule={updateRuleset}
                    deleteRuleset={deleteRuleset}
                  />
                ))}
            </List>
            <Button className="append-button" variant="contained" onClick={appendRule}>
              Header 추가
            </Button>
          </>
        ) : (
          <Typography color="error">
            현재 과도한 양의 반복 요청으로 인해 해당 url에서의 네트워크 요청을 차단했습니다. <br />
            문제 원인을 제거한 뒤 해당 rule을 삭제해주세요.
          </Typography>
        )}
        <Stack direction="row">
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
