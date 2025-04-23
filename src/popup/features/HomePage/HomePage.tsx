import { ReactElement, useEffect, useRef, useState } from 'react';

import { Alert, Button, Snackbar, Stack, Switch, Typography } from '@mui/material';
import Box from '@mui/material/Box';

import PopupContent from '../../components/PopupContent/PopupContent';
import PopupHeader from '../../components/PopupHeader/PopupHeader';
import Ruleset from '../../components/Ruleset/Ruleset';
import { emptyCondition, emptyRequestHeader } from '../../constants/rules';
import { clearAllAutoUpdate } from '../../messages/autoUpdate';
import { setBlock, updateRules } from '../../messages/rule';

import './HomePage.css';
import { useLoadRule } from './useLoadRule';

export default function HomePage(): ReactElement {
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
  const [errorSnackbarMessage, setErrorSnackbarMessage] = useState('');

  const [enableBlock, setEnableBlock] = useState(true);

  const debounceRef = useRef({ timerId: 0, lastRuleId: 0 });

  const chromeApiHandlers = {
    onCatch(reason: any) {
      console.error(reason);
      setErrorSnackbarMessage('확장 프로그램을 다시 실행해주세요');
    }
  };
  const { ruleList, setRuleList, newRuleId, setNewRuleId } = useLoadRule(chromeApiHandlers);

  useEffect(() => {
    chrome.storage.local.get(['reqThru_block']).then(res => {
      const isBlock = res.reqThru_block;
      if (isBlock !== undefined) {
        setEnableBlock(isBlock);
        setBlock(isBlock);
      }
    });
  }, []);

  const handleSnackbarClose = () => {
    setShowErrorSnackbar(false);
  };

  const appendRuleset = () => {
    const newRule: chrome.declarativeNetRequest.Rule = {
      id: newRuleId,
      action: {
        type: 'modifyHeaders',
        requestHeaders: [emptyRequestHeader]
      },
      condition: emptyCondition
    };

    setRuleList(prevRuleList => [...prevRuleList, newRule]);
    setNewRuleId(prevNewRuleId => prevNewRuleId + 1);

    updateRules({ addRules: [newRule] }).catch(chromeApiHandlers.onCatch);
  };

  const disableAllRuleset = () => {
    const disabledRuleList = ruleList.map(rule => {
      const newRule: chrome.declarativeNetRequest.Rule = {
        ...rule,
        condition: {
          ...rule.condition,
          excludedRequestMethods: [
            'connect',
            'delete',
            'get',
            'head',
            'options',
            'other',
            'patch',
            'post',
            'put'
          ]
        }
      };
      return newRule;
    });

    setRuleList(disabledRuleList);
    updateRules({ removeRuleIds: ruleList.map(rule => rule.id), addRules: disabledRuleList }).catch(
      chromeApiHandlers.onCatch
    );
    clearAllAutoUpdate();
  };

  const toggleBlocking: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void = (
    event,
    checked
  ) => {
    setEnableBlock(checked);
    setBlock(checked);
    chrome.storage.local.set({ reqThru_block: checked });
  };

  return (
    <>
      <PopupHeader />
      <PopupContent>
        <Stack alignItems="center" spacing={1}>
          <Box alignItems="center">
            <h1>Custom Headers</h1>
          </Box>
          {ruleList.map(rule => (
            <Ruleset
              key={rule.id}
              rule={rule}
              updateRuleset={(newRule: chrome.declarativeNetRequest.Rule) => {
                setRuleList(prevRuleList =>
                  prevRuleList.map(prevRule => (prevRule.id === newRule.id ? newRule : prevRule))
                );

                if (newRule.id === debounceRef.current.lastRuleId) {
                  clearTimeout(debounceRef.current.timerId);
                }
                debounceRef.current.timerId = setTimeout(() => {
                  updateRules({ removeRuleIds: [newRule.id], addRules: [newRule] }).catch(
                    chromeApiHandlers.onCatch
                  );
                  debounceRef.current.lastRuleId = newRule.id;
                }, 300);
              }}
              deleteRuleset={() => {
                setRuleList(prevRuleList =>
                  prevRuleList.filter(prevRule => prevRule.id !== rule.id)
                );
                updateRules({ removeRuleIds: [rule.id] }).catch(chromeApiHandlers.onCatch);
              }}
            />
          ))}
          <Button className="append-button" variant="contained" onClick={appendRuleset}>
            Rule 추가
          </Button>
          <Stack direction="row" alignSelf="stretch" padding="16px">
            <Button
              variant="outlined"
              color="error"
              sx={{ marginLeft: 'auto' }}
              onClick={disableAllRuleset}
            >
              전체 비활성화
            </Button>
          </Stack>
          <Stack direction="row" alignSelf="stretch" padding="16px" alignItems={'center'}>
            <Typography variant="caption" sx={{ marginLeft: 'auto' }}>
              무한 네트워크 요청 자동 차단
            </Typography>
            <Switch checked={enableBlock} onChange={toggleBlocking} />
          </Stack>
        </Stack>
      </PopupContent>
      <Snackbar open={showErrorSnackbar} autoHideDuration={5000} onClose={handleSnackbarClose}>
        <Alert className="alert-snackbar-alert" severity="error" onClose={handleSnackbarClose}>
          {errorSnackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
