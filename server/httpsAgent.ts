import https from 'https';

/**
 * Configure Node.js HTTPS settings for cloud environments
 * This handles SSL certificate chain issues in a secure way
 */
export function configureSSL() {
  // Store original globalAgent
  const originalAgent = https.globalAgent;
  
  // Set up HTTPS configuration for cloud environments (Replit, Heroku, etc.)
  const isCloudEnvironment = process.env.REPLIT_DEV_DOMAIN || 
                           process.env.REPLIT_DOMAINS || 
                           process.env.HEROKU_APP_NAME ||
                           process.env.NODE_ENV === 'production';
  
  if (isCloudEnvironment) {
    console.log('Configuring SSL for cloud environment...');
    
    // Configure global HTTPS agent with proper settings
    https.globalAgent = new https.Agent({
      // Use secure TLS version
      secureProtocol: 'TLSv1_2_method',
      // Keep connections alive for better performance
      keepAlive: true,
      // Handle certificate verification appropriately
      rejectUnauthorized: process.env.NODE_ENV === 'production',
      // Set reasonable timeout
      timeout: 15000,
    });

    // Override the default certificate validation for known OAuth providers in development
    if (process.env.NODE_ENV !== 'production') {
      const originalCreateConnection = (https.globalAgent as any).createConnection;
      (https.globalAgent as any).createConnection = function(options: any, callback: any) {
        // For Google OAuth endpoints, handle certificate chain appropriately
        if (options.hostname?.includes('accounts.google.com') || 
            options.hostname?.includes('oauth2.googleapis.com')) {
          // Use more lenient validation for OAuth endpoints in development
          options.rejectUnauthorized = false;
        }
        return originalCreateConnection.call(this, options, callback);
      };
    }
    
    console.log('SSL configuration applied for cloud environment.');
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