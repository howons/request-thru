import { ReactElement, useCallback, useRef, useState } from 'react';

import { Alert, Button, Snackbar, Stack } from '@mui/material';
import Box from '@mui/material/Box';

import InfRequest from '../../components/InfRequest/InfRequest';
import PopupContent from '../../components/PopupContent/PopupContent';
import PopupHeader from '../../components/PopupHeader/PopupHeader';
import Ruleset from '../../components/Ruleset/Ruleset';
import { emptyCondition, emptyRequestHeader } from '../../constants/rules';
import { clearAllAutoUpdate } from '../../messages/autoUpdate';
import { deleteRuleAlias, updateRules } from '../../messages/rule';

import './HomePage.css';
import { useLoadRule } from './useLoadRule';

export default function HomePage(): ReactElement {
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
  const [errorSnackbarMessage, setErrorSnackbarMessage] = useState('');

  const onCatch = useCallback((reason: any) => {
    console.error(reason);
    setErrorSnackbarMessage(reason.toString() || '확장 프로그램을 다시 실행해주세요');
    setShowErrorSnackbar(true);
  }, []);

  const { ruleList, setRuleList, newRuleId, setNewRuleId, ruleAliasList } = useLoadRule({
    onCatch
  });

  // To Selectively apply debouncing, This function uses debounceRef instead of useDebounce hook
  const debounceRef = useRef({ timerId: 0, lastRuleId: 0 });
  const updateRuleset = (newRule: chrome.declarativeNetRequest.Rule, delay?: number) => {
    setRuleList(prevRuleList =>
      prevRuleList.map(prevRule => (prevRule.id === newRule.id ? newRule : prevRule))
    );

    if (newRule.id === debounceRef.current.lastRuleId) {
      clearTimeout(debounceRef.current.timerId);
    }
    debounceRef.current.timerId = setTimeout(() => {
      updateRules({ removeRuleIds: [newRule.id], addRules: [newRule] })
        .then(data => {
          if (data?.success) return;
          onCatch(data?.error);
        })
        .catch(onCatch);
      debounceRef.current.lastRuleId = newRule.id;
    }, delay ?? 0);
  };

  const deleteRuleset = (ruleId: number) => () => {
    setRuleList(prevRuleList => prevRuleList.filter(prevRule => prevRule.id !== ruleId));
    updateRules({ removeRuleIds: [ruleId] }).catch(onCatch);
    deleteRuleAlias(ruleId);
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

    updateRules({ addRules: [newRule] }).catch(onCatch);
  };

  // Disable all rules by excluding all request methods
  // and clear all auto updates
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
      onCatch
    );
    clearAllAutoUpdate();
  };

  const handleSnackbarClose = () => {
    setShowErrorSnackbar(false);
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
              ruleAlias={ruleAliasList.find(alias => alias.id === rule.id)?.alias}
              updateRuleset={updateRuleset}
              deleteRuleset={deleteRuleset(rule.id)}
            />
          ))}
          <Button
            className="append-button"
            variant="contained"
            onClick={appendRuleset}
            sx={{ width: '300px' }}
          >
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
          <InfRequest />
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
