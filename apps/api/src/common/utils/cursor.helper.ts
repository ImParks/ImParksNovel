/**
 * Cursor Helper
 *
 * Utilities for encoding/decoding cursor-based pagination.
 */

export class CursorHelper {
  /**
   * Encode an ID into a base64 cursor string.
   */
  static encode(id: string): string {
    return Buffer.from(id).toString('base64');
  }

  /**
   * Decode a cursor string back to ID.
   */
  static decode(cursor: string): string {
    try {
      return Buffer.from(cursor, 'base64').toString('utf8');
    } catch {
      return '';
    }
  }
}
