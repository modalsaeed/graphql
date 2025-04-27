function parseSkillTransactions(skillTransactions) {
    if (!skillTransactions || !skillTransactions[0] || !skillTransactions[0].skills) {
        return { latest: [], history: {} };
    }

    const skills = skillTransactions[0].skills;
    const skillsMap = {};
    
    skills.forEach(skill => {
        const skillType = skill.type;
        const date = new Date(skill.createdAt);
        
        if (!skillsMap[skillType]) {
            skillsMap[skillType] = [];
        }
        
        skillsMap[skillType].push({
            amount: skill.amount,
            date: date,
            formattedDate: formatDate(date)
        });
    });
    
    Object.keys(skillsMap).forEach(skillType => {
        skillsMap[skillType].sort((a, b) => a.date - b.date);
    });
    
    const latestSkillValues = Object.keys(skillsMap).map(skillType => {
        const transactions = skillsMap[skillType];
        const latestTransaction = transactions[transactions.length - 1];
        
        return {
            name: formatSkillName(skillType),
            value: latestTransaction.amount,
            id: skillType
        };
    });
    
    latestSkillValues.sort((a, b) => b.value - a.value);
    
    const skillHistory = {};
    
    Object.keys(skillsMap).forEach(skillType => {
        skillHistory[skillType] = {
            name: formatSkillName(skillType),
            data: skillsMap[skillType].map(transaction => ({
                date: transaction.formattedDate,
                value: transaction.amount
            }))
        };
    });
    
    return {
        latest: latestSkillValues,
        history: skillHistory
    };
}

function parseXpTransactions(xpTransactions) {
    if (!xpTransactions || !xpTransactions[0] || !xpTransactions[0].transactions) {
        return { piscineGo: [], piscineJs: [], module: [] };
    }

    const transactions = xpTransactions[0].transactions;
    
    // Initialize data structures for each category
    const piscineGo = [];
    const piscineJs = [];
    const module = [];
    
    // Track cumulative XP for each category
    let cumulativePiscineGo = 0;
    let cumulativePiscineJs = 0;
    let cumulativeModule = 0;
    
    // Map to store transactions grouped by date for each category
    const piscineGoByDate = {};
    const piscineJsByDate = {};
    const moduleByDate = {};

    // Process each transaction
    transactions.forEach(transaction => {
        const path = transaction.path;
        const date = new Date(transaction.createdAt);
        const formattedDate = formatDate(date);
        const amount = transaction.amount;
        
        // Categorize transactions
        // Special case for specific path that needs to go to module
        if (path === '/bahrain/bh-module/piscine-js') {
            // Module - special case
            cumulativeModule += amount;
            
            if (!moduleByDate[formattedDate]) {
                moduleByDate[formattedDate] = { 
                    date: formattedDate, 
                    timestamp: date.getTime(),
                    amount: 0,
                    cumulative: 0,
                    transactions: [] // Track individual transactions
                };
            }
            
            // Add individual transaction
            moduleByDate[formattedDate].transactions.push({
                path: path,
                amount: amount,
                timestamp: date.getTime()
            });
            
            moduleByDate[formattedDate].amount += amount;
            moduleByDate[formattedDate].cumulative = cumulativeModule;
        }
        // Regular categorization
        else if (path.includes('bh-piscine')) {

            // Piscine GO
            cumulativePiscineGo += amount;
            
            if (!piscineGoByDate[formattedDate]) {
                piscineGoByDate[formattedDate] = { 
                    date: formattedDate, 
                    timestamp: date.getTime(),
                    amount: 0,
                    cumulative: 0,
                    transactions: [] // Track individual transactions
                };
            }
            
            // Add individual transaction
            piscineGoByDate[formattedDate].transactions.push({
                path: path,
                amount: amount,
                timestamp: date.getTime()
            });
            
            piscineGoByDate[formattedDate].amount += amount;
            piscineGoByDate[formattedDate].cumulative = cumulativePiscineGo;
            
        } else if (path.includes('piscine-js')) {

            // Piscine JS
            cumulativePiscineJs += amount;
            
            if (!piscineJsByDate[formattedDate]) {
                piscineJsByDate[formattedDate] = { 
                    date: formattedDate, 
                    timestamp: date.getTime(),
                    amount: 0,
                    cumulative: 0,
                    transactions: [] // Track individual transactions
                };
            }
            
            // Add individual transaction
            piscineJsByDate[formattedDate].transactions.push({
                path: path,
                amount: amount,
                timestamp: date.getTime()
            });
            
            piscineJsByDate[formattedDate].amount += amount;
            piscineJsByDate[formattedDate].cumulative = cumulativePiscineJs;
            
        } else if (path.includes('bh-module')) {

            // Module
            cumulativeModule += amount;
            
            if (!moduleByDate[formattedDate]) {
                moduleByDate[formattedDate] = { 
                    date: formattedDate, 
                    timestamp: date.getTime(),
                    amount: 0,
                    cumulative: 0,
                    transactions: [] // Track individual transactions
                };
            }
            
            // Add individual transaction
            moduleByDate[formattedDate].transactions.push({
                path: path,
                amount: amount,
                timestamp: date.getTime()
            });
            
            moduleByDate[formattedDate].amount += amount;
            moduleByDate[formattedDate].cumulative = cumulativeModule;
        }
    });

    // Convert date maps to arrays and sort by date
    for (const dateKey in piscineGoByDate) {
        piscineGo.push(piscineGoByDate[dateKey]);
    }
    
    for (const dateKey in piscineJsByDate) {
        piscineJs.push(piscineJsByDate[dateKey]);
    }
    
    for (const dateKey in moduleByDate) {
        module.push(moduleByDate[dateKey]);
    }
    
    // Sort each array by timestamp
    piscineGo.sort((a, b) => a.timestamp - b.timestamp);
    piscineJs.sort((a, b) => a.timestamp - b.timestamp);
    module.sort((a, b) => a.timestamp - b.timestamp);
    
    return {
        piscineGo,
        piscineJs,
        module,
        totals: {
            piscineGo: cumulativePiscineGo,
            piscineJs: cumulativePiscineJs,
            module: cumulativeModule,
        }
    };
}

