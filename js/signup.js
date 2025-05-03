document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const signupMessage = document.getElementById('signup-message');

    // Apply specific body class if needed (reusing login style)
    document.body.classList.add('login-body');

    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission
            
            const username = usernameInput.value;
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            const selectedRole = document.querySelector('input[name="role"]:checked').value; // Get selected role
            const signupButton = signupForm.querySelector('button[type="submit"]');

            // Basic client-side validation
            if (!username || !password || !confirmPassword) {
                showMessage('Please fill in all fields.', true);
                return;
            }
            if (password.length < 6) {
                showMessage('Password must be at least 6 characters long.', true);
                return;
            }
            if (password !== confirmPassword) {
                showMessage('Passwords do not match.', true);
                return;
            }

            // Disable button during request
            signupButton.disabled = true;
            signupButton.textContent = 'Signing up...';
            showMessage(''); // Clear previous messages

            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password, role: selectedRole })
                });

                const data = await response.json();

                if (!response.ok) {
                    // Use error message from backend if available
                    throw new Error(data.message || `HTTP error! status: ${response.status}`);
                }

                // --- Signup Successful --- 
                showMessage('Signup successful! You can now log in.');
                signupForm.reset(); // Clear the form
                // Optionally redirect to login page after a delay
                setTimeout(() => {
                    window.location.href = 'login.html'; 
                }, 2000); // Redirect after 2 seconds

            } catch (error) {
                console.error('Signup failed:', error);
                showMessage(error.message || 'Signup failed. Please try again.', true);
                // Re-enable button on failure
                signupButton.disabled = false;
                signupButton.textContent = 'Sign Up';
            }
        });
    }

    function showMessage(message, isError = false) {
        signupMessage.textContent = message;
        signupMessage.className = isError ? 'message error' : 'message success';
        signupMessage.style.display = message ? 'block' : 'none';
    }
}); 