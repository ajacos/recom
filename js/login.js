// Simple JWT Decoder (doesn't verify signature, only decodes payload)
function decodeJwtPayload(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Error decoding JWT payload:", e);
        return null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginMessage = document.getElementById('login-message');

    // Check if already logged in
    const existingToken = localStorage.getItem('recom_admin_token');
    if (existingToken) {
        // Try to decode token to decide initial redirect (no verification here)
        const payload = decodeJwtPayload(existingToken);
        if (payload && payload.role) {
            if (payload.role === 'admin' || payload.role === 'seller') {
                 console.log('Existing token found (Admin/Seller), redirecting to admin...');
                 window.location.href = 'admin.html';
            } else {
                console.log('Existing token found (Customer), redirecting to home...');
                window.location.href = 'index.html';
            }
        } else {
             console.log('Existing but undecodable token found, clearing and staying on login.');
             localStorage.removeItem('recom_admin_token'); // Clear invalid token
        }
        return; // Prevent form listener setup if redirecting
    }

    // Add class to body for specific login page styling
    document.body.classList.add('login-body');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission
            
            const username = usernameInput.value;
            const password = passwordInput.value;
            const loginButton = loginForm.querySelector('button[type="submit"]');

            // Basic validation
            if (!username || !password) {
                showMessage('Please enter both username and password.', true);
                return;
            }

            // Disable button during request
            loginButton.disabled = true;
            loginButton.textContent = 'Logging in...';
            showMessage(''); // Clear previous messages

            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (!response.ok) {
                    // Use error message from backend if available
                    throw new Error(data.message || `HTTP error! status: ${response.status}`);
                }

                // --- Login Successful --- 
                if (data.token) {
                    // Store the token in localStorage
                    localStorage.setItem('recom_admin_token', data.token);

                    // Decode token to get role
                    const payload = decodeJwtPayload(data.token);
                    let redirectUrl = 'index.html'; // Default redirect for customers

                    if (payload && (payload.role === 'admin' || payload.role === 'seller')) {
                        redirectUrl = 'admin.html'; // Redirect admin/seller to admin page
                    }
                    
                    showMessage(`Login successful! Redirecting...`);
                    
                    // Redirect based on role after a short delay
                    setTimeout(() => {
                        window.location.href = redirectUrl; 
                    }, 1000);

                } else {
                     throw new Error('Login failed: No token received.');
                }

            } catch (error) {
                console.error('Login failed:', error);
                showMessage(error.message || 'Login failed. Please check credentials and try again.', true);
                // Re-enable button on failure
                loginButton.disabled = false;
                loginButton.textContent = 'Login';
            }
        });
    }

    function showMessage(message, isError = false) {
        loginMessage.textContent = message;
        loginMessage.className = isError ? 'message error' : 'message success';
        loginMessage.style.display = message ? 'block' : 'none';
    }
}); 