package com.shopsphere.controller;

import com.shopsphere.dto.Dtos.ChatReply;
import com.shopsphere.dto.Dtos.ChatRequest;
import com.shopsphere.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    public ChatReply chat(Authentication auth, @Valid @RequestBody ChatRequest req) {
        return chatService.chat(auth.getName(), req);
    }
}
