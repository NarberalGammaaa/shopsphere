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

    // ---------------- customers ----------------

    public AuthResponse registerCustomer(RegisterRequest req) {
        User u = newUser(req.name(), req.email(), req.password(), Role.CUSTOMER);
        return toResponse(users.save(u));
    }

    /** Customer portal: customers and the admin may sign in, sellers may not. */
    public AuthResponse loginCustomer(LoginRequest req) {
        User u = authenticate(req);
        if (u.getRole() == Role.SELLER) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "This is a seller account. Please sign in through the seller portal.");
        }
        return toResponse(u);
    }

    // ---------------- sellers ----------------

    public AuthResponse registerSeller(SellerRegisterRequest req) {
        User u = newUser(req.name(), req.email(), req.password(), Role.SELLER);
        u.setStoreName(req.storeName().trim());
        u.setWarehousePincode(req.warehousePincode());
        return toResponse(users.save(u));
    }

    /** Seller portal: only seller accounts may sign in. */
    public AuthResponse loginSeller(LoginRequest req) {
        User u = authenticate(req);
        if (u.getRole() != Role.SELLER) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "This portal is for sellers only. Customers please sign in on the store.");
        }
        return toResponse(u);
    }

    public UserDto me(String email) {
        return users.findByEmail(email).map(Mapper::user)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    // ---------------- helpers ----------------

    private User newUser(String name, String rawEmail, String rawPassword, Role role) {
        String email = rawEmail.trim().toLowerCase();
        if (users.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "That email is already registered");
        }
        User u = new User();
        u.setName(name.trim());
        u.setEmail(email);
        u.setPassword(encoder.encode(rawPassword));
        u.setRole(role); // admins are never created through public endpoints
        return u;
    }

    private User authenticate(LoginRequest req) {
        String email = req.email().trim().toLowerCase();
        // Throws BadCredentialsException (handled -> 401) when the password is wrong.
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, req.password()));
        return users.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
    }

    private AuthResponse toResponse(User u) {
        return new AuthResponse(jwtService.generateToken(u.getEmail()), Mapper.user(u));
    }
}
