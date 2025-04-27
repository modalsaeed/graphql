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

async function fetchUserBasicInfo() {
    const query = `
    query {
      user {
        id
        login
        firstName
        lastName
        totalUp
        totalDown
        auditRatio
      }
    }
    `;
    
    return executeQuery(query);
}

async function fetchUserProgresses() {
    const query = `
    query {
      user {
        progresses(order_by: {updatedAt: desc}) {
          path
          createdAt
          grade
          group {
            captainLogin
            auditors {
              auditorLogin
            }
          }
        }
      }
    }
    `;
    
    return executeQuery(query).then(data => data.user)
}

async function fetchUserXpTransactions() {
    const query = `
    query {
      user {
        transactions(
          where: {type: {_eq: "xp"}, eventId: {_is_null: false}}, 
          order_by: {createdAt: asc}
        ) {
          amount
          createdAt
          path
        }
      }
    }
    `;
    
    return executeQuery(query).then(data => data.user)
}

async function fetchUserSkillTransactions() {
    const query = `
    query {
      user {
        skills: transactions(
          where: {type: {_like: "%skill_%"}}, 
          order_by: {id: asc}
        ) {
          amount
          type
          createdAt
        }
      }
    }
    `;
    
    return executeQuery(query).then(data => data.user)
}