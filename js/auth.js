// Configuration
const API_DOMAIN = 'learn.reboot01.com'; // Replace with your actual domain
const AUTH_ENDPOINT = `https://${API_DOMAIN}/api/auth/signin`;
const GRAPHQL_ENDPOINT = `https://${API_DOMAIN}/api/graphql-engine/v1/graphql`;

// Cookie utility functions
function setCookie(name, value, days, secure = true, sameSite = 'strict') {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    
    let cookieString = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/`;
    
    if (secure) {
        cookieString += '; Secure';
    }
    
    cookieString += `; SameSite=${sameSite}`;
    
    // Set HttpOnly in production environments through server headers
    document.cookie = cookieString;
    console.log(`Cookie "${name}" set with expiration in ${days} days`);
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(nameEQ) === 0) {
            try {
                // Try to decode using decodeURIComponent first 
                return decodeURIComponent(c.substring(nameEQ.length, c.length));
            } catch (e) {
                // If decoding fails, return the raw value
                console.warn('Failed to decode cookie value with decodeURIComponent, returning raw value');
                return c.substring(nameEQ.length, c.length);
            }
        }
    }
    return null;
}

function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    console.log(`Cookie "${name}" deleted`);
}

// DOM Elements
let loginForm = null;
let errorMessage = null;

// Initialize DOM elements when needed
function initDOMElements() {
    loginForm = document.getElementById('login-form');
    errorMessage = document.getElementById('error-message');
}

// Authenticate user function - updated to use cookies
async function authUser(identifier, password) {
    try {
        console.log('Authentication attempt for identifier:', identifier);
        
        // Base64 encode credentials
        const authString = `${identifier}:${password}`;
        const base64Credentials = btoa(authString);
        
        console.log('Making authentication request to:', AUTH_ENDPOINT);
        
        // Make request to authentication endpoint
        const response = await fetch(AUTH_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${base64Credentials}`,
                'Content-Type': 'application/json'
            }
        });
        
        // Log response status and headers
        console.log('Auth response status:', response.status);
        console.log('Auth response headers:', Object.fromEntries([...response.headers.entries()]));
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Auth error response:', errorText);
            try {
                const errorJson = JSON.parse(errorText);
                throw new Error(errorJson.message || `Authentication failed (${response.status})`);
            } catch (e) {
                throw new Error(`Authentication failed (${response.status}): ${errorText.slice(0, 100)}`);
            }
        }
        
        // For this API, we get the JWT directly as a string
        const jwtToken = await response.text();
        console.log('Auth response:', jwtToken);
        
        // Validate it's a JWT by checking the format (header.payload.signature)
        if (!jwtToken || jwtToken.split('.').length !== 3) {
            console.error('Invalid JWT token format received:', jwtToken);
            throw new Error('Invalid authentication token received');
        }
        
        console.log('JWT received successfully');
        
        // Store JWT token in a cookie (15 day expiration)
        // Note: For production, consider using HttpOnly cookies set by the server
        setCookie('jwt_token', jwtToken, 15);
        
        // Verify the token is valid by parsing it
        const payload = parseJwt(jwtToken);
        console.log('Parsed JWT payload:', payload);
        
        if (!payload || Object.keys(payload).length === 0) {
            throw new Error('Invalid token received');
        }
        
        return true;
    } catch (error) {
        console.error('Authentication error:', error);
        throw error;
    }
}

// Logout function
function logout() {
    console.log('Logging out, removing JWT token cookie');
    deleteCookie('jwt_token');
    // Reload the app to show login view
    initApp();
}

// Helper function to ensure JWT is properly formatted with base64url encoding
function ensureValidJWT(token) {
    if (!token) return null;
    
    try {
        // Basic trimming first
        token = token.trim();
        
        // Verify it has three parts
        const parts = token.split('.');
        if (parts.length !== 3) {
            console.error('JWT does not have three parts');
            return null;
        }
        
        // Clean and validate each part
        const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
        let needsCleaning = false;
        
        for (let i = 0; i < 3; i++) {
            if (!base64UrlRegex.test(parts[i])) {
                // Try to sanitize this part (remove any non-base64url chars)
                const originalPart = parts[i];
                parts[i] = parts[i].replace(/[^A-Za-z0-9_-]/g, '');
                needsCleaning = true;
            }
        }
        
        if (needsCleaning) {
            // Reassemble token after cleaning individual parts
            token = parts.join('.');
            console.log('JWT was repaired to ensure valid base64url format');
        }
        
        return token;
    } catch (e) {
        console.error('Error in ensureValidJWT:', e);
        return token; // Return the original token as a fallback
    }
}

// Get authentication token
function getAuthToken() {
    const token = getCookie('jwt_token');
    if (!token) {
        console.log('No token found in cookies');
        return null;
    }
    
    // Ensure the token is properly formatted
    const validToken = ensureValidJWT(token);
    
    return validToken || token; // Return valid token if available, otherwise original
}