function parseUserProgress(progressData) {
    if (!progressData || !progressData[0] || !progressData[0].progresses) {
        return {
            piscineGo: [],
            piscineJs: [],
            module: []
        };
    }

    const progresses = progressData[0].progresses;
    
    // Initialize category arrays
    const piscineGoItems = [];
    const piscineJsItems = [];
    const moduleItems = [];
    
    // Sort progress into categories
    progresses.forEach(item => {
        const path = item.path;
        const date = new Date(item.createdAt || item.updatedAt);
        
        const progressItem = {
            ...item,
            date: date,
            formattedDate: formatDate(date),
            isCompleted: item.grade > 0
        };
        
        if (path.includes('bh-piscine')) {
            piscineGoItems.push(progressItem);
        } else if (path.includes('piscine-js')) {
            piscineJsItems.push(progressItem);
        } else if (path.includes('bh-module')) {
            moduleItems.push(progressItem);
        }
    });
    
    // Sort each category by latest date
    piscineGoItems.sort((a, b) => b.date - a.date);
    piscineJsItems.sort((a, b) => b.date - a.date);
    moduleItems.sort((a, b) => b.date - a.date);
    
    return {
        piscineGo: piscineGoItems,
        piscineJs: piscineJsItems,
        module: moduleItems
    };
}

function formatSkillName(skillType) {
    if (!skillType) return '';
    
    const baseName = skillType.replace('skill_', '');
    
    if (baseName === 'js') return 'JavaScript';
    if (baseName === 'css') return 'CSS';
    if (baseName === 'html') return 'HTML';
    if (baseName === 'go') return 'Go';
    if (baseName === 'sql') return 'SQL';
    if (baseName === 'tcp') return 'TCP';
    if (baseName === 'sys-admin') return 'System Admin';
    if (baseName === 'back-end') return 'Back-End';
    if (baseName === 'front-end') return 'Front-End';
    if (baseName === 'algo') return 'Algorithms';
    if (baseName === 'prog') return 'Programming';
    if (baseName === 'unix') return 'Unix';
    if (baseName === 'docker') return 'Docker';
    if (baseName === 'game') return 'Game Development';
    
    return baseName.charAt(0).toUpperCase() + baseName.slice(1);
}

function formatDate(date) {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

window.parseSkillTransactions = parseSkillTransactions;
window.parseXpTransactions = parseXpTransactions;
window.parseUserProgress = parseUserProgress;
