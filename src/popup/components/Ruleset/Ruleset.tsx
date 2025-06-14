import { type ChangeEvent, type MouseEvent, useState } from 'react';

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
import { updateRuleAlias } from '../../messages/rule';
import useDebounce from '../../utils/useDebounce';
import ExpandableTextFields from '../ExpandableTextFields/ExpandableTextFields';
import RuleItem from '../RuleItem/RuleItem';

type Props = {
  rule: chrome.declarativeNetRequest.Rule;
  ruleAlias?: string;
  updateRuleset: (newRule: chrome.declarativeNetRequest.Rule, delay?: number) => void;
  deleteRuleset: () => void;
};

export default function Ruleset({
  rule,
  ruleAlias = rule.id.toString(),
  updateRuleset,
  deleteRuleset
}: Props) {
  const urlList = rule.condition.initiatorDomains ?? [];
  const requestHeaders = rule.action.requestHeaders;

  const isActive = !rule.condition.excludedRequestMethods?.length;

  const isBlock = rule.action.type === 'block';

  const [isDeleteReady, setIsDeleteReady] = useState(false);

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

  const handleAliasChange = useDebounce(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value: newAlias } = e.target;
      updateRuleAlias(rule.id, newAlias);
    },
    1000
  );

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
    updateRuleset(newRule, 1000);
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
    if (!isDeleteReady) {
      setIsDeleteReady(true);
      setTimeout(() => {
        setIsDeleteReady(false);
      }, 3000);

      return;
    }

    deleteRuleset();
    // Clear auto update for each request header in ruleset
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
        <Stack direction={'row'} gap={2} alignItems="center">
          <Switch
            checked={isActive}
            sx={{ marginTop: '10px' }}
            onChange={handleOnOff}
            onClick={e => {
              e.stopPropagation();
            }}
          />
          <TextField
            label="별명"
            variant="standard"
            defaultValue={!isBlock ? ruleAlias : (rule.condition.urlFilter ?? 'blocking rule')}
            onChange={handleAliasChange}
          />
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        {!isBlock ? (
          <>
            <ExpandableTextFields
              list={urlList}
              tooltip="요청을 보내거나 받을 도메인을 입력합니다. 포트번호는 인식 불가. ex) example.com, localhost"
              label="domain"
              disabled={!isActive}
              onChange={handleUrlChange}
              handleAppend={handleUrlAppend}
              handleDelete={handleUrlDelete}
            />
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
            <Button
              className="append-button"
              variant="contained"
              onClick={appendRule}
              sx={{ width: '200px' }}
            >
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
