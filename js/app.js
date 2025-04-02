// js/app.js
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the app
    initApp();
});

function initApp() {
    // Check if user is logged in
    const token = localStorage.getItem('jwt_token');
    
    // Render the appropriate view
    if (token && isTokenValid(token)) {
        renderProfilePage();
    } else {
        renderLoginPage();
    }
}

function isTokenValid(token) {
    try {
        const payload = parseJwt(token);
        const currentTime = Date.now() / 1000;
        
        // Check if token is expired
        if (payload.exp && payload.exp < currentTime) {
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
}

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

// Render the login page
function renderLoginPage() {
    const appContainer = document.getElementById('app-container');
    
    appContainer.innerHTML = `
        <div class="container">
            <div class="login-container">
                <h1>Login to Your Profile</h1>
                <div id="error-message" class="error-message"></div>
                
                <form id="login-form">
                    <div class="form-group">
                        <label for="identifier">Username or Email</label>
                        <input type="text" id="identifier" name="identifier" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" required>
                    </div>
                    
                    <button type="submit" class="btn-login">Login</button>
                </form>
            </div>
        </div>
    `;
    
    // Attach event listener to login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

// Handle login form submission
async function handleLogin(e) {
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
        const success = await authUser(identifier, password);
        if (success) {
            renderProfilePage();
        }
    } catch (error) {
        displayError(error.message || 'Login failed. Please check your credentials and try again.');
        console.error('Login error:', error);
    }
}

// Display error message
function displayError(message) {
    const errorMessage = document.getElementById('error-message');
    if (!errorMessage) return;
    
    if (message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
    } else {
        errorMessage.textContent = '';
        errorMessage.classList.remove('show');
    }
}