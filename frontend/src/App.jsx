import { useState } from 'react';
import './App.css';

const API_BASE_URL = 'http://localhost:8080/api/rides';

async function readResponse(response) {
  const text = await response.text();

  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed (${response.status})`
    );
  }

  return data;
}

function App() {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [search, setSearch] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  async function searchRides(start, end) {
    const response = await fetch(`${API_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pickup: start,
        destination: end,
      }),
    });

    const data = await readResponse(response);

    // Supports either an array or an object containing rides.
    const rides = Array.isArray(data)
      ? data
      : Array.isArray(data?.rides)
        ? data.rides
        : null;

    if (!rides) {
      throw new Error(
        'Unexpected response from the server. Expected a list of rides.'
      );
    }

    setSearch({
      pickup: start,
      destination: end,
      rides,
    });

    if (rides.length === 0) {
      setMessage(
        'No available rides found for this route. Try another route.'
      );
    }

    return rides;
  }

  async function handleSearch(event) {
    event.preventDefault();

    const start = pickup.trim();
    const end = destination.trim();

    setMessage('');
    setBookingId('');
    setSearch(null);

    if (!start || !end) {
      setMessage('Please enter both pickup and destination.');
      return;
    }

    if (start.toLowerCase() === end.toLowerCase()) {
      setMessage('Pickup and destination must be different.');
      return;
    }

    setLoading(true);

    try {
      await searchRides(start, end);
    } catch (error) {
      setMessage(
        error.message ||
          'Could not connect to RideSync. Check whether the backend is running.'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setPickup('');
    setDestination('');
    setSearch(null);
    setMessage('');
    setBookingId('');
  }

  async function handleBooking(ride) {
    if (bookingLoading) return;

    const availableSeats = Number(ride.seats);

    if (
      ride.id == null ||
      !Number.isInteger(availableSeats) ||
      availableSeats <= 0
    ) {
      setMessage('This ride has invalid details or no available seats.');
      return;
    }

    const passenger = window.prompt('Enter your name:');

    if (passenger === null || !passenger.trim()) {
      return;
    }

    const seatsInput = window.prompt(
      `How many seats do you want to book? (Available: ${availableSeats})`
    );

    if (seatsInput === null) return;

    const seatsText = seatsInput.trim();
    const seats = Number(seatsText);

    if (
      !/^\d+$/.test(seatsText) ||
      !Number.isSafeInteger(seats) ||
      seats < 1
    ) {
      window.alert('Please enter a valid positive number of seats.');
      return;
    }

    if (seats > availableSeats) {
      window.alert('Not enough seats are available.');
      return;
    }

    setBookingLoading(true);
    setMessage('');
    setBookingId('');

    try {
      const response = await fetch(`${API_BASE_URL}/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rideId: ride.id,
          passenger: passenger.trim(),
          seats,
        }),
      });

      const data = await readResponse(response);

      setBookingId(
        data?.bookingId != null
          ? String(data.bookingId)
          : ''
      );

      window.alert(
        data?.bookingId != null
          ? `Ride booked successfully! Booking ID: ${data.bookingId}`
          : 'Ride booked successfully!'
      );

      // Refresh results directly without simulating a form event.
      await searchRides(
        search.pickup,
        search.destination
      );

      setMessage('Booking completed successfully.');
    } catch (error) {
      setMessage(
        error.message ||
          'Booking failed. Please check your connection and try again.'
      );
    } finally {
      setBookingLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="navbar">
        <a className="logo" href="#home">
          Ride<span>Sync</span>
        </a>

        <nav>
          <a href="#home">Home</a>
          <a href="#book">Book a Ride</a>
          <a href="#about">About</a>
        </nav>

        <a className="login-btn" href="#book">
          Get Started
        </a>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-content">
            <p className="tagline">YOUR JOURNEY, SIMPLIFIED</p>

            <h1>
              Move smarter.
              <br />
              Travel <span>together.</span>
            </h1>

            <p className="description">
              Welcome to RideSync, your simple way to plan
              your next journey. Enter your locations to find
              available carpool rides.
            </p>

            <a className="primary-btn" href="#book">
              Plan Your Ride →
            </a>
          </div>

          <div className="hero-visual">
            <div className="circle circle-one"></div>
            <div className="circle circle-two"></div>
            <div className="route-line"></div>

            <div className="location-card pickup-card">
              <span className="location-dot"></span>
              <div>
                <small>YOUR PICKUP</small>
                <strong>Start your journey</strong>
              </div>
            </div>

            <div className="car" aria-label="Car">
              🚘
            </div>

            <div className="location-card destination-card">
              <span className="destination-dot"></span>
              <div>
                <small>YOUR DESTINATION</small>
                <strong>Where to next?</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="booking-section" id="book">
          <div className="section-heading">
            <p className="tagline">LET'S GET YOU THERE</p>
            <h2>Where would you like to go?</h2>
            <p>
              Enter your starting point and destination
              to find matching rides.
            </p>
          </div>

          <form className="booking-form" onSubmit={handleSearch}>
            <label>
              Pickup Location
              <input
                type="text"
                placeholder="Enter pickup location"
                value={pickup}
                onChange={(event) => setPickup(event.target.value)}
                required
              />
            </label>

            <label>
              Destination
              <input
                type="text"
                placeholder="Enter destination"
                value={destination}
                onChange={(event) =>
                  setDestination(event.target.value)
                }
                required
              />
            </label>

            <button
              type="submit"
              className="search-btn"
              disabled={loading || bookingLoading}
            >
              {loading ? 'Searching...' : 'Find a Ride'}
            </button>
          </form>

          {message && (
            <p className="form-message" role="status">
              {message}
            </p>
          )}

          {search && (
            <div className="search-results" aria-live="polite">
              <h2>Available Rides</h2>

              <div className="journey-detail">
                <span className="location-dot"></span>
                <div>
                  <small>PICKUP LOCATION</small>
                  <strong>{search.pickup}</strong>
                </div>
              </div>

              <div className="journey-detail">
                <span className="destination-dot"></span>
                <div>
                  <small>DESTINATION</small>
                  <strong>{search.destination}</strong>
                </div>
              </div>

              {search.rides.length > 0 ? (
                search.rides.map((ride, index) => {
                  const seats = Number(ride.seats ?? 0);
                  const price =
                    ride.pricePerSeat ??
                    ride.price_per_seat;

                  return (
                    <div
                      className="ride-card"
                      key={ride.id ?? index}
                    >
                      <h3>
                        🚘{' '}
                        {ride.driver ||
                          'Driver details unavailable'}
                      </h3>

                      <p>
                        <strong>Pickup:</strong>{' '}
                        {ride.pickup || 'Not provided'}
                      </p>

                      <p>
                        <strong>Destination:</strong>{' '}
                        {ride.destination || 'Not provided'}
                      </p>

                      <p>
                        <strong>Available seats:</strong>{' '}
                        {Number.isFinite(seats) ? seats : 'Unknown'}
                      </p>

                      <p>
                        <strong>Departure Time:</strong>{' '}
                        {ride.departureTime ??
                          ride.departure_time ??
                          'Time not provided'}
                      </p>

                      <p>
                        <strong>Price per Seat:</strong>{' '}
                        {price != null
                          ? `₹${price}`
                          : 'Price not provided'}
                      </p>

                      <p>
                        <strong>Availability:</strong>{' '}
                        {ride.availability ||
                          (seats > 0 ? 'Available' : 'Full')}
                      </p>

                      <button
                        type="button"
                        className="search-btn"
                        disabled={
                          bookingLoading ||
                          !Number.isInteger(seats) ||
                          seats <= 0 ||
                          ride.id == null
                        }
                        onClick={() => handleBooking(ride)}
                      >
                        {bookingLoading
                          ? 'Processing...'
                          : 'Book Ride'}
                      </button>
                    </div>
                  );
                })
              ) : (
                <p>No matching rides are currently available.</p>
              )}

              <button
                type="button"
                className="search-btn"
                onClick={handleReset}
                disabled={bookingLoading}
              >
                Search Another Route
              </button>
            </div>
          )}

          {bookingId && (
            <p className="form-message" role="status">
              Your booking reference is {bookingId}.
            </p>
          )}
        </section>

        <section className="about-section" id="about">
          <h2>Travel made simpler with RideSync</h2>
          <p>
            A user-friendly platform designed to make planning
            your journey easier and more convenient.
          </p>
        </section>
      </main>

      <footer>
        <a className="logo" href="#home">
          Ride<span>Sync</span>
        </a>

        <p>Making every journey simpler.</p>

        <small>© 2026 RideSync. All rights reserved.</small>
      </footer>
    </div>
  );
}

export default App;