/**
 * Background Script Message Action Constants
 * 
 * Chrome Extension 백그라운드 스크립트에서 사용하는 액션
 */

/**
 * Rule Manager 관련 메시지 액션
 */
export const RULE_ACTIONS = {
  GET_RULES: 'getRules',
  UPDATE_RULES: 'updateRules',
  GET_RULE_ALIASES: 'getRuleAliases',
  UPDATE_RULE_ALIAS: 'updateRuleAlias',
  DELETE_RULE_ALIAS: 'deleteRuleAlias',
} as const;

/**
 * Request Blocker 관련 메시지 액션
 */
export const BLOCK_ACTIONS = {
  SET_BLOCK: 'setBlock',
  SET_BLOCK_URL: 'setBlockUrl',
} as const;

/**
 * Auto Updater 관련 메시지 액션
 */
export const AUTO_UPDATE_ACTIONS = {
  SET_AUTO_UPDATE: 'setAutoUpdate',
  CLEAR_AUTO_UPDATE: 'clearAutoUpdate',
  CLEAR_ALL_AUTO_UPDATE: 'clearAllAutoUpdate',
} as const;

/**
 * 모든 메시지 액션을 통합한 객체
 */
export const MESSAGE_ACTIONS = {
  ...RULE_ACTIONS,
  ...BLOCK_ACTIONS,
  ...AUTO_UPDATE_ACTIONS,
} as const;

/**
 * 메시지 액션 타입 정의
 */
export type RuleActionType = typeof RULE_ACTIONS[keyof typeof RULE_ACTIONS];
export type BlockActionType = typeof BLOCK_ACTIONS[keyof typeof BLOCK_ACTIONS];
export type AutoUpdateActionType = typeof AUTO_UPDATE_ACTIONS[keyof typeof AUTO_UPDATE_ACTIONS];
export type MessageActionType = typeof MESSAGE_ACTIONS[keyof typeof MESSAGE_ACTIONS];
