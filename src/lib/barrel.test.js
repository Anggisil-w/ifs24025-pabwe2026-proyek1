import { describe, it, expect } from 'vitest';
import * as validators from './validators.js';
import * as rules from './validation/rules.js';
import * as forms from './validation/forms.js';

describe('validators (pintu masuk tunggal)', () => {
  it('mengekspor ulang semua aturan dan validator form', () => {
    for (const key of [...Object.keys(rules), ...Object.keys(forms)]) {
      expect(validators[key]).toBe(rules[key] ?? forms[key]);
    }
    expect(validators.validateRegister).toBeTypeOf('function');
  });
});
