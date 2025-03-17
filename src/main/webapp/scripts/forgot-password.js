document.addEventListener("DOMContentLoaded", function () {
    const forgotPasswordForm = document.getElementById("forgotPasswordForm");

    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener("submit", function (e) {
            e.preventDefault();

            const email = forgotPasswordForm.querySelector("input[name='email']").value.trim();
            const submitButton = forgotPasswordForm.querySelector("button");

            submitButton.disabled = true;
            submitButton.innerText = "Sending...";

            // Send request to ForgotPasswordServlet
            fetch("ForgotPasswordServlet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            })
            .then(response => response.text())
            .then(text => {
                console.log("Response:", text);
                try {
                    const data = JSON.parse(text);
                    alert(data.message);
                } catch (error) {
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
