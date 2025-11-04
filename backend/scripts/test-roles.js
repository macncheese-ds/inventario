#!/usr/bin/env node

// Quick test to verify role logic works correctly
import { ROLE_GROUPS, canEdit, canAdminister, normalizeRole } from '../src/middleware/roles.js';

console.log('🧪 Testing Role Authorization Logic\n');

// Test cases
const testCases = [
  { role: 'The Goat', expectEdit: true, expectAdmin: true, description: 'The Goat (Full Access)' },
  { role: 'Administrador', expectEdit: true, expectAdmin: true, description: 'Administrador (Full Access)' },
  { role: 'Ingeniero', expectEdit: true, expectAdmin: true, description: 'Ingeniero (Full Access)' },
  { role: 'Tool Room', expectEdit: true, expectAdmin: false, description: 'Tool Room (Edit only)' },
  { role: 'Operador', expectEdit: false, expectAdmin: false, description: 'Operador (View Only)' },
  { role: 'Calidad', expectEdit: false, expectAdmin: false, description: 'Calidad (View Only)' },
  { role: 'Soporte', expectEdit: false, expectAdmin: false, description: 'Soporte (View Only)' },
  { role: 'Lider', expectEdit: false, expectAdmin: false, description: 'Lider (View Only)' },
  { role: 'Invitado', expectEdit: false, expectAdmin: false, description: 'Invitado (View Only)' },
  { role: 'Recursos Humanos', expectEdit: false, expectAdmin: false, description: 'Recursos Humanos (View Only)' },
  // Test with whitespace/casing
  { role: '  Tool Room  ', expectEdit: true, expectAdmin: false, description: 'Tool Room with spaces' },
  { role: 'INGENIERO', expectEdit: true, expectAdmin: true, description: 'Ingeniero uppercase' },
  { role: 'operador', expectEdit: false, expectAdmin: false, description: 'operador lowercase' },
];

let passed = 0;
let failed = 0;

console.log('Role Groups Configuration:');
console.log('FULL_ACCESS:', ROLE_GROUPS.FULL_ACCESS);
console.log('TOOL_ROOM:', ROLE_GROUPS.TOOL_ROOM);
console.log('VIEW_ONLY:', ROLE_GROUPS.VIEW_ONLY);
console.log('\n' + '='.repeat(60) + '\n');

testCases.forEach(({ role, expectEdit, expectAdmin, description }) => {
  const actualEdit = canEdit(role);
  const actualAdmin = canAdminister(role);
  const editMatch = actualEdit === expectEdit;
  const adminMatch = actualAdmin === expectAdmin;
  const allMatch = editMatch && adminMatch;

  const status = allMatch ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} | ${description}`);
  console.log(`   Role: "${role}" (normalized: "${normalizeRole(role)}")`);
  console.log(`   canEdit: ${actualEdit} (expected: ${expectEdit}) ${editMatch ? '✓' : '✗'}`);
  console.log(`   canAdminister: ${actualAdmin} (expected: ${expectAdmin}) ${adminMatch ? '✓' : '✗'}`);
  console.log();

  if (allMatch) passed++;
  else failed++;
});

console.log('='.repeat(60));
console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('💥 Some tests failed!');
  process.exit(1);
}
