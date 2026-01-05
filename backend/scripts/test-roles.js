#!/usr/bin/env node

// Quick test to verify role logic works correctly
import { ROLE_GROUPS, canEdit, canAdminister, normalizeRole } from '../src/middleware/roles.js';

console.log('🧪 Testing Role Authorization Logic\n');

// Test cases - Updated roles (The Goat removed)
const testCases = [
  { role: 'Administrador', expectEdit: true, expectAdmin: true, description: 'Administrador (Full Access)' },
  { role: 'Ingeniero', expectEdit: true, expectAdmin: true, description: 'Ingeniero (Full Access)' },
  { role: 'Tool Room', expectEdit: true, expectAdmin: false, description: 'Tool Room (Tool Access)' },
  { role: 'Operador', expectEdit: true, expectAdmin: false, description: 'Operador (Tool Access)' },
  { role: 'Calidad', expectEdit: true, expectAdmin: false, description: 'Calidad (Tool Access)' },
  { role: 'Soporte', expectEdit: true, expectAdmin: false, description: 'Soporte (Tool Access)' },
  { role: 'Lider', expectEdit: true, expectAdmin: false, description: 'Lider (Tool Access)' },
  { role: 'Supervisor', expectEdit: true, expectAdmin: false, description: 'Supervisor (Tool Access)' },
  { role: 'Tecnico', expectEdit: true, expectAdmin: false, description: 'Tecnico (Tool Access)' },
  { role: 'AOI', expectEdit: true, expectAdmin: false, description: 'AOI (Tool Access)' },
  { role: 'Mantenimiento', expectEdit: true, expectAdmin: false, description: 'Mantenimiento (Tool Access)' },
  { role: 'Modula', expectEdit: true, expectAdmin: false, description: 'Modula (Tool Access)' },
  { role: 'Magazines', expectEdit: true, expectAdmin: false, description: 'Magazines (Tool Access)' },
  { role: 'Recursos Humanos', expectEdit: true, expectAdmin: false, description: 'Recursos Humanos (Tool Access)' },
  { role: 'Invitado', expectEdit: false, expectAdmin: false, description: 'Invitado (Guest - View Only)' },
  // Test with whitespace/casing
  { role: '  Tool Room  ', expectEdit: true, expectAdmin: false, description: 'Tool Room with spaces' },
  { role: 'INGENIERO', expectEdit: true, expectAdmin: true, description: 'Ingeniero uppercase' },
  { role: 'operador', expectEdit: true, expectAdmin: false, description: 'operador lowercase' },
];

let passed = 0;
let failed = 0;

console.log('Role Groups Configuration:');
console.log('FULL_ACCESS:', ROLE_GROUPS.FULL_ACCESS);
console.log('TOOL_ACCESS:', ROLE_GROUPS.TOOL_ACCESS);
console.log('GUEST:', ROLE_GROUPS.GUEST);
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
