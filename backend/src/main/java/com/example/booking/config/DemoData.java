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

            List<Event> seedEvents = List.of(
                    new Event(
                            "Avengers: Endgame - IMAX 3D",
                            "IMAX Grand Multiplex, Screen 1",
                            LocalDateTime.now().plusDays(2).withHour(18).withMinute(30),
                            350.0,
                            "Movie",
                            "Experience Marvel Studios epic culmination on the giant IMAX laser screen with immersive Dolby Atmos surround sound.",
                            "/events/avengers.jpg",
                            4.9
                    ),
                    new Event(
                            "Coldplay: Music of the Spheres Tour",
                            "Grand Stadium Arena, Mumbai",
                            LocalDateTime.now().plusDays(4).withHour(19).withMinute(0),
                            2499.0,
                            "Concert",
                            "A breathtaking live musical journey filled with iconic anthems, lasers, fireworks, and kinetic dance floors.",
                            "/events/coldplay.jpg",
                            4.9
                    ),
                    new Event(
                            "Zakir Khan: Live Standup Comedy",
                            "The Laugh Club, Bengaluru",
                            LocalDateTime.now().plusDays(5).withHour(20).withMinute(0),
                            799.0,
                            "Comedy",
                            "India's beloved storyteller brings his latest unfiltered special filled with heart-touching humor and relatable anecdotes.",
                            "/events/comedy.jpg",
                            4.8
                    ),
                    new Event(
                            "Interstellar: 10th Anniversary in 70mm",
                            "PVR Director's Cut, Delhi",
                            LocalDateTime.now().plusDays(3).withHour(21).withMinute(15),
                            450.0,
                            "Movie",
                            "Christopher Nolan's cosmic masterpiece returns to the big screen with Hans Zimmer's breathtaking score in pure acoustic fidelity.",
                            "/events/interstellar.jpg",
                            5.0
                    ),
                    new Event(
                            "Arijit Singh Symphony Live Concert",
                            "JLN Arena, New Delhi",
                            LocalDateTime.now().plusDays(6).withHour(18).withMinute(0),
                            1999.0,
                            "Concert",
                            "An enchanting evening featuring soulful romantic melodies backed by a 45-piece international grand orchestra.",
                            "/events/arijit.jpg",
                            4.9
                    ),
                    new Event(
                            "Cirque de Lumiere: Aerial Acrobatics",
                            "Royal Opera House, Mumbai",
                            LocalDateTime.now().plusDays(7).withHour(17).withMinute(30),
                            1200.0,
                            "Theatre",
                            "World-class acrobatics, breathtaking aerial silks, mesmerizing light illusions, and physical theatre.",
                            "/events/cirque.jpg",
                            4.7
                    ),
                    new Event(
                            "Taylor Swift: The Eras Tour Experience",
                            "Cyber City Arena, Hyderabad",
                            LocalDateTime.now().plusDays(8).withHour(19).withMinute(30),
                            3200.0,
                            "Concert",
                            "Celebrate all musical eras with this ultimate stadium concert tribute show, complete with LED wristbands and dancers.",
                            "/events/taylorswift.jpg",
                            4.9
                    ),
                    new Event(
                            "Tech Vision 2026: AI & Cloud Summit",
                            "Convention Centre, Bengaluru",
                            LocalDateTime.now().plusDays(9).withHour(10).withMinute(0),
                            1500.0,
                            "Conference",
                            "Keynote presentations, live AI system demos, and networking with top engineering leaders and founders.",
                            "/events/techsummit.jpg",
                            4.6
                    )
            );

            for (Event seed : seedEvents) {
                boolean exists = events.findAll().stream()
                        .anyMatch(e -> e.getTitle().equalsIgnoreCase(seed.getTitle()));
                if (!exists) {
                    events.save(seed);
                }
            }

            // Ensure seats for every event (Rows A-D, 1-6)
            for (Event event : events.findAll()) {
                List<Seat> existing = seats.findByEventIdOrderBySeatNumberAsc(event.getId());
                if (existing.isEmpty()) {
                    List<Seat> newSeats = new ArrayList<>();
                    for (char row = 'A'; row <= 'D'; row++) {
                        for (int number = 1; number <= 6; number++) {
                            newSeats.add(new Seat(event, row + "" + number));
                        }
                    }
                    seats.saveAll(newSeats);
                }
            }
        };
    }
}
