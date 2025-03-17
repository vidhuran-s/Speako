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
                sessionStorage.setItem('userEmail', data.email);
                sessionStorage.setItem('userId', data.userId);
                sessionStorage.setItem('userName', data.name);

                if (logoutBtn) {
                    logoutBtn.style.display = "block";
                }

                const currentPage = window.location.pathname;
                if (currentPage.includes('index.html') || currentPage === '/' || currentPage.endsWith('/')) {
                    window.location.href = 'dashboard.html';
                }
            } else {
                sessionStorage.clear();

                if (logoutBtn) {
                    logoutBtn.style.display = "none";
                }

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

checkAuthentication();
