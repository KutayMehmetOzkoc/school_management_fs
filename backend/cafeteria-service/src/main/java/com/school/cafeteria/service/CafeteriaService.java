package com.school.cafeteria.service;

import com.school.cafeteria.dto.MenuItemRequest;
import com.school.cafeteria.dto.MenuItemResponse;
import com.school.cafeteria.entity.MenuItem;
import com.school.cafeteria.exception.MenuItemNotFoundException;
import com.school.cafeteria.mapper.MenuItemMapper;
import com.school.cafeteria.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CafeteriaService {

    private final MenuItemRepository menuItemRepository;
    private final MenuItemMapper menuItemMapper;

    @CacheEvict(value = {"dailyMenu", "weeklyMenu"}, allEntries = true)
    @Transactional
    public MenuItemResponse addMenuItem(MenuItemRequest request) {
        MenuItem item = menuItemMapper.toEntity(request);
        return menuItemMapper.toResponse(menuItemRepository.save(item));
    }

    @Cacheable(value = "weeklyMenu", key = "#weekStart")
    @Transactional(readOnly = true)
    public List<MenuItemResponse> getWeeklyMenu(LocalDate weekStart) {
        LocalDate weekEnd = weekStart.plusDays(6);
        return menuItemRepository.findByMenuDateBetweenOrderByMenuDateAscMealTypeAsc(weekStart, weekEnd)
                .stream()
                .map(menuItemMapper::toResponse)
                .toList();
    }

    @Cacheable(value = "dailyMenu", key = "#date")
    @Transactional(readOnly = true)
    public List<MenuItemResponse> getDailyMenu(LocalDate date) {
        return menuItemRepository.findByMenuDateOrderByMealTypeAsc(date)
                .stream()
                .map(menuItemMapper::toResponse)
                .toList();
    }

    @CacheEvict(value = {"dailyMenu", "weeklyMenu"}, allEntries = true)
    @Transactional
    public void deleteMenuItem(Long id) {
        if (!menuItemRepository.existsById(id)) {
            throw new MenuItemNotFoundException(id);
        }
        menuItemRepository.deleteById(id);
    }
}
