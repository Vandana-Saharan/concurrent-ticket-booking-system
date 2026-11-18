
package com.example.booking.config;

import com.example.booking.entity.*;
import com.example.booking.repository.*;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Configuration
public class DemoData {

    @Bean
    CommandLineRunner loadDemoData(
            EventRepository events,
            SeatRepository seats,
            AppUserRepository users) {

        return args -> {

            if (users.count() == 0) {
                users.save(new AppUser("User A"));
                users.save(new AppUser("User B"));
            }

            if (events.count() == 0) {

                Event movie = new Event();
                movie.setTitle("Avengers Evening Show");
                movie.setVenue("Screen 1");
                movie.setEventTime(
                        LocalDateTime.now().plusDays(2));
                movie.setTicketPrice(250);
                events.save(movie);

                Event concert = new Event();
                concert.setTitle("Live Music Concert");
                concert.setVenue("Main Auditorium");
                concert.setEventTime(
                        LocalDateTime.now().plusDays(3));
                concert.setTicketPrice(500);
                events.save(concert);
            }

            for (Event event : events.findAll()) {

                if (!seats.findByEventIdOrderBySeatNumberAsc(
                        event.getId()).isEmpty()) {
                    continue;
                }

                List<Seat> newSeats = new ArrayList<>();

                for (char row = 'A'; row <= 'B'; row++) {
                    for (int number = 1; number <= 5; number++) {

                        String seatNumber = row + "" + number;

                        newSeats.add(
                                new Seat(event, seatNumber)
                        );
                    }
                }

                seats.saveAll(newSeats);
            }
        };
    }
}
