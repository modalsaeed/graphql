// js/api.js
// GraphQL client for making API requests

// Make a GraphQL query
async function executeQuery(query, variables = {}) {
    let token = getAuthToken();
    
    if (!token) {
        throw new Error('Not authenticated');
    }

    try {
        // Ensure the token is properly formatted using the ensureValidJWT function
        token = ensureValidJWT(token);
        
        if (!token) {
            throw new Error('Invalid authentication token');
        }
        
        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                query,
                variables
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('GraphQL request failed:', errorText);
            
            // If unauthorized, try to clear token and redirect to login
            if (response.status === 401 || response.status === 403) {
                console.error('Authentication error, logging out');
                logout();
                location.reload();
                return;
            }
            
            throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.errors) {
            console.error('GraphQL errors:', data.errors);
            throw new Error(data.errors[0].message);
        }
        
        console.log('GraphQL response:', data.data);
        return data.data;
    } catch (error) {
        console.error('GraphQL query error:', error);
        throw error;
    }
}

async function fetchUserProfile() {
    const query = `
    query {
      user {
        id
        login
        attrs
        campus
      }
    }
    `;
    
    return executeQuery(query);
}

async function fetchUserTransactions(limit = 50, offset = 0) {
    ID = getUserId();
    if (!ID) {
        throw new Error('User ID not found');
    }

    const query = `query {
                        transaction (limit:${limit}, offset:${offset},where:{
                            _and:[{userId:{_eq:${ID}}}, {_not:{
                                _or:[
                                    {type:{_ilike:"%level%"}},
                                ]}
                        }
                        ]
                        }
                            ){
                            type
                            amount
                            objectId
                                object{
                                    name
                                }
                            userId
                            createdAt
                            path
                        }
                    }`;
    
    return executeQuery(query);
}

async function getAlltransactions() {
    const limit = 50;
    let offset = 0;
    let transactions = [];
    let hasMore = true; 
    while (hasMore) {
        const data = await fetchUserTransactions(limit, offset)

        if (data.transaction && data.transaction.length > 0) {
            transactions = transactions.concat(data.transaction);
            offset += limit;
        }else {
            hasMore = false; 
        }
    }

    console.log('All transactions:', transactions);
    return transactions;

}

async function fetchLevels(limit = 50, offset = 0) {
    ID = getUserId();
    if (!ID) {
        throw new Error('User ID not found');
    }

    const query = `query {
                        transaction (limit:${limit}, offset:${offset}, where:{
                            _and:[{userId:{_eq:${ID}}},{type:{_ilike:"%level%"}}]
                            }
                            ){
                            type
                            amount
                            objectId
                                object{
                                    name
                                }
                            userId
                            createdAt
                            path
                        }
                    }`;
    
    return executeQuery(query);
}

async function getAllLevels() {
    const limit = 50;
    let offset = 0;
    let levels = [];
    let hasMore = true; 
    while (hasMore) {
        const data = await fetchLevels(limit, offset)

        if (data.transaction && data.transaction.length > 0) {
            levels = levels.concat(data.transaction);
            offset += limit;
        }else {
            hasMore = false; 
        }
    }

    console.log('All levels:', levels);
    return levels;

}

async function fetchUserSkills(limit = 50, offset = 0) {
    ID = getUserId();
    if (!ID) {
        throw new Error('User ID not found');
    }

    const query = `query {
                        transaction (limit:${limit}, offset:${offset}, where:{
                            _and:[{userId:{_eq:${ID}}},{type:{_ilike:"%skill%"}}]
                            }
                            ){
                            type
                            amount
                            objectId
                                object{
                                    name
                                }
                            createdAt
                            path
                        }
                    }`;
    return executeQuery(query);
}

async function getAllSkills() {
    const limit = 50;
    let offset = 0;
    let skills = [];
    let hasMore = true; 
    while (hasMore) {
        const data = await fetchUserSkills(limit, offset)

        if (data.transaction && data.transaction.length > 0) {
            skills = skills.concat(data.transaction);
            offset += limit;
        }else {
            hasMore = false; 
        }
    }

    console.log('All skills:', skills);
    return skills;

}
