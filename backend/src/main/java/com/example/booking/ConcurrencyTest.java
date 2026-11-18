
package com.example.booking;

import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.concurrent.*;

public class ConcurrencyTest {

    public static void main(String[] args) throws Exception {

        // Use an AVAILABLE seat ID from GET /api/events/1/seats.
        long seatId =12L;

        String url = "http://localhost:8080/api/seats/"
                + seatId + "/hold";

        HttpClient client = HttpClient.newHttpClient();

        // Two threads simulate two users.
        ExecutorService executor =
                Executors.newFixedThreadPool(2);

        // Both threads wait for the same start signal.
        CountDownLatch start = new CountDownLatch(1);

        Callable<String> userA = () ->
                sendRequest(client, url, 1, start);

        Callable<String> userB = () ->
                sendRequest(client, url, 2, start);

        Future<String> resultA = executor.submit(userA);
        Future<String> resultB = executor.submit(userB);

        System.out.println("Starting both requests...");
        start.countDown();

        try {
            System.out.println(resultA.get());
            System.out.println(resultB.get());
        } finally {
            executor.shutdown();
        }
    }

    private static String sendRequest(
            HttpClient client,
            String url,
            int userId,
            CountDownLatch start) throws Exception {

        start.await();

        String json = "{\"userId\":" + userId + "}";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(10))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        HttpResponse<String> response = client.send(
                request,
                HttpResponse.BodyHandlers.ofString());

        return "User " + userId
                + " -> HTTP " + response.statusCode()
                + " -> " + response.body();
    }
}
