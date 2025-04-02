// Configuration
const API_DOMAIN = 'learn.reboot01.com'; // Replace with your actual domain
const AUTH_ENDPOINT = `https://${API_DOMAIN}/api/auth/signin`;
const GRAPHQL_ENDPOINT = `https://${API_DOMAIN}/api/graphql-engine/v1/graphql`;

// DOM Elements
let loginForm = null;
let errorMessage = null;

// Initialize DOM elements when needed
function initDOMElements() {
    loginForm = document.getElementById('login-form');
    errorMessage = document.getElementById('error-message');
}

// Authenticate user function - updated for response format
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
        console.log('Auth response (first 50 chars):', jwtToken.substring(0, 50) + '...');
        
        // Validate it's a JWT by checking the format (header.payload.signature)
        if (!jwtToken || jwtToken.split('.').length !== 3) {
            console.error('Invalid JWT token format received:', jwtToken);
            throw new Error('Invalid authentication token received');
        }
        
        console.log('JWT received successfully');
        
        // Store JWT token
        localStorage.setItem('jwt_token', jwtToken);
        
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
    console.log('Logging out, removing JWT token');
    localStorage.removeItem('jwt_token');
    // Reload the app to show login view
    initApp();
}

// Get authentication token
function getAuthToken() {
    const token = localStorage.getItem('jwt_token');
    console.log('Retrieved token (truncated):', token ? `${token.substring(0, 20)}...` : 'No token found');
    return token;
}

// Get user ID from token - updated to use standard JWT claims
function getUserId() {
    const token = localStorage.getItem('jwt_token');
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

// Check if user is already logged in - updated to use standard JWT
function checkAuthState() {
    const token = localStorage.getItem('jwt_token');
    console.log('Checking auth state, token exists:', Boolean(token));
    
    if (!token) {
        return false;
    }
    
    // Verify token validity (check expiration)
    try {
        const payload = parseJwt(token);
        console.log('Token payload for validation:', payload);
        
        // Check if payload was parsed successfully
        if (!payload || Object.keys(payload).length === 0) {
            console.error('Invalid token format');
            logout();
            return false;
        }
        
        // Check token expiration
        const currentTime = Math.floor(Date.now() / 1000);
        console.log('Token expiration check:', {
            currentTime: currentTime,
            tokenExpiration: payload.exp,
            isExpired: payload.exp && payload.exp < currentTime
        });
        
        if (payload.exp && payload.exp < currentTime) {
            console.log('Token expired');
            logout();
            return false;
        }
        
        // Verify we have a user ID in the token using standard claims
        const hasUserId = Boolean(payload.sub || payload.userId);
        
        console.log('User identity check:', {
            hasStandardUserId: hasUserId
        });
        
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
        // Check if token has the correct format (header.payload.signature)
        const parts = token.split('.');
        
        if (parts.length !== 3) {
            throw new Error('Invalid token format');
        }
        
        const base64Url = parts[1]; // Get the payload part
        
        // RFC 7515 compliant base64 url decode
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const rawPayload = atob(base64);
        const jsonPayload = decodeURIComponent(
            Array.from(rawPayload).map(c => 
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join('')
        );
        
        const payload = JSON.parse(jsonPayload);
        console.log('Successfully parsed JWT payload');
        
        return payload;
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
};