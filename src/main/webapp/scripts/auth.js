function checkAuthentication() {
    document.addEventListener("DOMContentLoaded", function () {
        let token = getCookie("auth_token");
        // const logoutBtn = document.getElementById("logoutBtn");
        // logoutBtn.style.display = 'block';
        checkLoginStatus();
    });
}

function getCookie(name) {
    let cookies = document.cookie.split("; ");
    for (let i = 0; i < cookies.length; i++) {
        let parts = cookies[i].split("=");
        if (parts[0] === name) return parts[1];
    }
    return null;
}

function checkLoginStatus() {
    const logoutBtn = document.getElementById("logoutBtn");

    fetch("CheckAuthServlet", {
        method: "GET",
        credentials: "include"
    })
        .then(response => response.json())
        .then(data => {
            if (data.loggedIn) {
                // Update session storage with user data
                sessionStorage.setItem('userEmail', data.email);
                sessionStorage.setItem('userId', data.userId);
                sessionStorage.setItem('userName', data.name);

                // Show logout button
                if (logoutBtn) {
                    logoutBtn.style.display = "block";
                }

                // Redirect to dashboard only if on login/index page
                const currentPage = window.location.pathname;
                if (currentPage.includes('index.html') || currentPage === '/' || currentPage.endsWith('/')) {
                    window.location.href = 'dashboard.html';
                }
            } else {
                // Clear session storage if not logged in
                sessionStorage.clear();

                // Show logout button only if it exists
                if (logoutBtn) {
                    logoutBtn.style.display = "none";
                }

                // Redirect to index if not already there
                if (!window.location.pathname.includes('index.html')) {
                    window.location.href = 'index.html';
                }
            }
        })
        .catch(error => {
            console.error('Auth check failed:', error);
            sessionStorage.clear();
            if (logoutBtn) {
                logoutBtn.style.display = "none";
            }
            window.location.href = 'index.html';
        });
}

// checkLoginStatus(); // Run on page load

// Call the function when the page loads
checkAuthentication();
