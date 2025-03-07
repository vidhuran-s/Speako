package Classes;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import javax.servlet.http.HttpServletRequest;
import java.util.Date;

public class JWToken {
    
    // Secret Key for Signing JWT (Keep it Secure & Long Enough)
    private static final String SECRET = "6+yluJ8zWVxjPbLNFJ7VsaRPJpA70DmHYrYINZFiKWc=";
    private static final SecretKey SECRET_KEY = Keys.hmacShaKeyFor(Decoders.BASE64.decode(SECRET));

    private static JWToken jwtUtil = null;

    private JWToken() {
    }

    // Singleton Instance
    public static JWToken getInstance() {
        if (jwtUtil == null) {
            jwtUtil = new JWToken();
        }
        return jwtUtil;
    }

    // Generate Token (Using Unique User ID)
    public String generateToken(long userId) {
        return Jwts.builder()
                .subject(String.valueOf(userId)) // Storing unique user ID in token
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3L * 24 * 60 * 60 * 1000)) // 3 days expiry
                .signWith(SECRET_KEY)
                .compact();
    }

    // Validate & Extend Token if Near Expiry
    public String validateAndExtendToken(String token, HttpServletRequest req) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(SECRET_KEY)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            long userId = Long.parseLong(claims.getSubject()); // Extract user ID from token
            UserDAO userDAO = new UserDAO();

            if (userDAO.userExists(userId)) {
                String email = userDAO.getEmailById(userId); // Get email from DB
                req.setAttribute("email", email);

                // Check if token is close to expiry (less than 1 day remaining)
                Date expiration = claims.getExpiration();
                long remainingTime = expiration.getTime() - System.currentTimeMillis();
                if (remainingTime < 1L * 24 * 60 * 60 * 1000) {
                    return generateToken(userId); // Renew the token
                }
                return token; // If token is still valid, return the same token
            } else {
                throw new RuntimeException("Token expired or user not found, please log in again.");    
            }
        } catch (ExpiredJwtException e) {
            throw new RuntimeException("Token expired, please log in again.");
        } catch (JwtException e) {
            throw new RuntimeException("Invalid token.");
        }
    }
}
