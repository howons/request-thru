import RequestBlocker from './modules/requestBlocker';
import RuleManager from './modules/ruleManager';
import AutoUpdater from './modules/autoUpdater';

// Initialize modules with dependency injection
const requestBlocker = new RequestBlocker();
const ruleManager = new RuleManager(requestBlocker);
const autoUpdater = new AutoUpdater(ruleManager);

export {};
