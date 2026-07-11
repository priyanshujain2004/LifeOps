export type TripType =
  | 'HOME_TO_OFFICE'
  | 'HOME_TO_SITE'
  | 'OFFICE_TO_SITE'
  | 'SITE_TO_SITE'
  | 'SITE_TO_OFFICE'
  | 'SITE_TO_HOME'
  | 'OFFICE_TO_HOME';

export type ExpenseReimbursableRule = 'NEVER' | 'ALWAYS' | 'CONDITIONAL';

export interface ReimbursableConditions {
  rule_type?: 'TRIP_TYPE_MATCH' | 'ACTIVE_TRIP_REIMBURSABLE';
  allowed_trip_types?: TripType[];
}

/**
 * Pure function to compute whether a trip is reimbursable based on hardcoded mobility rules.
 * @param tripType The type of trip being undertaken.
 * @returns boolean True if the trip is reimbursable, False otherwise.
 */
export function computeReimbursability(tripType: TripType | string): boolean {
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

/**
 * Pure function to compute whether an expense triggered by an activity log is reimbursable.
 * @param rule The activity type's expense reimbursable rule (NEVER, ALWAYS, CONDITIONAL).
 * @param isTripReimbursable Boolean indicating if the active trip is reimbursable.
 * @param conditions JSON conditions specifying exact allowed trip types or trip reimbursability requirement.
 * @param activeTripType Optional trip type of the currently active trip.
 */
export function computeExpenseReimbursability(
  rule: ExpenseReimbursableRule | string,
  isTripReimbursable: boolean = false,
  conditions: ReimbursableConditions | any = {},
  activeTripType?: TripType | string | null
): boolean {
  if (rule === 'ALWAYS') {
    return true;
  }
  if (rule === 'NEVER') {
    return false;
  }
  if (rule === 'CONDITIONAL') {
    // Check specific conditions
    if (conditions?.rule_type === 'TRIP_TYPE_MATCH' && Array.isArray(conditions?.allowed_trip_types)) {
      if (!activeTripType) return false;
      return conditions.allowed_trip_types.includes(activeTripType as TripType);
    }
    if (conditions?.rule_type === 'ACTIVE_TRIP_REIMBURSABLE') {
      return isTripReimbursable === true;
    }
    // Fallback: if CONDITIONAL is set but no specific conditions match, default to active trip reimbursability
    return isTripReimbursable === true;
  }
  return false;
}
