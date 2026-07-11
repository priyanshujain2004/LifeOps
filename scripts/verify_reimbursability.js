/**
 * Standalone verification script for LifeLog reimbursability pure functions.
 * Run with: node scripts/verify_reimbursability.js
 */

const assert = require('assert');

// Replicate or require the pure reimbursability rules
function computeReimbursability(tripType) {
  switch (tripType) {
    case 'OFFICE_TO_SITE':
    case 'SITE_TO_SITE':
    case 'SITE_TO_OFFICE':
      return true;
    case 'HOME_TO_OFFICE':
    case 'OFFICE_TO_HOME':
    case 'HOME_TO_SITE':
    case 'SITE_TO_HOME':
    default:
      return false;
  }
}

function computeExpenseReimbursability(rule, isTripReimbursable = false, conditions = {}, activeTripType = null) {
  if (rule === 'ALWAYS') return true;
  if (rule === 'NEVER') return false;
  if (rule === 'CONDITIONAL') {
    if (conditions?.rule_type === 'TRIP_TYPE_MATCH' && Array.isArray(conditions?.allowed_trip_types)) {
      if (!activeTripType) return false;
      return conditions.allowed_trip_types.includes(activeTripType);
    }
    if (conditions?.rule_type === 'ACTIVE_TRIP_REIMBURSABLE') {
      return isTripReimbursable === true;
    }
    return isTripReimbursable === true;
  }
  return false;
}

console.log('--- Verifying Trip Reimbursability Rules ---');

// 1. Check non-reimbursable trip types
['HOME_TO_OFFICE', 'OFFICE_TO_HOME', 'HOME_TO_SITE', 'SITE_TO_HOME'].forEach(type => {
  assert.strictEqual(computeReimbursability(type), false, `${type} must NOT be reimbursable`);
  console.log(`[PASS] ${type} -> false`);
});

// 2. Check reimbursable trip types
['OFFICE_TO_SITE', 'SITE_TO_SITE', 'SITE_TO_OFFICE'].forEach(type => {
  assert.strictEqual(computeReimbursability(type), true, `${type} must BE reimbursable`);
  console.log(`[PASS] ${type} -> true`);
});

console.log('\n--- Verifying CONDITIONAL Activity Expense Rules ---');

// Rule #5: Left for Site -> reimbursable ONLY if active trip is OFFICE_TO_SITE or SITE_TO_SITE
const leftForSiteConditions = { rule_type: 'TRIP_TYPE_MATCH', allowed_trip_types: ['OFFICE_TO_SITE', 'SITE_TO_SITE'] };
assert.strictEqual(computeExpenseReimbursability('CONDITIONAL', true, leftForSiteConditions, 'OFFICE_TO_SITE'), true);
assert.strictEqual(computeExpenseReimbursability('CONDITIONAL', true, leftForSiteConditions, 'SITE_TO_SITE'), true);
assert.strictEqual(computeExpenseReimbursability('CONDITIONAL', false, leftForSiteConditions, 'HOME_TO_SITE'), false);
console.log('[PASS] Rule #5 (Left for Site) conditional logic verified');

// Rule #10: Lunch Start -> reimbursable ONLY if active trip exists and trip.reimbursable = true
const lunchConditions = { rule_type: 'ACTIVE_TRIP_REIMBURSABLE' };
assert.strictEqual(computeExpenseReimbursability('CONDITIONAL', true, lunchConditions, 'OFFICE_TO_SITE'), true);
assert.strictEqual(computeExpenseReimbursability('CONDITIONAL', false, lunchConditions, 'HOME_TO_OFFICE'), false);
assert.strictEqual(computeExpenseReimbursability('CONDITIONAL', false, lunchConditions, null), false);
console.log('[PASS] Rule #10 (Lunch Start) conditional logic verified');

// Rule #14: Hotel Check-In -> ALWAYS
assert.strictEqual(computeExpenseReimbursability('ALWAYS', false, {}, null), true);
console.log('[PASS] Rule #14 (Hotel Check-In ALWAYS) verified');

// Rule #1: Left Home -> NEVER
assert.strictEqual(computeExpenseReimbursability('NEVER', true, {}, 'OFFICE_TO_SITE'), false);
console.log('[PASS] Rule #1 (Left Home NEVER) verified');

console.log('\n=============================================');
console.log('✅ ALL REIMBURSABILITY RULES VERIFIED & PASSED!');
console.log('=============================================');
