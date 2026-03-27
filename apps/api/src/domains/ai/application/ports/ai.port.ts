/**
 * AI Application Ports (Coordination/Cross-Domain)
 *
 * These ports define outbound contracts for AI domain to other domains
 * or services. They are used by AiService and AiOrchestrator to
 * communicate with other parts of the system.
 */

// TODO: Define cross-domain communication ports
// Examples:
// - NotificationPort (for notifying users of generation completion)
// - PaymentPort (for token charge coordination)
// - NovelPort (for accessing novel context)

export const AI_PORT = Symbol('AI_PORT');
