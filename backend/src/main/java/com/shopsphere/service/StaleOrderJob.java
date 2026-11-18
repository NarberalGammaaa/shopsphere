package com.shopsphere.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/** Online orders that are still unpaid after 30 minutes are cancelled and their stock is released. */
@Component
@RequiredArgsConstructor
@Slf4j
public class StaleOrderJob {

    private final OrderService orderService;

    @Scheduled(initialDelay = 60_000, fixedDelay = 300_000)
    public void cancelUnpaidOrders() {
        int cancelled = orderService.cancelStaleUnpaid(Instant.now().minus(30, ChronoUnit.MINUTES));
        if (cancelled > 0) {
            log.info("Cancelled {} unpaid online order(s) older than 30 minutes", cancelled);
        }
    }
}
