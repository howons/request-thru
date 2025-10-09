/**
 * Background Script Entry Point
 * 
 * Chrome 확장의 백그라운드 서비스 워커 진입점입니다.
 * 세 개의 주요 모듈을 초기화하고 의존성을 주입합니다.
 * 
 * 모듈 의존성 그래프:
 * RequestBlocker (독립) ← RuleManager ← AutoUpdater
 * 
 * 각 모듈은 자체적으로 메시지 리스너를 설정하며,
 * Chrome Extension API를 통해 브라우저와 상호작용합니다.
 */

import RequestBlocker from './modules/requestBlocker';
import RuleManager from './modules/ruleManager';
import AutoUpdater from './modules/autoUpdater';

// Initialize modules with dependency injection
const requestBlocker = new RequestBlocker();
const ruleManager = new RuleManager(requestBlocker);
const autoUpdater = new AutoUpdater(ruleManager);

export {};
