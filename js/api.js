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
        
        return data.data;
    } catch (error) {
        console.error('GraphQL query error:', error);
        throw error;
    }
}

async function fetchUserProfile() {
    const query = `
    query GetUserProfile {
      user {
        id
        login
        profile {
          firstName
          lastName
          email
        }
        campus
        attrs
      }
    }
    `;
    
    return executeQuery(query);
}

