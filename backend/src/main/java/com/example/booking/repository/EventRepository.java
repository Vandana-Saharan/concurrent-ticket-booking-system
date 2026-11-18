
package com.example.booking.repository;

import com.example.booking.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRepository
        extends JpaRepository<Event, Long> {

}
