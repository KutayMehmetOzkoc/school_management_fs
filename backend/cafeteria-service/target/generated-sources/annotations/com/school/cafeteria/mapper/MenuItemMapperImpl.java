package com.school.cafeteria.mapper;

import com.school.cafeteria.dto.MenuItemRequest;
import com.school.cafeteria.dto.MenuItemResponse;
import com.school.cafeteria.entity.MenuItem;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-18T18:02:59+0300",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 25.0.1 (Oracle Corporation)"
)
@Component
public class MenuItemMapperImpl implements MenuItemMapper {

    @Override
    public MenuItem toEntity(MenuItemRequest request) {
        if ( request == null ) {
            return null;
        }

        MenuItem.MenuItemBuilder menuItem = MenuItem.builder();

        menuItem.name( request.getName() );
        menuItem.description( request.getDescription() );
        menuItem.menuDate( request.getMenuDate() );
        menuItem.mealType( request.getMealType() );
        menuItem.vegetarian( request.isVegetarian() );

        menuItem.dayOfWeek( request.getMenuDate().getDayOfWeek() );

        return menuItem.build();
    }

    @Override
    public MenuItemResponse toResponse(MenuItem item) {
        if ( item == null ) {
            return null;
        }

        MenuItemResponse menuItemResponse = new MenuItemResponse();

        menuItemResponse.setId( item.getId() );
        menuItemResponse.setName( item.getName() );
        menuItemResponse.setDescription( item.getDescription() );
        menuItemResponse.setMenuDate( item.getMenuDate() );
        menuItemResponse.setDayOfWeek( item.getDayOfWeek() );
        menuItemResponse.setMealType( item.getMealType() );
        menuItemResponse.setVegetarian( item.isVegetarian() );

        return menuItemResponse;
    }
}
