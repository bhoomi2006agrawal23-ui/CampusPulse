export const EVENT_LIFECYCLE_STATES = [
  'Draft',
  'Published',
  'RegistrationOpen',
  'RegistrationClosed',
  'EventUpcoming',
  'EventOngoing',
  'EventCompleted',
  'ResultsPublished',
  'CertificatesGenerated',
  'Archived',
  'Cancelled',
] as const;

export type EventLifecycleState = (typeof EVENT_LIFECYCLE_STATES)[number];

export const CANCELLABLE_STATES: EventLifecycleState[] = [
  'Draft',
  'Published',
  'RegistrationOpen',
  'RegistrationClosed',
  'EventUpcoming',
];
