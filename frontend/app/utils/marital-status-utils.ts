/**
 * Utility functions for handling marital status values,
 * provides a mapping of marital status values to their corresponding
 * localized string keys
 */
export const maritalStatusMap = {
  single: 'marital-status.single',
  married: 'marital-status.married',
  divorced: 'marital-status.divorced',
  widowed: 'marital-status.widowed',
  separated: 'marital-status.separated',
} as const;
