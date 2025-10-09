/**
 * Background Script Type Definitions
 * 
 * 백그라운드 스크립트 모듈들에서 공통으로 사용하는 타입들을 정의합니다.
 * 각 모듈 간의 데이터 교환과 상태 관리를 위한 인터페이스를 제공합니다.
 */

/**
 * 규칙 헤더 업데이트에 필요한 매개변수
 */
export interface UpdateHeaderProps {
  ruleItemId: string; // 업데이트할 규칙의 고유 식별자 (format: reqThru_{ruleId}_{headerIndex})
  value: string;      // 설정할 새로운 헤더 값
}

/**
 * 요청 차단 상태 관리 인터페이스
 */
export interface BlockState {
  tabId: number;        // 현재 차단된 탭의 ID (-1이면 차단된 탭 없음)
  enabled?: boolean;    // 차단 기능의 활성화 상태 (undefined면 설정값에 따름)
}