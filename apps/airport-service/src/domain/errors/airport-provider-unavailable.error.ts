/**
 * Raised when the external airport data source cannot be reached
 * (network failure, timeout, or the circuit breaker is open).
 */
export class AirportProviderUnavailableError extends Error {
  constructor(message = 'Airport data provider is currently unavailable') {
    super(message);
    this.name = 'AirportProviderUnavailableError';
  }
}
