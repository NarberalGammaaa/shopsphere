package com.shopsphere.controller;

import com.shopsphere.dto.Dtos.DeliveryEstimate;
import com.shopsphere.service.DeliveryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/delivery")
@RequiredArgsConstructor
public class DeliveryController {

    private final DeliveryService deliveryService;

    /** GET /api/delivery/estimate?pincode=700001&productIds=1,2,3 */
    @GetMapping("/estimate")
    public List<DeliveryEstimate> estimate(@RequestParam String pincode, @RequestParam List<Long> productIds) {
        return deliveryService.estimate(pincode, productIds);
    }
}
