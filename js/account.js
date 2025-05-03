// Simple JWT Decoder (reuse from login.js - consider moving to a shared utility file later)
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
    const usernameSpan = document.getElementById('account-username');
    const roleSpan = document.getElementById('account-role');
    const passwordForm = document.getElementById('password-change-form');
    const accountMessage = document.getElementById('account-message');
    const logoutButton = document.getElementById('account-logout-btn');
    const profilePictureDisplay = document.getElementById('profile-picture-display');
    const profilePictureInput = document.getElementById('profile-picture-input');
    const uploadPictureBtn = document.getElementById('upload-picture-btn');
    const cropperModal = document.getElementById('cropper-modal');
    const imageToCrop = document.getElementById('image-to-crop');
    const cropImageBtn = document.getElementById('crop-image-btn');
    const cancelCropBtn = document.getElementById('cancel-crop-btn');
    const closeModalBtn = document.querySelector('.close-modal-btn');
    const passwordMessage = document.getElementById('password-message');
    const profileMessage = document.getElementById('profile-message');

    let cropper = null;
    let croppedImageBlob = null; // Variable to store the cropped blob

    // --- Authentication Check --- 
    const token = localStorage.getItem('recom_admin_token');
    if (!token) {
        // No token found, redirect to login
        window.location.href = 'login.html';
        return; // Stop script execution
    }

    // Decode token to get user info
    const payload = decodeJwtPayload(token);
    let userId = null;

    if (payload) {
        userId = payload.userId; // Store user ID for potential API calls
        console.log("Decoded JWT Payload:", payload);

        if (usernameSpan) usernameSpan.textContent = payload.username || 'Not found';
        if (roleSpan) roleSpan.textContent = payload.role ? (payload.role.charAt(0).toUpperCase() + payload.role.slice(1)) : 'Not found';

        // --- Display Profile Picture from Token --- 
        if (payload.profilePicture && profilePictureDisplay) {
             // Define the specific base URL for profile pictures
            const PROFILE_PIC_BASE_URL = 'https://roadwise-qa.com/aaron/recom/public'; // Adjusted to base public folder
            let imageUrl = '';

             if (payload.profilePicture.startsWith('http')) { 
                 // If it's already an absolute URL, use it directly
                 imageUrl = payload.profilePicture; 
             } else if (payload.profilePicture.startsWith('/')) {
                 // If it's a relative path (like /uploads/profile_pictures/...), construct the full URL
                imageUrl = PROFILE_PIC_BASE_URL + payload.profilePicture;
            } else {
                 // Fallback or handle unexpected format - maybe default?
                 console.warn("Unexpected profile picture format in token:", payload.profilePicture);
                 imageUrl = PROFILE_PIC_BASE_URL + '/images/default-avatar.png'; // Use default from specified base
             }

            console.log("Constructed Image URL:", imageUrl); // <-- Log the constructed URL
            profilePictureDisplay.src = imageUrl;
        } else if (profilePictureDisplay) {
             // This block runs if payload.profilePicture is MISSING from the token
             console.log("Profile picture not found in token payload, using default."); // <-- LOG 3: Added for clarity
             // Fallback to default if not in token
             // Define the specific base URL for profile pictures
             const PROFILE_PIC_BASE_URL = 'https://roadwise-qa.com/aaron/recom/public';
             profilePictureDisplay.src = PROFILE_PIC_BASE_URL + '/images/default-avatar.png'; 
        }
        // --- End Display Profile Picture ---

    } else {
        // Invalid token? Redirect to login
        console.error('Invalid token found.');
        localStorage.removeItem('recom_admin_token');
        window.location.href = 'login.html';
        return;
    }

    // --- Message Helper ---
    function showMessage(message, isError = false, type = 'profile') {
        const messageElement = type === 'password' ? passwordMessage : profileMessage;
        if (!messageElement) return;
        messageElement.textContent = message;
        messageElement.className = isError ? 'message error' : 'message success';
        messageElement.style.display = message ? 'block' : 'none';
        if (!isError) {
             setTimeout(() => { messageElement.style.display = 'none'; }, 3000); // Auto-hide success messages
        }
    }

    // --- Modal Helper Functions ---
    function openModal() {
        if (cropperModal) cropperModal.style.display = 'block';
    }
    function closeModal() {
        if (cropperModal) cropperModal.style.display = 'none';
        if (cropper) {
            cropper.destroy(); // Destroy cropper instance
            cropper = null;
        }
        // Reset file input to allow selecting the same file again if needed
        if (profilePictureInput) profilePictureInput.value = '';
    }

    // --- Profile Picture Input Handler (Initialize Cropper) ---
    if (profilePictureInput && imageToCrop && cropperModal) {
        profilePictureInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imageToCrop.src = e.target.result;
                    
                    // Ensure previous instance is destroyed
                    if (cropper) {
                        cropper.destroy();
                    }

                    // Initialize Cropper.js
                    cropper = new Cropper(imageToCrop, {
                        aspectRatio: 1 / 1, // Square aspect ratio
                        viewMode: 1, // Restrict crop box to canvas
                        background: false, // Optional: hide grid background
                        // autoCropArea: 0.8, // Optional: initial crop area size
                        // Other options: https://github.com/fengyuanchen/cropperjs#options
                    });
                    openModal(); // Open the modal with the image ready to crop
                }
                reader.readAsDataURL(file);
            } else {
                showMessage('Please select a valid image file.', true, 'profile');
                 profilePictureInput.value = ''; // Reset input
            }
        });
    }

    // --- Modal Button Handlers ---
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelCropBtn) cancelCropBtn.addEventListener('click', closeModal);

    if (cropImageBtn && profilePictureDisplay && uploadPictureBtn) {
        cropImageBtn.addEventListener('click', () => {
            console.log("Crop button clicked"); // Log 1
            if (!cropper) {
                console.error("Cropper instance not found!");
                return;
            }

            // Get the cropped canvas
            console.log("Getting cropped canvas..."); // Log 2
            const canvas = cropper.getCroppedCanvas({
                width: 256, 
                height: 256,
            });
            console.log("Canvas object:", canvas); // Log 3

            // Convert canvas to Blob
            canvas.toBlob((blob) => {
                console.log("Inside toBlob callback. Blob:", blob); // Log 4
                if (blob) {
                    croppedImageBlob = blob; // Store the blob
                    profilePictureDisplay.src = URL.createObjectURL(blob);
                    console.log("Attempting to show upload button..."); // Log 5
                    uploadPictureBtn.style.display = 'block'; // Show the upload button
                    showMessage('Profile picture updated successfully!', false, 'profile');
                } else {
                     console.error("Blob creation failed!"); // Log 6
                     showMessage('Could not crop image.', true, 'profile');
                }
                closeModal();
            }, 'image/png'); 
        });
    }

    // --- Profile Picture Upload Button Handler (Upload Cropped Blob) ---
    if (uploadPictureBtn) {
        uploadPictureBtn.addEventListener('click', async () => {
            showMessage('', false, 'profile'); 
            
            // Use the stored croppedImageBlob instead of the input file
            if (!croppedImageBlob) {
                showMessage('No cropped image data found. Please select and crop an image first.', true, 'profile');
                return;
            }

            uploadPictureBtn.disabled = true;
            uploadPictureBtn.textContent = 'Uploading...';

            const formData = new FormData();
            // Append the blob with a filename
            formData.append('profileImage', croppedImageBlob, `profile-${userId}.png`); 
            // No need to append userId separately unless backend requires it differently now
            // formData.append('userId', userId); 

            try {
                const response = await fetch(`${API_BASE_URL}/api/users/profile-picture`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || `HTTP error! status: ${response.status}`);
                }
                showMessage('Profile picture updated successfully!', false, 'profile');

                // Update display with final URL from server (safer than relying on local blob URL)
                if (data.newImageUrl && profilePictureDisplay) {
                    const PROFILE_PIC_BASE_URL = 'https://roadwise-qa.com/aaron/recom/public'; 
                    const imageUrl = data.newImageUrl.startsWith('http') 
                                    ? data.newImageUrl 
                                    : PROFILE_PIC_BASE_URL + data.newImageUrl;
                    profilePictureDisplay.src = imageUrl;
                }

                 // Update token in Local Storage
                if (data.newToken) {
                    console.log("Received new token, updating localStorage...");
                    localStorage.setItem('recom_admin_token', data.newToken);
                } else {
                    console.warn("Did not receive a new token in the response.");
                }

                uploadPictureBtn.style.display = 'none';
                croppedImageBlob = null; // Clear blob after successful upload
            
            } catch (error) {
                console.error('Profile picture upload failed:', error);
                showMessage(error.message || 'Failed to upload profile picture.', true, 'profile');
            } finally {
                 uploadPictureBtn.disabled = false;
                 uploadPictureBtn.textContent = 'Upload New Picture';
            }
        });
    }

    // --- Password Change Form Handler (Requires Backend Endpoint) ---
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            showMessage('', false, 'password'); // Clear password message

            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmNewPassword = document.getElementById('confirm-new-password').value;

            if (newPassword !== confirmNewPassword) {
                showMessage('New passwords do not match.', true, 'password');
                return;
            }
            if (newPassword.length < 6) {
                 showMessage('New password must be at least 6 characters long.', true, 'password');
                 return;
            }

            const submitButton = passwordForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Updating...';

            // Remove placeholder console log
            // console.log('Attempting password change with:', { currentPassword, newPassword });

            // --- Start Actual API Call ---
            try {
                 // Use the correct endpoint defined in server/routes/users.js
                const response = await fetch(`${API_BASE_URL}/api/users/change-password`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` // Send token
                    },
                    // No need to send userId, backend gets it from token
                    body: JSON.stringify({ currentPassword, newPassword })
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || `HTTP error! status: ${response.status}`);
                }
                showMessage('Password updated successfully!', false, 'password');
                passwordForm.reset(); // Clear form
            } catch (error) {
                console.error('Password update failed:', error);
                showMessage(error.message || 'Failed to update password.', true, 'password');
            }
            // --- End Actual API Call ---
            
            // Remove the placeholder simulation logic
            /*
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
            showMessage('Password update endpoint not yet implemented.', true);
            */
            // End Remove

            submitButton.disabled = false;
            submitButton.textContent = 'Update Password';
        });
    }

    // --- Sidebar Navigation Handler --- 
    const navLinks = document.querySelectorAll('.account-nav .nav-link');
    const accountSections = document.querySelectorAll('.account-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default anchor behavior
            
            const targetSectionId = link.getAttribute('data-section');
            
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show target section, hide others
            accountSections.forEach(section => {
                if (section.id === targetSectionId) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });
            
             // Clear messages when switching sections
             if (profileMessage) profileMessage.style.display = 'none';
             if (passwordMessage) passwordMessage.style.display = 'none';
        });
    });

    // --- Profile Picture Delete Button Handler (Placeholder) --- 
    const deletePictureBtn = document.getElementById('delete-picture-btn');
    if (deletePictureBtn) {
        deletePictureBtn.addEventListener('click', () => {
             // TODO: Implement backend call to delete picture and update user model
             if(confirm('Are you sure you want to delete your avatar?')) {
                 console.log('Delete picture clicked - Placeholder');
                  showMessage('Delete functionality not yet implemented.', true, 'profile');
                  // On success from backend:
                  // profilePictureDisplay.src = 'images/default-avatar.png'; // Or the default path from config/token
                  // Need to issue a new token without the picture path or with the default path
                  // localStorage.setItem('recom_admin_token', data.newToken);
             }
        });
    }
    
    // --- Profile Details Form Handler (Placeholder) ---
    const profileDetailsForm = document.getElementById('profile-details-form');
    if (profileDetailsForm) {
        profileDetailsForm.addEventListener('submit', async (event) => {
            event.preventDefault();
             showMessage(''); // Clear messages
            console.log('Profile details form submitted - Placeholder');
            // TODO: Gather form data (firstName, lastName, etc.)
            // TODO: Implement backend API call to update user details (excluding password/picture)
            // TODO: Handle response, show success/error message
            // TODO: Potentially update JWT if details like username change? (Less common)
            showMessage('Profile update functionality not yet implemented.', true, 'profile');
        });
    }

    // --- Logout Button Handler (Removed - Handled by header icon) --- 
    // if (logoutButton) { ... }

}); 