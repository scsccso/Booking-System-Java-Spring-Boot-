package com.example.booking.security;

import com.example.booking.dto.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {

    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (request.getMethod().equalsIgnoreCase("OPTIONS")) {
            return true;
        }

        String requestURI = request.getRequestURI();
        
        // Only intercept /api/admin/** and /api/bookings/**
        // We let /api/auth/** pass through
        if (requestURI.startsWith("/api/auth")) {
            return true;
        }

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            writeErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Missing or invalid Authorization header");
            return false;
        }

        String token = authHeader.substring(7);

        if (!jwtUtil.isTokenValid(token)) {
            writeErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired token");
            return false;
        }

        String role = jwtUtil.extractRole(token);

        if (requestURI.startsWith("/api/admin") && !"ADMIN".equals(role)) {
            writeErrorResponse(response, HttpServletResponse.SC_FORBIDDEN, "Access Denied: Requires ADMIN role");
            return false;
        }
        
        // Pass the username to the request context
        request.setAttribute("username", jwtUtil.extractUsername(token));
        request.setAttribute("role", role);

        return true;
    }

    private void writeErrorResponse(HttpServletResponse response, int status, String message) throws Exception {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        ApiResponse<Void> apiResponse = ApiResponse.error(status, message);
        response.getWriter().write(objectMapper.writeValueAsString(apiResponse));
    }
}
