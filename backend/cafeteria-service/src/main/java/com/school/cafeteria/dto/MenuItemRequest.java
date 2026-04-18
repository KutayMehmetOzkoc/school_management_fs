package com.school.cafeteria.dto;

import com.school.cafeteria.entity.MealType;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class MenuItemRequest {

    @NotBlank @Size(max = 100)
    private String name;

    private String description;

    @NotNull @FutureOrPresent
    private LocalDate menuDate;

    @NotNull
    private MealType mealType;

    private boolean vegetarian;
}
