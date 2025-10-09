/**
 * Chrome Storage Key Constants
 * 
 * Chrome Extension에서 사용하는 저장소 키
 */

/**
 * 접두사/접미사 상수
 */
export const STORAGE_KEYS = {
  // 기본 접두사
  PREFIX: 'reqThru',
  
  // 접미사들
  SUFFIXES: {
    AUTO: '_auto',
    ALIAS: '_alias', 
    BLOCK: '_block',
    BLOCK_URL: '_blockUrl',
  },
  
  // 완성된 키들
  BLOCK_ENABLED: 'reqThru_block',
  BLOCK_URL: 'reqThru_blockUrl',
} as const;

/**
 * 저장소 키 생성 헬퍼 함수들
 */
export const createStorageKey = {
  /**
   * 자동 업데이트 키 생성: reqThru_{ruleId}_{headerIndex}_auto
   */
  autoUpdate: (ruleItemId: string) => `${ruleItemId}${STORAGE_KEYS.SUFFIXES.AUTO}`,
  
  /**
   * 규칙 별칭 키 생성: reqThru_{ruleId}_alias
   */
  ruleAlias: (ruleId: number) => `${STORAGE_KEYS.PREFIX}_${ruleId}${STORAGE_KEYS.SUFFIXES.ALIAS}`,
} as const;
