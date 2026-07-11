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

export type TripReimbursabilityRulesMap = Record<string, boolean>;

export const DEFAULT_REIMBURSABLE_RULES: TripReimbursabilityRulesMap = {
  OFFICE_TO_SITE: true,
  SITE_TO_SITE: true,
  SITE_TO_OFFICE: true,
  HOME_TO_SITE: true,
  SITE_TO_HOME: true,
  HOME_TO_OFFICE: false,
  OFFICE_TO_HOME: false,
};

export function getConfiguredReimbursableRules(): TripReimbursabilityRulesMap {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("lifelog_trip_reimbursable_rules");
      if (stored) {
        return { ...DEFAULT_REIMBURSABLE_RULES, ...JSON.parse(stored) };
      }
    } catch {
      // ignore
    }
  }
  return { ...DEFAULT_REIMBURSABLE_RULES };
}

export function saveConfiguredReimbursableRules(rules: TripReimbursabilityRulesMap) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("lifelog_trip_reimbursable_rules", JSON.stringify(rules));
    } catch {
      // ignore
    }
  }
}

/**
 * Pure function to compute whether a trip is reimbursable based on configurable mobility rules.
 * @param tripType The type of trip being undertaken.
 * @param customRules Optional custom rules override map.
 * @returns boolean True if the trip is reimbursable, False otherwise.
 */
export function computeReimbursability(tripType: TripType | string, customRules?: TripReimbursabilityRulesMap | null): boolean {
  if (customRules && typeof customRules[tripType] === "boolean") {
    return customRules[tripType];
  }
  const rules = getConfiguredReimbursableRules();
  if (typeof rules[tripType] === "boolean") {
    return rules[tripType];
  }
  return DEFAULT_REIMBURSABLE_RULES[tripType] ?? false;
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
