document.addEventListener("DOMContentLoaded", function () {
    const resetPasswordForm = document.getElementById("resetPasswordForm");


    if (resetPasswordForm) {
        // Extract token from URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");

        // Set the token in the hidden input field
        const tokenInput = resetPasswordForm.querySelector("input[name='token']");
        if (token) {
            tokenInput.value = token;
        } else {
            alert("Invalid or missing token.");
            window.location.href = "index.html"; // Redirect to login if no token
            return;
        }

        // Handle form submission
        resetPasswordForm.addEventListener("submit", function (e) {
            e.preventDefault();

            // Get input values
            const newPassword = resetPasswordForm.querySelector("input[name='password']").value.trim();
            const submitButton = resetPasswordForm.querySelector("button");

            // Validate password length
            if (newPassword.length < 6) {
                alert("Password must be at least 6 characters long.");
                return;
            }

            // Disable button to prevent multiple submissions
            submitButton.disabled = true;
            submitButton.innerText = "Resetting...";

            // Send request to ResetPasswordServlet
			fetch("ResetPasswordServlet", {
			    method: "POST",
			    headers: { "Content-Type": "application/x-www-form-urlencoded" },
			    body: new URLSearchParams({ token, password: newPassword })
			})
            .then(response => response.text()) // Read response as text
            .then(text => {
                console.log("Response:", text);
                try {
                    const data = JSON.parse(text);
                    alert(data.message); // Show success/error message
                    if (data.success) {
                        window.location.href = "index.html"; // Redirect to login after success
                    }
                } catch (error) {
                    console.error("Invalid JSON response:", error);
                    alert("An error occurred. Please try again.");
                }
            })
            .catch(error => {
                console.error("Reset Password Error:", error);
                alert("Failed to reset password. Please try again.");
            })
            .finally(() => {
                // Re-enable button after request is complete
                submitButton.disabled = false;
                submitButton.innerText = "Reset Password";
            });
        });
    }
});

function initPasswordValidation(passwordInput, validateCallback) {
    const requirements = [
        { id: "length", text: "At least 8 characters", regex: /.{8,}/ },
        { id: "uppercase", text: "One uppercase letter", regex: /[A-Z]/ },
        { id: "lowercase", text: "One lowercase letter", regex: /[a-z]/ },
        { id: "number", text: "One number", regex: /[0-9]/ },
        { id: "special", text: "One special character", regex: /[!@#$%^&*(),.?":{}|<>]/ }
    ];

    // Add requirements container after password input
    const requirementsDiv = document.createElement("div");
    requirementsDiv.className = "password-requirements";
    requirementsDiv.innerHTML = requirements.map(req =>
        `<div class="requirement" id="${req.id}">${req.text}</div>`
    ).join('');
    passwordInput.insertAdjacentElement('afterend', requirementsDiv);

    let currentRequirementIndex = 0;
    document.getElementById(requirements[0].id).classList.add('visible');

    function validatePassword(password) {
        const currentReq = requirements[currentRequirementIndex];
        const isValid = currentReq.regex.test(password);
        const element = document.getElementById(currentReq.id);

        element.classList.toggle('valid', isValid);
        element.classList.toggle('invalid', !isValid);

        if (isValid && currentRequirementIndex < requirements.length - 1) {
            currentRequirementIndex++;
            document.getElementById(requirements[currentRequirementIndex].id)
                .classList.add('visible');
        }

        const allValid = requirements.every((req, index) =>
            index > currentRequirementIndex || req.regex.test(password)
        );

        if (validateCallback) {
            validateCallback(allValid);
        }

        return allValid;
    }

    passwordInput.addEventListener("input", function() {
        validatePassword(this.value);
    });

    return validatePassword;
}
