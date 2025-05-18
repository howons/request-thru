import { type ChangeEvent, type MouseEvent, useRef, useState } from 'react';

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
  Tooltip,
  Typography
} from '@mui/material';

import { emptyCondition, emptyRequestHeader } from '../../constants/rules';
import { clearAutoUpdate } from '../../messages/autoUpdate';
import RuleItem from '../RuleItem/RuleItem';

import './Ruleset.css';

type Props = {
  rule: chrome.declarativeNetRequest.Rule;
  updateRuleset: (newRule: chrome.declarativeNetRequest.Rule) => void;
  deleteRuleset: () => void;
};

export default function Ruleset({ rule, updateRuleset, deleteRuleset }: Props) {
  const urlList = rule.condition.initiatorDomains ?? emptyCondition.initiatorDomains!;
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
    const { value: newUrl, id } = e.target;
    const index = Number(id.split('-')[1]);
    const newRule: chrome.declarativeNetRequest.Rule = {
      ...rule,
      condition: {
        ...rule.condition,
        initiatorDomains: urlList.map((url, i) => (i === index ? newUrl : url))
      }
    };
    updateRuleset(newRule);
  };

  const handleUrlAppend = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const newRule: chrome.declarativeNetRequest.Rule = {
      ...rule,
      condition: { ...rule.condition, initiatorDomains: [...urlList, ''] }
    };
    updateRuleset(newRule);
  };

  const handleUrlDelete = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const newRule: chrome.declarativeNetRequest.Rule = {
      ...rule,
      condition: { ...rule.condition, initiatorDomains: urlList.filter(url => url.length > 0) }
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
          sx={{ marginTop: '10px' }}
          onChange={handleOnOff}
          onClick={e => {
            e.stopPropagation();
          }}
        />
        <Stack direction={'row'} gap={2} alignItems="center">
          {urlList.map((url, index) => (
            <Tooltip key={index} title="요청을 보내는 페이지 도메인을 입력합니다. ex) example.com">
              <TextField
                id={`url-${index}`}
                variant="standard"
                label="domain"
                type="url"
                value={url}
                disabled={!isActive}
                className="url-input"
                onChange={handleUrlChange}
                onClick={e => {
                  e.stopPropagation();
                }}
              />
            </Tooltip>
          ))}
          <Stack direction="row" gap={0.5} alignItems="center">
            <Button
              variant="outlined"
              color="primary"
              sx={{ minWidth: 0, padding: '2px 7px', margin: '7px 0' }}
              onClick={handleUrlAppend}
            >
              +
            </Button>
            <Tooltip title="빈 칸인 domain을 삭제합니다.">
              <Button
                variant="outlined"
                color="error"
                sx={{ minWidth: 0, padding: '2px 7px', margin: '7px 0' }}
                onClick={handleUrlDelete}
              >
                -
              </Button>
            </Tooltip>
          </Stack>
        </Stack>
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
