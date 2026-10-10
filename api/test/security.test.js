import test from 'node:test';
import assert from 'node:assert/strict';

test('Security & Input Sanitization - Status Page Regex Escaping', async (t) => {
  const sanitizeIdentifier = (identifier) => {
    return String(identifier).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  await t.test('properly escapes wildcard regex characters', () => {
    const maliciousInput = '.*';
    const escaped = sanitizeIdentifier(maliciousInput);
    assert.equal(escaped, '\\.\\*');

    const regex = new RegExp(`^${escaped}$`, 'i');
    assert.equal(regex.test('Any Company Name'), false);
    assert.equal(regex.test('.*'), true);
  });

  await t.test('properly escapes parentheses and square brackets', () => {
    const company = 'Acme (US) [Global] + Co.';
    const escaped = sanitizeIdentifier(company);
    assert.equal(escaped, 'Acme \\(US\\) \\[Global\\] \\+ Co\\.');

    const regex = new RegExp(`^${escaped}$`, 'i');
    assert.equal(regex.test('Acme (US) [Global] + Co.'), true);
    assert.equal(regex.test('Acme US Global + Co.'), false);
  });

  await t.test('handles case-insensitivity correctly on sanitized expression', () => {
    const company = 'PulseGuard Cloud';
    const escaped = sanitizeIdentifier(company);
    const regex = new RegExp(`^${escaped}$`, 'i');

    assert.equal(regex.test('pulseguard cloud'), true);
    assert.equal(regex.test('PULSEGUARD CLOUD'), true);
  });
});
