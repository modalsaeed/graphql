// js/profile.js
// Handle rendering the profile page and loading user data

async function renderProfilePage() {
    const appContainer = document.getElementById('app-container');
    
    // Show loading state
    appContainer.innerHTML = `
        <div class="container">
            <div class="loading-container">
                <h2>Loading your profile data...</h2>
                <div class="loading-spinner"></div>
            </div>
        </div>
    `;
    
    try {
        // Fetch user data in parallel
        const [userProfile, userXP, userProgress, userResults] = await Promise.all([
            fetchUserProfile(),
            fetchUserXP(),
            fetchUserProgress(),
            fetchUserResults()
        ]);
        
        // Process data for display and charts
        const totalXP = calculateTotalXP(userXP);
        const progressStats = processProgressData(userProgress);
        const resultStats = processResultData(userResults);
        
        // Render the profile page with the data
        appContainer.innerHTML = `
            <div class="profile-container">
                <header class="profile-header">
                    <div class="profile-info">
                        <h1>Welcome, ${userProfile.user[0].login}</h1>
                        <p>User ID: ${userProfile.user[0].id}</p>
                    </div>
                    <div class="profile-controls">
                        <button id="btn-logout" class="btn-logout">Logout</button>
                    </div>
                </header>
                
                <div class="profile-content">
                    <section class="profile-section">
                        <h2>XP Overview</h2>
                        <div class="info-card">
                            <h3>Total XP Earned</h3>
                            <div class="xp-value">${totalXP.toLocaleString()}</div>
                        </div>
                        <div id="xp-chart" class="chart-container">
                            <!-- XP chart will be rendered here -->
                        </div>
                    </section>
                    
                    <section class="profile-section">
                        <h2>Progress Overview</h2>
                        <div class="info-card">
                            <h3>Completion Rate</h3>
                            <div class="progress-value">${progressStats.completionRate}%</div>
                        </div>
                        <div id="progress-chart" class="chart-container">
                            <!-- Progress chart will be rendered here -->
                        </div>
                    </section>
                    
                    <section class="profile-section">
                        <h2>Results</h2>
                        <div class="info-card">
                            <h3>Success Rate</h3>
                            <div class="success-value">${resultStats.successRate}%</div>
                        </div>
                        <div id="results-chart" class="chart-container">
                            <!-- Results chart will be rendered here -->
                        </div>
                    </section>
                </div>
            </div>
        `;
        
        // Add event listener to logout button
        document.getElementById('btn-logout').addEventListener('click', logout);
        
        // Render charts
        renderXPChart('xp-chart', userXP);
        renderProgressChart('progress-chart', userProgress);
        renderResultsChart('results-chart', userResults);
        
    } catch (error) {
        console.error('Error loading profile data:', error);
        
        // Show error state
        appContainer.innerHTML = `
            <div class="container">
                <div class="error-container">
                    <h2>Error Loading Profile</h2>
                    <p>${error.message || 'An unexpected error occurred'}</p>
                    <button id="btn-retry" class="btn-retry">Retry</button>
                    <button id="btn-logout" class="btn-logout">Logout</button>
                </div>
            </div>
        `;
        
        document.getElementById('btn-retry').addEventListener('click', renderProfilePage);
        document.getElementById('btn-logout').addEventListener('click', logout);
    }
}

// Helper functions for data processing

function calculateTotalXP(xpData) {
    if (!xpData || !xpData.transaction) return 0;
    
    return xpData.transaction.reduce((total, tx) => {
        return total + (tx.amount || 0);
    }, 0);
}

function processProgressData(progressData) {
    if (!progressData || !progressData.progress || !progressData.progress.length) {
        return { completionRate: 0, totalItems: 0, completedItems: 0 };
    }
    
    const totalItems = progressData.progress.length;
    const completedItems = progressData.progress.filter(item => item.grade > 0).length;
    const completionRate = Math.round((completedItems / totalItems) * 100);
    
    return { completionRate, totalItems, completedItems };
}

function processResultData(resultData) {
    if (!resultData || !resultData.result || !resultData.result.length) {
        return { successRate: 0, totalItems: 0, passedItems: 0 };
    }
    
    const totalItems = resultData.result.length;
    const passedItems = resultData.result.filter(item => item.grade > 0).length;
    const successRate = Math.round((passedItems / totalItems) * 100);
    
    return { successRate, totalItems, passedItems };
}