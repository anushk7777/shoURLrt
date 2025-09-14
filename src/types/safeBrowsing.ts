/**
 * TypeScript type definitions for Google Safe Browsing API v4
 * 
 * This file contains all the type definitions needed for interacting with
 * the Google Safe Browsing API, including request/response structures and
 * internal data models for threat detection.
 */

// Threat types that can be detected by the Safe Browsing API
export type ThreatType = 
  | 'MALWARE'
  | 'SOCIAL_ENGINEERING'
  | 'UNWANTED_SOFTWARE'
  | 'POTENTIALLY_UNWANTED_APPLICATION';

// Platform types for threat detection
export type PlatformType = 'ANY_PLATFORM' | 'WINDOWS' | 'LINUX' | 'OSX' | 'ANDROID' | 'IOS';

// Types of threat entries
export type ThreatEntryType = 'URL' | 'EXECUTABLE';

/**
 * Client information for API requests
 * Identifies the client making the request to Google Safe Browsing API
 */
export interface ClientInfo {
  /** Unique identifier for the client application */
  clientId: string;
  /** Version of the client application */
  clientVersion: string;
}

/**
 * Represents a single threat entry (URL) to be checked
 */
export interface ThreatEntry {
  /** The URL to be checked for threats */
  url: string;
}

/**
 * Threat information structure for API requests
 * Defines what types of threats to check for and on which platforms
 */
export interface ThreatInfo {
  /** Array of threat types to check for */
  threatTypes: ThreatType[];
  /** Array of platform types to check */
  platformTypes: PlatformType[];
  /** Array of threat entry types */
  threatEntryTypes: ThreatEntryType[];
  /** Array of URLs/entries to check */
  threatEntries: ThreatEntry[];
}

/**
 * Complete request structure for Google Safe Browsing API threatMatches:find endpoint
 */
export interface SafeBrowsingRequest {
  /** Client information */
  client: ClientInfo;
  /** Threat detection parameters and URLs to check */
  threatInfo: ThreatInfo;
}

/**
 * Represents a detected threat match from the API response
 */
export interface ThreatMatch {
  /** Type of threat detected */
  threatType: ThreatType;
  /** Platform where the threat was detected */
  platformType: PlatformType;
  /** Type of the threat entry */
  threatEntryType: ThreatEntryType;
  /** The threat entry that matched */
  threat: ThreatEntry;
  /** Additional metadata about the threat */
  threatEntryMetadata?: {
    /** Additional entries related to the threat */
    entries?: Array<{
      key: string;
      value: string;
    }>;
  };
  /** Cache duration for the threat information */
  cacheDuration?: string;
}

/**
 * Response structure from Google Safe Browsing API threatMatches:find endpoint
 */
export interface SafeBrowsingResponse {
  /** Array of detected threat matches. Empty if no threats found */
  matches?: ThreatMatch[];
}

/**
 * Internal data structure for processed threat detection results
 * Used within the application after parsing API responses
 */
export interface ThreatDetectionResult {
  /** The original URL that was checked */
  url: string;
  /** Whether any threats were detected */
  isSafe: boolean;
  /** Array of detected threats (empty if safe) */
  threats: Array<{
    /** Type of threat detected */
    type: ThreatType;
    /** Platform where threat was detected */
    platform: PlatformType;
    /** Human-readable description of the threat */
    description: string;
  }>;
  /** Timestamp when the check was performed */
  checkedAt: Date;
  /** Cache expiration time for this result */
  cacheExpiresAt?: Date;
}

/**
 * Configuration options for the Safe Browsing API client
 */
export interface SafeBrowsingConfig {
  /** Google Safe Browsing API key */
  apiKey: string;
  /** Client ID for API requests */
  clientId: string;
  /** Client version for API requests */
  clientVersion: string;
  /** Request timeout in milliseconds */
  timeoutMs?: number;
  /** Maximum number of URLs to check in a single request */
  maxUrlsPerRequest?: number;
}

/**
 * Error types that can occur during Safe Browsing API operations
 */
export class SafeBrowsingError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'SafeBrowsingError';
  }
}

/**
 * Rate limiting information for API requests
 */
export interface RateLimitInfo {
  /** Number of requests remaining in current window */
  remaining: number;
  /** Time when rate limit window resets */
  resetTime: Date;
  /** Total requests allowed per window */
  limit: number;
}

/**
 * Circuit breaker states for handling API failures
 */
export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * Circuit breaker configuration and state
 */
export interface CircuitBreakerInfo {
  /** Current state of the circuit breaker */
  state: CircuitBreakerState;
  /** Number of consecutive failures */
  failureCount: number;
  /** Timestamp of last failure */
  lastFailureTime?: Date;
  /** Timestamp when circuit breaker will attempt to close */
  nextAttemptTime?: Date;
}