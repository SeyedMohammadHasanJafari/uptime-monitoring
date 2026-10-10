import net from 'net';
import tls from 'tls';

const TIMEOUT_MS = 10000; // 10 seconds timeout

const performHttpCheck = async (target) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const startTime = Date.now();
  
  try {
    const response = await fetch(target, { signal: controller.signal });
    clearTimeout(timeoutId);
    return {
      status: response.ok ? 'UP' : 'DOWN',
      responseTime: Date.now() - startTime,
      details: `HTTP ${response.status} ${response.statusText}`,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      status: 'DOWN',
      responseTime: Date.now() - startTime,
      details: error.name === 'AbortError' ? 'Timeout' : error.message,
    };
  }
};

const performKeywordCheck = async (target, keyword) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const startTime = Date.now();
  
  try {
    const response = await fetch(target, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      return { status: 'DOWN', responseTime: Date.now() - startTime, details: `HTTP ${response.status}` };
    }
    const text = await response.text();
    if (text.includes(keyword)) {
      return { status: 'UP', responseTime: Date.now() - startTime, details: `Keyword found` };
    } else {
      return { status: 'DOWN', responseTime: Date.now() - startTime, details: `Keyword '${keyword}' not found` };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    return { status: 'DOWN', responseTime: Date.now() - startTime, details: error.message };
  }
};

const performTcpCheck = (target, port) => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const socket = new net.Socket();
    
    socket.setTimeout(TIMEOUT_MS);

    socket.on('connect', () => {
      socket.destroy();
      resolve({ status: 'UP', responseTime: Date.now() - startTime, details: 'TCP Connected' });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ status: 'DOWN', responseTime: TIMEOUT_MS, details: 'Timeout' });
    });

    socket.on('error', (err) => {
      resolve({ status: 'DOWN', responseTime: Date.now() - startTime, details: err.message });
    });

    socket.connect(port, target);
  });
};

const performSslCheck = (target) => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const hostname = new URL(target.startsWith('http') ? target : `https://${target}`).hostname;
    
    const socket = tls.connect({
      host: hostname,
      port: 443,
      servername: hostname,
      timeout: TIMEOUT_MS,
    }, () => {
      const cert = socket.getPeerCertificate();
      socket.destroy();
      
      if (!cert || !cert.valid_to) {
        return resolve({ status: 'DOWN', responseTime: Date.now() - startTime, details: 'Invalid Certificate' });
      }

      const validTo = new Date(cert.valid_to);
      const daysRemaining = Math.floor((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      if (daysRemaining < 7) {
        return resolve({ status: 'DOWN', responseTime: Date.now() - startTime, details: `SSL Expires in ${daysRemaining} days` });
      }

      resolve({ status: 'UP', responseTime: Date.now() - startTime, details: `SSL Valid (${daysRemaining} days left)` });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ status: 'DOWN', responseTime: TIMEOUT_MS, details: 'Timeout' });
    });

    socket.on('error', (err) => {
      resolve({ status: 'DOWN', responseTime: Date.now() - startTime, details: err.message });
    });
  });
};

const performHeartbeatCheck = async (monitor) => {
  const now = new Date();
  const lastPing = monitor.lastPingAt;
  const maxDelay = monitor.interval * 60 * 1000 * 2; // Grace period: 2x interval
  
  if (!lastPing) {
    const createdAt = monitor.createdAt ? new Date(monitor.createdAt).getTime() : now.getTime();
    if (now.getTime() - createdAt <= maxDelay) {
      return { status: 'UP', responseTime: 1, details: 'Grace period: Waiting for initial heartbeat' };
    }
    return { status: 'DOWN', responseTime: 0, details: 'Initial heartbeat was not received within grace period' };
  }

  if ((now.getTime() - new Date(lastPing).getTime()) > maxDelay) {
    return { status: 'DOWN', responseTime: 0, details: 'Heartbeat missed: No ping received in expected window' };
  }
  return { status: 'UP', responseTime: 1, details: 'Heartbeat active' };
};

export const runCheck = async (monitor) => {
  switch (monitor.type) {
    case 'HTTP':
      return performHttpCheck(monitor.target);
    case 'KEYWORD':
      return performKeywordCheck(monitor.target, monitor.keyword);
    case 'TCP':
      return performTcpCheck(monitor.target, monitor.port);
    case 'SSL':
      return performSslCheck(monitor.target);
    case 'HEARTBEAT':
      return performHeartbeatCheck(monitor);
    default:
      return { status: 'DOWN', responseTime: 0, details: 'Unknown monitor type' };
  }
};

export const runCheckWithRetries = async (monitor, maxRetries = 3) => {
  let attempt = 0;
  let lastResult = null;
  while (attempt < maxRetries) {
    lastResult = await runCheck(monitor);
    if (lastResult.status === 'UP') {
      return lastResult; // Success, no need to retry
    }
    attempt++;
    if (attempt < maxRetries) {
      // 5 second delay before retry
      await new Promise(resolve => setTimeout(resolve, 5000)); 
    }
  }
  return lastResult; // Officially DOWN after retries
};
