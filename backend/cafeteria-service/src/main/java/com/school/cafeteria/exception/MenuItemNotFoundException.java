package com.school.cafeteria.exception;

public class MenuItemNotFoundException extends RuntimeException {
    public MenuItemNotFoundException(Long id) {
        super("Menu item not found with id: " + id);
    }
}
