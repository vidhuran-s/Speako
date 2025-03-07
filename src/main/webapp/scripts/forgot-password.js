document.addEventListener("DOMContentLoaded", function () {
    const forgotPasswordForm = document.getElementById("forgotPasswordForm");

    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener("submit", function (e) {
            e.preventDefault();

            // Get the email input value
            const email = forgotPasswordForm.querySelector("input[name='email']").value.trim();
            const submitButton = forgotPasswordForm.querySelector("button");

            // Disable button to prevent multiple clicks
            submitButton.disabled = true;
            submitButton.innerText = "Sending...";

            // Send request to ForgotPasswordServlet
            fetch("ForgotPasswordServlet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }) // Ensure the email is in the body
            })
            .then(response => response.text()) // Read response as text
            .then(text => {
                console.log("Response:", text);
                try {
                    const data = JSON.parse(text); // Attempt to parse JSON
                    alert(data.message); // Show success/error message
                } catch (error) {
                    // If response is not JSON, assume it's a plain text error message
                    alert(text);
                }
            })
            .catch(error => {
                console.error("Forgot Password Error:", error);
                alert("Failed to send reset link. Please try again.");
            })
            .finally(() => {
                // Re-enable button after request is complete
                submitButton.disabled = false;
                submitButton.innerText = "Send Reset Link";
            });
        });
    }
});
