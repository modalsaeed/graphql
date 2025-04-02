// js/app.js
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the app
    initApp();
});

function initApp() {
    // Check if user is logged in
    const isLoggedIn = window.authHelpers.checkAuthState();
    
    // Render the appropriate view
    if (isLoggedIn) {
        renderProfilePage();
    } else {
        renderLoginPage();
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
    window.authHelpers.displayError('');
    
    const identifier = document.getElementById('identifier').value;
    const password = document.getElementById('password').value;
    
    if (!identifier || !password) {
        window.authHelpers.displayError('Please enter both username/email and password');
        return;
    }
    
    try {
        const success = await authUser(identifier, password);
        if (success) {
            renderProfilePage();
        }
    } catch (error) {
        window.authHelpers.displayError(error.message || 'Login failed. Please check your credentials and try again.');
        console.error('Login error:', error);
    }
}

