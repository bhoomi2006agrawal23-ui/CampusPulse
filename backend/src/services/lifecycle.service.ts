import { EventLifecycleState, EVENT_LIFECYCLE_STATES } from '../constants/lifecycle.js';

/**
 * CampusPulse Centralized Event Lifecycle State Machine
 * Exact Locked Transition Map
 */
export const ALLOWED_TRANSITIONS: Record<EventLifecycleState, EventLifecycleState[]> = {
  Draft: ['Published', 'Cancelled'],
  Published: ['RegistrationOpen', 'Cancelled'],
  RegistrationOpen: ['RegistrationClosed', 'Cancelled'],
  RegistrationClosed: ['EventUpcoming', 'Cancelled'],
  EventUpcoming: ['EventOngoing', 'Cancelled'],
  EventOngoing: ['EventCompleted'],
  EventCompleted: ['ResultsPublished'],
  ResultsPublished: ['CertificatesGenerated'],
  CertificatesGenerated: ['Archived'],
  Cancelled: [], // Terminal state
  Archived: [],  // Terminal state
};

export class LifecycleService {
  /**
   * Validates whether a state transition from currentStatus to nextStatus is allowed.
   */
  static isValidTransition(
    currentStatus: EventLifecycleState,
    nextStatus: EventLifecycleState
  ): boolean {
    if (!EVENT_LIFECYCLE_STATES.includes(nextStatus)) {
      return false;
    }
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    return allowed.includes(nextStatus);
  }

  /**
   * Validates if an event has all required information to be published.
   */
  static validatePublishReadiness(event: {
    title?: string;
    description?: string;
    categoryId?: any;
    primaryVenueId?: any;
    startDateTime?: Date | string;
    endDateTime?: Date | string;
    registrationStart?: Date | string;
    registrationEnd?: Date | string;
    capacity?: number;
  }): { isReady: boolean; missingFields: string[] } {
    const missing: string[] = [];
    if (!event.title || event.title.trim().length < 3) missing.push('title (min 3 chars)');
    if (!event.description || event.description.trim().length === 0) missing.push('description');
    if (!event.categoryId) missing.push('category');
    if (!event.primaryVenueId) missing.push('primary venue');
    if (!event.startDateTime) missing.push('event start date & time');
    if (!event.endDateTime) missing.push('event end date & time');
    if (!event.registrationStart) missing.push('registration start date & time');
    if (!event.registrationEnd) missing.push('registration end date & time');
    if (!event.capacity || event.capacity < 1) missing.push('capacity (min 1)');

    return {
      isReady: missing.length === 0,
      missingFields: missing,
    };
  }
}
