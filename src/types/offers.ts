/**
 * Citizen help offers. Matching an offer to an NGO need is done by the
 * backend; the app only submits the offer and shows the returned status.
 */
export type HelpKind = 'FOOD' | 'MONEY' | 'EQUIPMENT' | 'VOLUNTEERING';

export const HELP_KIND_LABELS: Record<HelpKind, string> = {
  FOOD: 'Food',
  MONEY: 'Money',
  EQUIPMENT: 'Equipment',
  VOLUNTEERING: 'Volunteering',
};

export type HelpOfferStatus = 'SUBMITTED' | 'MATCHED' | 'ACCEPTED' | 'DECLINED' | 'CLOSED';

export const HELP_OFFER_STATUS_LABELS: Record<HelpOfferStatus, string> = {
  SUBMITTED: 'Awaiting match',
  MATCHED: 'Matched with an NGO',
  ACCEPTED: 'Accepted by NGO',
  DECLINED: 'Not needed now',
  CLOSED: 'Closed',
};

/** A need published by a verified NGO (from its public updates). */
export interface NgoNeed {
  id: string;
  ngoName: string;
  incidentTitle: string;
  locality: string;
  needs: string;
  publishedAt?: string;
}

export interface OfferHelpInput {
  kind: HelpKind;
  details: string;
  area: string;
  /** The NGO need the citizen is responding to, if any. */
  needId?: string;
}

export interface HelpOffer extends OfferHelpInput {
  id: string;
  status: HelpOfferStatus;
  /** Set by the backend once matched. */
  matchedNgoName?: string;
  createdAt: string;
}
