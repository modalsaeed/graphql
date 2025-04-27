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

        
        // Render the profile page with the data
        appContainer.innerHTML = `
            <div class="profile-container">
                <header class="profile-header">
                    <div class="profile-info">
                        <h1>Welcome, ${basicInfo.user[0].login}</h1>
                        <p>${basicInfo.user[0].firstName} ${basicInfo.user[0].lastName}</p>
                    </div>
                    <div class="profile-controls">
                        <button id="btn-logout" class="btn-logout">Logout</button>
                    </div>
                </header>
                
                <div class="profile-content">
                    <section class="profile-section">
                        <h2>User Statistics</h2>
                        <div class="stats-grid">
                            <div class="info-card">
                                <h3>Audit Ratio</h3>
                                <div class="ratio-value">${(basicInfo.user[0].auditRatio).toFixed(2)}</div>
                            </div>
                            <div class="info-card">
                                <h3>User ID</h3>
                                <div class="id-value">${basicInfo.user[0].id}</div>
                            </div>
                        </div>
                        <div id="auditRatio-graph" class="chart-container">
                            <!-- Audit ratio pie chart will be rendered here -->
                        </div>
                    </section>
                    
                    <section class="profile-section">
                        <h2>XP Overview</h2>
                        <div class="info-card">
                            <h3>Total XP Earned</h3>
                            <div class="xp-value">${processedXp.totals.module}</div>
                        </div>
                        <div id="xp-graph" class="chart-container">
                            <!-- XP chart will be rendered here -->
                        </div>
                    </section>
                    
                    <section class="profile-section">
                        <h2>Skills</h2>
                        <div class="info-card">
                            <h3>Skills Overview</h3>
                            <p>Click on a skill to see its progress over time</p>
                        </div>
                        <div id="skills-graph" class="chart-container">
                            <!-- Skills chart will be rendered here -->
                        </div>
                        <div id="skill-detail-graph" class="chart-container" style="display:none;">
                            <!-- Selected skill detail chart will appear here -->
                        </div>
                    </section>
                    
                    <section class="profile-section">
                        <h2>Progress Overview</h2>
                            <div id="progress-graph" class="chart-container">
                                <!-- Progress chart will be rendered here -->
                            </div>
                    </section>
                </div>
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



