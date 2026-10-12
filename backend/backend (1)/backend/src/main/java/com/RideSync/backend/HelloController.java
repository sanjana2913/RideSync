package com.RideSync.backend;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.RideSync.backend.model.Booking;
import com.RideSync.backend.repository.BookingRepository;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class HelloController {

    private final List<Map<String, String>> rides = new ArrayList<>();
    private final BookingRepository bookingRepository;

    public HelloController(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;

        addSampleRide("Driver 1", "Hyderabad", "Warangal",
                "3", "09:00 AM", "500");

        addSampleRide("Driver 2", "Warangal", "Hyderabad",
                "4", "10:30 AM", "550");

        addSampleRide("Driver 3", "Hyderabad", "Karimnagar",
                "2", "11:00 AM", "600");

        addSampleRide("Driver 4", "Secunderabad", "Warangal",
                "3", "02:00 PM", "450");

        addSampleRide("Driver 5", "Warangal", "Hyderabad",
                "3", "04:00 PM", "500");

        addSampleRide("Driver 6", "Hyderabad", "Warangal",
                "2", "06:30 PM", "650");

        addSampleRide("Driver 7", "Hyderabad", "Vijayawada",
                "3", "07:00 AM", "800");

        addSampleRide("Driver 8", "Vijayawada", "Hyderabad",
                "4", "05:00 PM", "850");

        addSampleRide("Driver 9", "Hyderabad", "Karimnagar",
                "6", "08:30 AM", "600");

        addSampleRide("Driver 10", "Karimnagar", "Hyderabad",
                "2", "03:30 PM", "620");
        
        addSampleRide("Driver 11", "uppal", "anurag university",
                "4", "07:30 PM", "100");
              
    }

    private void addSampleRide(
            String driver,
            String pickup,
            String destination,
            String seats,
            String departureTime,
            String pricePerSeat) {

        Map<String, String> ride = new HashMap<>();

        ride.put("id", String.valueOf(rides.size() + 1));
        ride.put("driver", driver);
        ride.put("pickup", pickup);
        ride.put("destination", destination);
        ride.put("seats", seats);
        ride.put("departureTime", departureTime);
        ride.put("pricePerSeat", pricePerSeat);
        ride.put("availability", "Available");

        rides.add(ride);
    }

    @GetMapping("/")
    public String home() {
        return "RideSync backend is running!";
    }

    @PostMapping("/api/rides")
    public synchronized Map<String, String> addRide(
            @RequestBody Map<String, String> request) {

        String driver = request.get("driver");
        String pickup = request.get("pickup");
        String destination = request.get("destination");
        String seats = request.get("seats");
        String departureTime = request.get("departureTime");
        String pricePerSeat = request.get("pricePerSeat");

        if (driver == null || driver.isBlank()
                || pickup == null || pickup.isBlank()
                || destination == null || destination.isBlank()
                || seats == null || !seats.matches("\\d+")
                || departureTime == null || departureTime.isBlank()
                || pricePerSeat == null || pricePerSeat.isBlank()
                || pickup.trim().equalsIgnoreCase(destination.trim())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please provide driver, pickup, destination, seats, departureTime and pricePerSeat.");
        }

        int seatCount;

        try {
            seatCount = Integer.parseInt(seats);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid seat count.");
        }

        if (seatCount < 1) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "At least one seat is required.");
        }

        BigDecimal price;

        try {
            price = new BigDecimal(pricePerSeat);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please provide a valid price per seat.");
        }

        if (price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Price per seat must be greater than zero.");
        }

        Map<String, String> ride = new HashMap<>();

        ride.put("id", String.valueOf(rides.size() + 1));
        ride.put("driver", driver.trim());
        ride.put("pickup", pickup.trim());
        ride.put("destination", destination.trim());
        ride.put("seats", String.valueOf(seatCount));
        ride.put("departureTime", departureTime.trim());
        ride.put("pricePerSeat", price.stripTrailingZeros().toPlainString());
        ride.put("availability", "Available");

        rides.add(ride);

        return new HashMap<>(ride);
    }

    @PostMapping("/api/rides/search")
    public synchronized List<Map<String, String>> searchRide(
            @RequestBody Map<String, String> request) {

        String pickup = request.get("pickup");
        String destination = request.get("destination");

        List<Map<String, String>> matchingRides = new ArrayList<>();

        if (pickup == null || destination == null
                || pickup.isBlank() || destination.isBlank()) {
            return matchingRides;
        }

        for (Map<String, String> ride : rides) {
            if (ride.get("pickup").equalsIgnoreCase(pickup.trim())
                    && ride.get("destination")
                            .equalsIgnoreCase(destination.trim())
                    && Integer.parseInt(ride.get("seats")) > 0) {

                matchingRides.add(new HashMap<>(ride));
            }
        }

        return matchingRides;
    }

    @PostMapping("/api/rides/book")
    public synchronized Map<String, String> bookRide(
            @RequestBody Map<String, String> request) {

        String rideId = request.get("rideId");
        String passenger = request.get("passenger");
        String requestedSeats = request.get("seats");

        if (rideId == null || rideId.isBlank()
                || passenger == null || passenger.isBlank()
                || requestedSeats == null
                || !requestedSeats.matches("\\d+")) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please provide rideId, passenger and seat count.");
        }

        int seatsToBook = Integer.parseInt(requestedSeats);

        if (seatsToBook < 1) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please book at least one seat.");
        }

        Map<String, String> selectedRide = null;

        for (Map<String, String> ride : rides) {
            if (ride.get("id").equals(rideId)) {
                selectedRide = ride;
                break;
            }
        }

        if (selectedRide == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Ride not found.");
        }

        int availableSeats = Integer.parseInt(selectedRide.get("seats"));

        if (availableSeats < seatsToBook) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Not enough seats are available.");
        }

        // Save the booking in MySQL.
        Booking booking = new Booking();
        booking.setPassengerName(passenger.trim());
        booking.setPickup(selectedRide.get("pickup"));
        booking.setDestination(selectedRide.get("destination"));
        booking.setSeatsBooked(seatsToBook);

        Booking savedBooking = bookingRepository.save(booking);

        // Update available seats after the booking is saved.
        int remainingSeats = availableSeats - seatsToBook;

        selectedRide.put("seats", String.valueOf(remainingSeats));
        selectedRide.put(
                "availability",
                remainingSeats == 0 ? "Full" : "Available");

        Map<String, String> response = new HashMap<>();

        response.put("bookingId", String.valueOf(savedBooking.getId()));
        response.put("rideId", rideId);
        response.put("passenger", savedBooking.getPassengerName());
        response.put("pickup", savedBooking.getPickup());
        response.put("destination", savedBooking.getDestination());
        response.put(
                "seatsBooked",
                String.valueOf(savedBooking.getSeatsBooked()));
        response.put("departureTime", selectedRide.get("departureTime"));
        response.put("pricePerSeat", selectedRide.get("pricePerSeat"));
        response.put("status", "Confirmed");

        return response;
    }

    @GetMapping("/api/bookings")
    public List<Map<String, String>> getBookings() {

        List<Map<String, String>> result = new ArrayList<>();

        for (Booking booking : bookingRepository.findAll()) {
            Map<String, String> item = new HashMap<>();

            item.put("bookingId", String.valueOf(booking.getId()));
            item.put("passenger", booking.getPassengerName());
            item.put("pickup", booking.getPickup());
            item.put("destination", booking.getDestination());
            item.put(
                    "seatsBooked",
                    String.valueOf(booking.getSeatsBooked()));
            item.put("status", "Confirmed");

            result.add(item);
        }

        return result;
    }
}