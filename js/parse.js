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

export { parseSkillTransactions };