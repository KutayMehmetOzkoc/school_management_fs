package com.school.cafeteria.dto;

import com.school.cafeteria.entity.MealType;
import lombok.Data;

import java.time.DayOfWeek;
import java.time.LocalDate;

@Data
public class MenuItemResponse {
    private Long id;
    private String name;
    private String description;
    private LocalDate menuDate;
    private DayOfWeek dayOfWeek;
    private MealType mealType;
    private boolean vegetarian;
}
