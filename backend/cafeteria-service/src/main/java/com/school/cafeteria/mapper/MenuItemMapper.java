package com.school.cafeteria.mapper;

import com.school.cafeteria.dto.MenuItemRequest;
import com.school.cafeteria.dto.MenuItemResponse;
import com.school.cafeteria.entity.MenuItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface MenuItemMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "dayOfWeek", expression = "java(request.getMenuDate().getDayOfWeek())")
    @Mapping(target = "createdAt", ignore = true)
    MenuItem toEntity(MenuItemRequest request);

    MenuItemResponse toResponse(MenuItem item);
}
