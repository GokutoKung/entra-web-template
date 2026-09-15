import {
  type Configuration,
  LogLevel,
  PublicClientApplication,
} from '@azure/msal-browser';
import type { AuthConfig } from './config';

// Public / PKCE client (no secret). Caller must await instance.initialize().
export function createMsalInstance(
  config: AuthConfig,
): PublicClientApplication {
  const msalConfig: Configuration = {
    auth: {
      clientId: config.clientId,
      authority: `https://${config.authorityHost}/${config.tenantId}`,
      redirectUri: config.redirectUri,
      postLogoutRedirectUri: config.postLogoutRedirectUri,
      navigateToLoginRequestUrl: true,
    },
    cache: {
      // sessionStorage: tokens scoped to the tab, cleared on close.
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: false,
    },
    system: {
      loggerOptions: {
        logLevel: LogLevel.Warning,
        piiLoggingEnabled: false,
        loggerCallback: (level, message, containsPii) => {
          if (containsPii) return;
          if (level === LogLevel.Error) console.error(message);
          else if (level === LogLevel.Warning) console.warn(message);
        },
      },
    },
  };

  return new PublicClientApplication(msalConfig);
}
