import { ReactElement, useState } from 'react';

import { Alert, Button, Snackbar, Stack } from '@mui/material';
import Box from '@mui/material/Box';

import PopupContent from '../../components/PopupContent/PopupContent';
import PopupHeader from '../../components/PopupHeader/PopupHeader';
import Ruleset from '../../components/Ruleset/Ruleset';
import { emptyCondition, emptyRequestHeader } from '../../constants/rules';
import { updateRules } from '../../messages/rule';

import './HomePage.css';
import { useLoadRule } from './useLoadRule';

export default function HomePage(): ReactElement {
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
  const [errorSnackbarMessage, setErrorSnackbarMessage] = useState('');

  const chromeApiHandlers = {
    onCatch(reason: any) {
      console.error(reason);
      setErrorSnackbarMessage('확장 프로그램을 다시 실행해주세요');
    }
  };
  const { ruleList, setRuleList, newRuleId, setNewRuleId } = useLoadRule(chromeApiHandlers);

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
                updateRules({ removeRuleIds: [newRule.id], addRules: [newRule] }).catch(
                  chromeApiHandlers.onCatch
                );
              }}
            />
          ))}
          <Button className="append-button" variant="contained" onClick={appendRuleset}>
            Rule 추가
          </Button>
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
