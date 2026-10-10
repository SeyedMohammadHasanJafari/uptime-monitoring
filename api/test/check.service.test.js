import test from 'node:test';
import assert from 'node:assert/strict';
import { runCheck } from '../src/services/check.service.js';

test('Check Service - Heartbeat Check Logic', async (t) => {
  await t.test('returns UP within initial grace period when no ping has arrived yet', async () => {
    const monitor = {
      type: 'HEARTBEAT',
      interval: 3, // 3 minutes
      lastPingAt: null,
      createdAt: new Date(), // Just created
    };

    const result = await runCheck(monitor);
    assert.equal(result.status, 'UP');
    assert.match(result.details, /Grace period/i);
  });

  await t.test('returns DOWN when initial grace period expires without any ping', async () => {
    const oldDate = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago, exceeds 2 * 3 = 6 min grace
    const monitor = {
      type: 'HEARTBEAT',
      interval: 3,
      lastPingAt: null,
      createdAt: oldDate,
    };

    const result = await runCheck(monitor);
    assert.equal(result.status, 'DOWN');
    assert.match(result.details, /Initial heartbeat was not received/i);
  });

  await t.test('returns UP when recent ping was received within active window', async () => {
    const monitor = {
      type: 'HEARTBEAT',
      interval: 3,
      lastPingAt: new Date(Date.now() - 60 * 1000), // 1 minute ago, well within 6 min window
    };

    const result = await runCheck(monitor);
    assert.equal(result.status, 'UP');
    assert.equal(result.details, 'Heartbeat active');
  });

  await t.test('returns DOWN when heartbeat ping is missed beyond grace window', async () => {
    const monitor = {
      type: 'HEARTBEAT',
      interval: 3,
      lastPingAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    };

    const result = await runCheck(monitor);
    assert.equal(result.status, 'DOWN');
    assert.match(result.details, /Heartbeat missed/i);
  });

  await t.test('returns DOWN for unknown monitor type', async () => {
    const monitor = {
      type: 'UNKNOWN_TYPE',
    };

    const result = await runCheck(monitor);
    assert.equal(result.status, 'DOWN');
    assert.match(result.details, /Unknown monitor type/i);
  });
});
