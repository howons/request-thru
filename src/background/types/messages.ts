// Utility types used in background script

export interface UpdateHeaderProps {
  ruleItemId: string;
  value: string;
}

export interface BlockState {
  tabId: number;
  enabled?: boolean;
}