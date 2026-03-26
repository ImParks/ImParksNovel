/**
 * Payment Port
 *
 * Cross-domain communication interface for Payment domain.
 * This port defines contracts for other domains (Novel, User) to use payment services.
 */

export interface PaymentPort {
  /**
   * Check if a user has access to an episode (purchase/rental or free).
   * Used by: Novel domain
   */
  hasEpisodeAccess(userId: string, episodeId: string): Promise<boolean>;

  /**
   * Check if a novel has any purchases (to prevent author from reading their own paid chapters).
   * Used by: Novel domain
   */
  hasNovelPurchases(novelId: string): Promise<boolean>;
}

export const PAYMENT_PORT = Symbol('PAYMENT_PORT');
