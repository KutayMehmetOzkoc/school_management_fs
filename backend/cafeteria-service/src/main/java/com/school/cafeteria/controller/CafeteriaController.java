package com.school.cafeteria.controller;

import com.school.cafeteria.dto.MenuItemRequest;
import com.school.cafeteria.dto.MenuItemResponse;
import com.school.cafeteria.service.CafeteriaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/cafeteria")
@RequiredArgsConstructor
public class CafeteriaController {

    private final CafeteriaService cafeteriaService;

    @PostMapping("/menu")
    public ResponseEntity<MenuItemResponse> addMenuItem(@Valid @RequestBody MenuItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cafeteriaService.addMenuItem(request));
    }

    @GetMapping("/menu/weekly")
    public ResponseEntity<List<MenuItemResponse>> getWeeklyMenu(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        return ResponseEntity.ok(cafeteriaService.getWeeklyMenu(weekStart));
    }

    @GetMapping("/menu/daily")
    public ResponseEntity<List<MenuItemResponse>> getDailyMenu(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate targetDate = (date != null) ? date : LocalDate.now();
        return ResponseEntity.ok(cafeteriaService.getDailyMenu(targetDate));
    }

    @DeleteMapping("/menu/{id}")
    public ResponseEntity<Void> deleteMenuItem(@PathVariable Long id) {
        cafeteriaService.deleteMenuItem(id);
        return ResponseEntity.noContent().build();
    }
}
