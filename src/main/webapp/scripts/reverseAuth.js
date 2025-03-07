function checkRevAuthentication() {
    document.addEventListener("DOMContentLoaded", function () {
        let token1 = getCookie("auth_token");
        // let token2 = getCookie("SESSION_ID");
        // if(token2){
        //     window.location.href = "dashboard.html";
        // }
        if (token1) {
            // Validate token with server
            fetch("CheckAuthServlet", {
                method: "GET",
                credentials: "include"
            })
            .then(response => response.json())
            .then(data => {
                if (data.loggedIn) {
                    window.location.href = "dashboard.html";
                }
            })
            .catch(error => {
                console.error('Auth validation failed:', error);
                // Call LogoutServlet instead of manually deleting cookie
                fetch("LogoutServlet", {
                    method: "POST",
                    credentials: "include"
                });
            });
        }
        // else{
        //     window.location.href = "index.html";
        // }
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

    function deleteCookie(name) {
        document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }

    checkRevAuthentication();