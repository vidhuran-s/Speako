document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const logoutBtn = document.getElementById("logoutBtn");

    const zohoLoginButton = document.getElementById("zohoLogin");
    // const statusMsg = document.getElementById("status");


    // ✅ Signup Event Listener
    if (signupForm) {
        setupSignupPasswordValidation();
        signupForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const name = document.getElementById("name").value;
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const validationResult = validatePassword(password);

            if (!validationResult.isValid) {
                document.getElementById("signupMessage").innerText = "Please fix password errors before submitting";
                return;
            }

			fetch("SignupServlet", {
			    method: "POST",
			    headers: { "Content-Type": "application/x-www-form-urlencoded" },
			    body: `name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
			})
			.then(response => response.json())  // Ensure JSON parsing
			.then(data => {
			    document.getElementById("signupMessage").innerText = data.message;
			    if (data.success) {
			        setTimeout(() => window.location.href = "index.html", 2000);
			    }
			})
			.catch(error => console.error("Signup Error:", error));
        });
    }

    // ✅ Login Event Listener
    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const loginMessage = document.getElementById("loginMessage");
            loginMessage.innerText = ""; // Clear previous messages

            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            // Basic validation
            if (!email || !password) {
                loginMessage.innerText = "Please fill in all fields";
                loginMessage.style.color = "#dc3545";
                return;
            }

            fetch("LoginServlet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(data => Promise.reject(data));
                    }
                    return response.json();
                })
                .then(data => {
                    loginMessage.style.color = data.success ? "#28a745" : "#dc3545";
                    loginMessage.innerText = data.message;

                    if (data.success && data.user) {
                        // Store user data and redirect
                        sessionStorage.setItem('userEmail', data.user.email);
                        sessionStorage.setItem('userId', data.user.userId);
                        sessionStorage.setItem('userName', data.user.name);
                        window.location.href = 'dashboard.html';
                    } else if (data.message.includes("verify")) {
                        loginMessage.innerHTML = "Please verify your email before logging in. <br>Check your inbox for the verification link.";
                    }
                })
                .catch(error => {
                    loginMessage.style.color = "#dc3545";
                    if (error.message) {
                        loginMessage.innerText = error.message;
                    } else {
                        loginMessage.innerText = "Login failed. Please try again.";
                        console.error("Login Error:", error);
                    }
                });
        });
    }

    // ✅ Logout Event Listener (Calls LogoutServlet)
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            fetch("LogoutServlet", { method: "POST", credentials: "include" })
            .then(() => location.reload());
        });
    }

    zohoLoginButton.addEventListener('click', function () {
        console.log("Zoho Login button clicked");
        const clientId = "1000.I7YZUW54IDVJSU578WTKCBS2IWCL6U";  // Ensure correct ID
        const redirectURI = encodeURIComponent("http://localhost:8080/SpeakO/auth-servlet");  // Check in Zoho Console
        const scope = "email,ZohoCliq.Users.READ";
        const authUrl = `https://accounts.zoho.com/oauth/v2/auth?client_id=${clientId}&redirect_uri=${redirectURI}&scope=${scope}&response_type=code`;
        window.location.href = authUrl
    });
});



// Password configuration object
const passwordConfig = {
    minLength: 8,
    patterns: {
        uppercase: { regex: /[A-Z]/, message: "uppercase letter" },
        lowercase: { regex: /[a-z]/, message: "lowercase letter" },
        number: { regex: /[0-9]/, message: "number" },
        special: { regex: /[!@#$%^&*]/, message: "special character (!@#$%^&*)" }
    }
};

// Password validation method
function validatePassword(password) {
    // Check minimum length
    if (password.length < passwordConfig.minLength) {
        return createValidationResult(false,
            `Password must be at least ${passwordConfig.minLength} characters long`);
    }

    // Check each pattern requirement
    for (const [key, pattern] of Object.entries(passwordConfig.patterns)) {
        if (!pattern.regex.test(password)) {
            return createValidationResult(false,
                `Password must contain at least one ${pattern.message}`);
        }
    }

    return createValidationResult(true, "Password meets all requirements");
}

// Helper method to create validation result object
function createValidationResult(isValid, message) {
    return { isValid, message };
}

// Method to set up password validation listener
function setupPasswordValidation() {
    const passwordInput = document.getElementById("password");
    const passwordMessage = document.getElementById("loginMessage");

    if (passwordInput && passwordMessage) {
        passwordInput.addEventListener("input", function() {
            const result = validatePassword(this.value);
            passwordMessage.textContent = result.message;
            passwordMessage.style.color = result.isValid ? "#28a745" : "#dc3545";
        });
    }
}

// Initialize everything when DOM is loaded
// document.addEventListener("DOMContentLoaded", function () {
//     setupPasswordValidation();
// });

function setupSignupPasswordValidation() {
    const passwordInput = document.getElementById("password");
    const passwordMessage = document.getElementById("passwordMessage");
    const signupButton = document.querySelector("#signupForm button[type='submit']");

    if (passwordInput && passwordMessage) {
        passwordInput.addEventListener("input", function() {
            const result = validatePassword(this.value);

            // Update message and styling
            passwordMessage.textContent = result.message;
            passwordMessage.style.color = result.isValid ? "#28a745" : "#dc3545";

            // Enable/disable signup button based on password validity
            signupButton.disabled = !result.isValid;
            signupButton.style.opacity = result.isValid ? "1" : "0.6";
        });
    }
}
