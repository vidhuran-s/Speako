package Classes;

public class UserLoginResult {
    private String token;
    private User user;

    public UserLoginResult(String token, User user) {
        this.token = token;
        this.user = user;
    }

    public String getToken() {
        return token;
    }

    public User getUser() {
        return user;
    }
}