
package com.example.booking.repository;

import com.example.booking.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository
        extends JpaRepository<AppUser, Long> {
}
