/**
 * Offers — fixture-backed stand-in for citizen help offers (mock mode only).
 * Nothing is sent; offers live in memory and stay 'SUBMITTED' because only
 * the backend can match them to an NGO.
 */
import { getCurrentCitizen } from '@/services/accounts-api';
import { fetchPublishedContributions } from '@/services/ngo-api';
import { HelpOffer, NgoNeed, OfferHelpInput } from '@/types/offers';

let offers: HelpOffer[] = [];

export async function fetchNgoNeeds(): Promise<NgoNeed[]> {
  const published = await fetchPublishedContributions();
  return published
    .filter((c) => c.needs?.trim())
    .map((c) => ({
      id: c.id,
      ngoName: c.ngoName,
      incidentTitle: c.eventTitle,
      locality: c.locality,
      needs: c.needs!,
      publishedAt: c.publishedAt,
    }));
}

export async function offerHelp(input: OfferHelpInput): Promise<HelpOffer> {
  if (!getCurrentCitizen()) throw new Error('Sign in to offer help.');
  const offer: HelpOffer = {
    ...input,
    id: `sample-offer-${offers.length + 1}`,
    status: 'SUBMITTED',
    createdAt: new Date().toISOString(),
  };
  offers = [offer, ...offers];
  return { ...offer };
}

export async function fetchMyOffers(): Promise<HelpOffer[]> {
  if (!getCurrentCitizen()) return [];
  return offers.map((o) => ({ ...o }));
}
