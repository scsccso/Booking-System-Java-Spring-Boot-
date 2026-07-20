package com.example.booking.controller;

import com.example.booking.domain.User;
import com.example.booking.dto.ApiResponse;
import com.example.booking.dto.LoginRequest;
import com.example.booking.dto.LoginResponse;
import com.example.booking.repository.UserRepository;
import com.example.booking.security.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            User user = userRepository.findByUsername(request.getUsername())
                    .orElse(null);

            if (user == null || !user.getPassword().equals(request.getPassword())) {
                return ApiResponse.error(401, "Invalid username or password");
            }

            String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());
            LoginResponse response = new LoginResponse(token, user.getUsername(), user.getRole().name());

            return ApiResponse.success(response);

        } catch (Exception e) {
            log.error("Login failed due to internal error: {}", e.getMessage(), e);
            return ApiResponse.error(500, "Database or Auth Error: " + e.getMessage());
        }
    }
}
