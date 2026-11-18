package com.shopsphere.service;

import com.shopsphere.dto.Dtos.*;
import com.shopsphere.entity.Role;
import com.shopsphere.entity.User;
import com.shopsphere.exception.ApiException;
import com.shopsphere.repository.UserRepository;
import com.shopsphere.security.JwtService;
import com.shopsphere.util.Mapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (users.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "That email is already registered");
        }
        User u = new User();
        u.setName(req.name().trim());
        u.setEmail(email);
        u.setPassword(encoder.encode(req.password()));
        u.setRole(Role.USER); // admins are never created through the public endpoint
        users.save(u);
        return toResponse(u);
    }

    public AuthResponse login(LoginRequest req) {
        String email = req.email().trim().toLowerCase();
        // Throws BadCredentialsException (handled -> 401) when the password is wrong.
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, req.password()));
        User u = users.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        return toResponse(u);
    }

    public UserDto me(String email) {
        return users.findByEmail(email).map(Mapper::user)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private AuthResponse toResponse(User u) {
        return new AuthResponse(jwtService.generateToken(u.getEmail()), Mapper.user(u));
    }
}
