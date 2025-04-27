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
        if (path.includes('bh-piscine')) {
            // Piscine GO
            cumulativePiscineGo += amount;
            
            if (!piscineGoByDate[formattedDate]) {
                piscineGoByDate[formattedDate] = { 
                    date: formattedDate, 
                    timestamp: date.getTime(),
                    amount: 0,
                    cumulative: 0
                };
            }
            
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
                    cumulative: 0
                };
            }
            
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
                    cumulative: 0
                };
            }
            
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
            overall: cumulativePiscineGo + cumulativePiscineJs + cumulativeModule
        }
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

export { parseSkillTransactions, parseXpTransactions };