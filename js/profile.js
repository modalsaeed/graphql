// js/profile.js


// Handle rendering the profile page and loading user data

async function renderProfilePage() {
    const appContainer = document.getElementById('app-container');
    
    // Show loading state
    appContainer.innerHTML = `
        <div class="container">
            <div class="loading-container">
                <h2>Preparing Your Dashboard</h2>
                <div class="loading-spinner"></div>
                <p class="loading-message">Fetching your skills, progress, and achievements...</p>
            </div>
        </div>
    `;
    
    try {
        // Fetch user data in parallel
        const [basicInfo, progresses,xpTransactions, skillTransactions] = await Promise.all([
            fetchUserBasicInfo(),
            fetchUserProgresses(),
            fetchUserXpTransactions(),
            fetchUserSkillTransactions()
        ]);
        
        console.log('Basic Info:', basicInfo);
        console.log('Progresses:', progresses);
        console.log('XP Transactions:', xpTransactions);
        console.log('Skill Transactions:', skillTransactions);
        // Process data for display and charts
        const processedSkills = parseSkillTransactions(skillTransactions);
        console.log('Processed Skills:', processedSkills);
        const processedXp = parseXpTransactions(xpTransactions);
        console.log('Processed XP Transactions:', processedXp);
        const processedProgress = parseUserProgress(progresses);
        console.log('Processed Progresses:', processedProgress);

        function formatXp(xp) {
            if (xp >= 1000000) {
                // Show 3 significant digits for values ≥ 1MB
                const value = xp / 1000000;
                return value < 10 ? `${value.toFixed(2)}MB` : 
                       value < 100 ? `${value.toFixed(1)}MB` : 
                       `${Math.round(value)}MB`;
            } else if (xp >= 1000) {
                // Show 3 significant digits for values ≥ 1KB
                const value = xp / 1000;
                return value < 10 ? `${value.toFixed(2)}KB` : 
                       value < 100 ? `${value.toFixed(1)}KB` : 
                       `${Math.round(value)}KB`;
            } else {
                // For small values, show the exact number
                return xp.toString();
            }
        }
        
        // Render the profile page with the data
        appContainer.innerHTML = `
            <div class="profile-container">
                <header class="profile-header">
                    <div class="profile-info">
                        <h1>${basicInfo.user[0].login}</h1>
                        <p>${basicInfo.user[0].firstName} ${basicInfo.user[0].lastName}</p>
                    </div>
                    <div class="profile-controls">
                        <button id="btn-logout" class="btn-logout">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                </header>
                
                <div class="profile-content">
                    <section class="profile-section user-stats-section">
                        <h2>User Statistics</h2>
                        <div class="stats-grid">
                            <div class="info-card">
                                <h3>Audit Ratio</h3>
                                <div class="ratio-value">${(basicInfo.user[0].auditRatio).toFixed(2)}</div>
                                <div class="stat-description">Given vs Received</div>
                            </div>
                            <div class="info-card">
                                <h3>User ID</h3>
                                <div class="id-value">${basicInfo.user[0].id}</div>
                                <div class="stat-description">Unique Identifier</div>
                            </div>
                        </div>
                        <div id="auditRatio-graph" class="chart-container">
                            <!-- Audit ratio pie chart will be rendered here -->
                        </div>
                    </section>
                    
                    <section class="profile-section xp-section">
                        <h2>Experience Points</h2>
                        <div class="info-card highlight-card">
                            <h3>Total XP Earned</h3>
                            <div class="xp-value">${formatXp(processedXp.totals.module)}</div>
                            <div class="xp-growth-indicator">
                                <span class="growth-arrow">↗</span> Continuous Growth
                            </div>
                        </div>
                        <div id="xp-graph" class="chart-container">
                            <!-- XP chart will be rendered here -->
                        </div>
                    </section>
                    
                    <section class="profile-section skills-section">
                        <h2>Skills Mastery</h2>
                        <div class="info-card">
                            <h3>Skills Overview</h3>
                            <p>Click on any skill to view detailed progression</p>
                        </div>
                        <div id="skills-graph" class="chart-container">
                            <!-- Skills chart will be rendered here -->
                        </div>
                        <div id="skill-detail-graph" class="chart-container detail-container" style="display:none;">
                            <!-- Selected skill detail chart will appear here -->
                        </div>
                    </section>
                    
                    <section class="profile-section progress-section">
                        <h2>Progress Overview</h2>
                        <div id="progress-graph" class="chart-container">
                            <!-- Progress chart will be rendered here -->
                        </div>
                    </section>
                </div>
                
                <footer class="profile-footer">
                    <p>Last updated: ${new Date().toLocaleString()}</p>
                </footer>
            </div>
        `;
        
        // Add event listener to logout button
        document.getElementById('btn-logout').addEventListener('click', logout);
        
        // Render charts
        renderAuditRatioPieChart(basicInfo.user[0].totalUp, basicInfo.user[0].totalDown);
        renderSkillsBarChart(processedSkills.latest,processedSkills.history)
        renderXpLineChart(processedXp)
        renderProgressTable(processedProgress)

        
    } catch (error) {
        console.error('Error loading profile data:', error);
        
        // Show error state
        appContainer.innerHTML = `
            <div class="container">
                <div class="error-container">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="error-icon">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <h2>Unable to Load Profile</h2>
                    <p>${error.message || 'An unexpected error occurred while fetching your profile data'}</p>
                    <div class="error-actions">
                        <button id="btn-retry" class="btn-retry">Try Again</button>
                        <button id="btn-logout" class="btn-logout">Logout</button>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('btn-retry').addEventListener('click', renderProfilePage);
        document.getElementById('btn-logout').addEventListener('click', logout);
    }
}



