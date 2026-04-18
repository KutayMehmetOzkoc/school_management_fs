package com.school.cafeteria.repository;

import com.school.cafeteria.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByMenuDateBetweenOrderByMenuDateAscMealTypeAsc(LocalDate from, LocalDate to);
    List<MenuItem> findByMenuDateOrderByMealTypeAsc(LocalDate date);
}