// Get user ID from token - updated to use cookies
function getUserId() {
    const token = getCookie('jwt_token');
    if (token) {
        try {
            const payload = parseJwt(token);
            
            // Check standard JWT claim for subject (user ID)
            if (payload.sub) {
                console.log('Retrieved user ID from token sub claim:', payload.sub);
                return payload.sub;
            }
            
            // Fallback to checking userId property if present
            if (payload.userId) {
                console.log('Retrieved user ID from token userId claim:', payload.userId);
                return payload.userId;
            }
            
            console.error('No standard user ID found in token');
            return null;
        } catch (e) {
            console.error('Failed to get user ID from token:', e);
            return null;
        }
    }
    return null;
}

// Check if user is already logged in - updated to use cookies
function checkAuthState() {
    const token = getCookie('jwt_token');
    console.log('Checking auth state, token exists:', Boolean(token));
    
    if (!token) {
        return false;
    }
    
    // Verify token validity (check expiration)
    try {
        const payload = parseJwt(token);

        
        // Check if payload was parsed successfully
        if (!payload || Object.keys(payload).length === 0) {
            console.error('Invalid token format');
            logout();
            return false;
        }
        
        // Check token expiration
        const currentTime = Math.floor(Date.now() / 1000);

        
        if (payload.exp && payload.exp < currentTime) {
            console.log('Token expired');
            logout();
            return false;
        }
        
        // Verify we have a user ID in the token using standard claims
        const hasUserId = Boolean(payload.sub || payload.userId);
        

        
        if (!hasUserId) {
            console.error('Token missing user identity');
            logout();
            return false;
        }
        
        // Token is valid
        console.log('Token validation successful');
        return true;
    } catch (e) {
        console.error('Token validation error:', e);
        logout();
        return false;
    }
}

// Parse JWT to get payload data
function parseJwt(token) {
    try {
        // Ensure token is properly trimmed
        token = token.trim();
        
        // Check if token has the correct format (header.payload.signature)
        const parts = token.split('.');
        
        if (parts.length !== 3) {
            throw new Error('Invalid token format');
        }
        
        const base64Url = parts[1]; // Get the payload part
        
        // Handle base64url to base64 conversion with padding
        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        
        // Add padding if needed
        switch (base64.length % 4) {
            case 0:
                break; // No padding needed
            case 2:
                base64 += '==';
                break;
            case 3:
                base64 += '=';
                break;
            default:
                throw new Error('Invalid base64 string length');
        }
        
        try {
            const rawPayload = atob(base64);
            const jsonPayload = decodeURIComponent(
                Array.from(rawPayload).map(c => 
                    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
                ).join('')
            );
            
            const payload = JSON.parse(jsonPayload);
            console.log('Successfully parsed JWT payload');
            
            return payload;
        } catch (decodeError) {
            console.error('Error decoding JWT payload:', decodeError);
            
            // Last resort: Try to decode without transform for special cases
            try {
                const rawPayload = atob(base64);
                const payload = JSON.parse(rawPayload);
                console.log('Parsed JWT payload using fallback method');
                return payload;
            } catch (fallbackError) {
                console.error('Fallback parsing failed:', fallbackError);
                throw new Error('JWT payload decoding failed');
            }
        }
    } catch (e) {
        console.error('Error parsing JWT token:', e.message);
        return {};
    }
}

// Display error message
function displayError(message) {
    console.log('Display error message:', message || 'cleared error');
    
    if (!errorMessage) {
        errorMessage = document.getElementById('error-message');
        if (!errorMessage) return;
    }
    
    if (message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
    } else {
        errorMessage.textContent = '';
        errorMessage.classList.remove('show');
    }
}

// Manual token setting function for debugging purposes
function setManualToken(rawToken) {
    if (!rawToken || typeof rawToken !== 'string') {
        console.error('Invalid token provided');
        return false;
    }
    
    // Clean up the token
    rawToken = rawToken.trim();
    
    // Validate basic format
    const parts = rawToken.split('.');
    if (parts.length !== 3) {
        console.error('Token does not have three parts');
        return false;
    }
    
    // Store the clean token
    setCookie('jwt_token', rawToken, 15);
    console.log('Manual token set successfully');
    return true;
}

// Add event listeners after DOM content is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing auth components');
    // Initialize DOM elements
    initDOMElements();
    
    // Check auth state on page load and render appropriate view
    if (typeof initApp === 'function') {
        initApp();
    } else {
        console.error('initApp function not found');
    }
});

// Expose functions for use in other scripts
window.authHelpers = {
    getToken: getAuthToken,
    getUserId: getUserId,
    logout: logout,
    checkAuthState: checkAuthState,
    displayError: displayError,
    setManualToken: setManualToken // Add this line
};