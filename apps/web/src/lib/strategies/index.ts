/**
 * Strategy barrel — import this file to register all built-in vision strategies.
 *
 * Each strategy module self-registers via registerVisionStrategy() on import.
 * Add new strategy imports here as they are created.
 */

// Built-in: step-by-step guided capture (WebSocket → Python CV)
import './guided-strategy';

// Auto-detect: identifies visible joints and captures ROM automatically
import './auto-detect-strategy';
