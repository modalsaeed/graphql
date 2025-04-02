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

// Authenticate user function
async function authUser(identifier, password) {
    // Determine if input is email or username
    const isEmail = identifier.includes('@');
    const authString = `${identifier}:${password}`;
    
    // Base64 encode credentials
    const base64Credentials = btoa(authString);
    
    // Make request to authentication endpoint
    const response = await fetch(AUTH_ENDPOINT, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${base64Credentials}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Authentication failed');
    }
    
    const data = await response.json();
    
    // Store JWT token
    localStorage.setItem('jwt_token', data.jwt);
    return true;
}

// Logout function
function logout() {
    localStorage.removeItem('jwt_token');
    // Reload the app to show login view
    initApp();
}

// Get authentication token
function getAuthToken() {
    return localStorage.getItem('jwt_token');
}

// Get user ID from token
function getUserId() {
    const token = localStorage.getItem('jwt_token');
    if (token) {
        try {
            const payload = parseJwt(token);
            return payload.userId || payload.sub || null;
        } catch (e) {
            return null;
        }
    }
    return null;
}

// Check if user is already logged in
function checkAuthState() {
    const token = localStorage.getItem('jwt_token');
    
    if (token) {
        // Verify token validity (check expiration)
        try {
            const payload = parseJwt(token);
            const currentTime = Date.now() / 1000;
            
            // If token is expired, clear it and show login
            if (payload.exp && payload.exp < currentTime) {
                logout();
                return false;
            }
            
            // Token is valid
            return true;
        } catch (e) {
            logout();
            return false;
        }
    }
    
    // No token found
    return false;
}

// Parse JWT to get payload data
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Error parsing JWT token', e);
        return {};
    }
}

// Display error message
function displayError(message) {
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
    displayError: displayError
};