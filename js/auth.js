// Configuration
const API_DOMAIN = 'learn.reboot01.com'; // Replace with your actual domain
const AUTH_ENDPOINT = `https://${API_DOMAIN}/api/auth/signin`;
const GRAPHQL_ENDPOINT = `https://${API_DOMAIN}/api/graphql-engine/v1/graphql`;

// DOM Elements
const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');

// Check if user is already logged in
function checkAuthState() {
    const token = localStorage.getItem('jwt_token');
    
    if (token) {
        // Verify token validity (you could check expiration)
        try {
            const payload = parseJwt(token);
            const currentTime = Date.now() / 1000;
            
            // If token is expired, clear it and show login
            if (payload.exp && payload.exp < currentTime) {
                logout();
                return;
            }
            
            // If valid token exists and we're on login page, redirect to profile
            if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
                window.location.href = 'profile.html';
            }
        } catch (e) {
            logout();
        }
    } else {
        // No token, ensure we're on login page
        if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
            window.location.href = 'index.html';
        }
    }
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

// Handle login form submission
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Clear previous error messages
        displayError('');
        
        const identifier = document.getElementById('identifier').value;
        const password = document.getElementById('password').value;
        
        if (!identifier || !password) {
            displayError('Please enter both username/email and password');
            return;
        }
        
        try {
            // Determine if input is email or username
            const isEmail = identifier.includes('@');
            const authString = isEmail 
                ? `${identifier}:${password}`
                : `${identifier}:${password}`;
            
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
            
            // Redirect to profile page
            window.location.href = 'profile.html';
            
        } catch (error) {
            displayError(error.message || 'Login failed. Please check your credentials and try again.');
            console.error('Login error:', error);
        }
    });
}

// Logout functionality
function logout() {
    localStorage.removeItem('jwt_token');
    window.location.href = 'index.html';
}

// Add logout handler to any logout buttons on the page
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Check auth state on page load
    checkAuthState();
});

// Display error message
function displayError(message) {
    if (!errorMessage) return;
    
    if (message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
    } else {
        errorMessage.textContent = '';
        errorMessage.classList.remove('show');
    }
}

// Expose functions for use in other scripts
window.authHelpers = {
    getToken: () => localStorage.getItem('jwt_token'),
    getUserId: () => {
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
    },
    logout: logout
};