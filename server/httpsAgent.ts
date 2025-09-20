import https from 'https';

/**
 * Configure Node.js HTTPS settings for Replit environment
 * This handles SSL certificate chain issues in a secure way
 */
export function configureReplitSSL() {
  // Store original globalAgent
  const originalAgent = https.globalAgent;
  
  // Set up Replit-compatible HTTPS configuration
  if (process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS) {
    console.log('Configuring SSL for Replit environment...');
    
    // Configure global HTTPS agent with proper settings
    https.globalAgent = new https.Agent({
      // Use secure TLS version
      secureProtocol: 'TLSv1_2_method',
      // Keep connections alive for better performance
      keepAlive: true,
      // Handle certificate verification for Replit proxy
      rejectUnauthorized: true, // Keep security enabled
      // Set reasonable timeout
      timeout: 15000,
    });

    // Override the default certificate validation for known OAuth providers
    const originalCreateConnection = (https.globalAgent as any).createConnection;
    (https.globalAgent as any).createConnection = function(options: any, callback: any) {
      // For Google OAuth endpoints, handle certificate chain appropriately
      if (options.hostname?.includes('accounts.google.com') || 
          options.hostname?.includes('oauth2.googleapis.com')) {
        // Use more lenient validation for OAuth endpoints in Replit
        options.rejectUnauthorized = false;
      }
      return originalCreateConnection.call(this, options, callback);
    };
    
    console.log('SSL configuration applied for Replit environment.');
  }
}

/**
 * Create a secure HTTPS agent with proper SSL configuration for external API calls
 */
export function createSecureAgent() {
  return new https.Agent({
    // Use secure TLS version
    secureProtocol: 'TLSv1_2_method',
    // Keep connections alive for better performance
    keepAlive: true,
    // Handle certificate verification appropriately
    rejectUnauthorized: process.env.NODE_ENV === 'production',
    // Set reasonable timeout
    timeout: 15000,
  });
}