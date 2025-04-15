import React, { useEffect } from 'react';
import './globals.css';

const LogPanel = ({ logs, onClear }) => {
  const logContainerRef = React.useRef(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const getStatusClass = (action) => {
    if (action.includes('ERROR')) return 'edge-log-status-error';
    if (action.includes('COMPLETE')) return 'edge-log-status-complete';
    if (action.includes('START')) return 'edge-log-status-start';
    return 'edge-log-status-default';
  };

  const formatAction = (action) => {
    return action
      .replace('_START', ' Started')
      .replace('_COMPLETE', ' Completed')
      .replace('_ERROR', ' Failed');
  };

  const formatLogDetails = (log) => {
    switch (log.action) {
      case 'ADD_EDGE_START':
      case 'ADD_EDGE_COMPLETE':
      case 'ADD_EDGE_ERROR':
        return `From: ${log.source} → To: ${log.target}`;
      case 'DELETE_EDGE_START':
      case 'DELETE_EDGE_COMPLETE':
      case 'DELETE_EDGE_ERROR':
        return `Edge: ${log.source}-${log.target}${log.algo_running ? ` (Algo: ${log.algo_running})` : ''}`;
      default:
        return JSON.stringify(log, null, 2);
    }
  };

  return (
    <div className="edge-log-panel">
      {/* Fixed header */}
      <div className="edge-log-header">
        <span>Edge Operations Log</span>
        {logs.length > 0 && (
          <button className="edge-log-clear-btn" onClick={onClear}>
            Clear
          </button>
        )}
      </div>

      {/* Scrollable content area */}
      <div className="edge-log-content" ref={logContainerRef}>
        {logs.length === 0 ? (
          <div className="edge-log-empty">No edge operations yet</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="edge-log-entry">
              <div className={`edge-log-action ${getStatusClass(log.action)}`}>
                {formatAction(log.action)}
              </div>
              <div>{formatLogDetails(log)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LogPanel;
