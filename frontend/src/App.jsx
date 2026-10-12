import { useState } from 'react';
import './App.css';

function App() {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [search, setSearch] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSearch(event) {
    event.preventDefault();

    setMessage('');
    setSearch(null);

    const start = pickup.trim();
    const end = destination.trim();

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
      const response = await fetch(
        'http://localhost:8080/api/rides/search',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            pickup: start,
            destination: end
          })
        }
      );

      if (!response.ok) {
        throw new Error('Ride search failed.');
      }

      const data = await response.json();

      setSearch({
        pickup: start,
        destination: end,
        rides: Array.isArray(data) ? data : []
      });

      if (!Array.isArray(data) || data.length === 0) {
        setMessage(
          'No available rides found for this route. Please try another route.'
        );
      }
    } catch (error) {
      setMessage(
        'Could not connect to RideSync. Please make sure the backend is running.'
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
  }

  async function handleBooking(ride) {
    const passenger = prompt('Enter your name:');

    if (!passenger || !passenger.trim()) {
      return;
    }

    const seats = prompt('How many seats do you want to book?');

    if (!seats || !/^\d+$/.test(seats.trim()) ||
        Number(seats) < 1) {
      alert('Please enter a valid number of seats.');
      return;
    }

    if (Number(seats) > Number(ride.seats)) {
      alert('Not enough seats are available.');
      return;
    }

    try {
      const response = await fetch(
        'http://localhost:8080/api/rides/book',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            rideId: String(ride.id),
            passenger: passenger.trim(),
            seats: String(seats)
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
          data.error ||
          'Booking failed.'
        );
        return;
      }

      alert(
        'Ride booked successfully! Booking ID: ' +
        data.bookingId
      );

      await handleSearch({ preventDefault: () => {} });
    } catch (error) {
      alert('Could not connect to the backend.');
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
            <p className="tagline">
              YOUR JOURNEY, SIMPLIFIED
            </p>

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

            <div className="car">🚘</div>

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
            <p className="tagline">
              LET'S GET YOU THERE
            </p>

            <h2>Where would you like to go?</h2>

            <p>
              Enter your starting point and destination
              to find matching rides.
            </p>
          </div>

          <form
            className="booking-form"
            onSubmit={handleSearch}
          >
            <label>
              Pickup Location
              <input
                type="text"
                placeholder="Enter pickup location"
                value={pickup}
                onChange={(event) =>
                  setPickup(event.target.value)
                }
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
              disabled={loading}
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
            <div
              className="search-results"
              aria-live="polite"
            >
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
                search.rides.map((ride, index) => (
                  <div
                    className="ride-card"
                    key={ride.id ?? index}
                  >
                    <h3>
                      🚘 {ride.driver ||
                        'Driver details unavailable'}
                    </h3>

                    <p>
                      <strong>Pickup:</strong>{' '}
                      {ride.pickup}
                    </p>

                    <p>
                      <strong>Destination:</strong>{' '}
                      {ride.destination}
                    </p>

                    <p>
                      <strong>Available seats:</strong>{' '}
                      {ride.seats}
                    </p>

                    <p>
                      <strong>Departure Time:</strong>{' '}
                      {ride.departureTime ??
                        ride.departure_time ??
                        'Time not provided'}
                    </p>

                    <p>
                      <strong>Price per Seat:</strong>{' '}
                      {ride.pricePerSeat != null
                        ? `₹${ride.pricePerSeat}`
                        : ride.price_per_seat != null
                        ? `₹${ride.price_per_seat}`
                        : 'Price not provided'}
                    </p>

                    <p>
                      <strong>Availability:</strong>{' '}
                      {ride.availability ||
                        (Number(ride.seats) > 0
                          ? 'Available'
                          : 'Full')}
                    </p>

                    <button
                      type="button"
                      className="search-btn"
                      disabled={Number(ride.seats) <= 0}
                      onClick={() => handleBooking(ride)}
                    >
                      Book Ride
                    </button>
                  </div>
                ))
              ) : (
                <p>
                  No matching rides are currently available.
                </p>
              )}

              <button
                type="button"
                className="search-btn"
                onClick={handleReset}
              >
                Search Another Route
              </button>
            </div>
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

        <small>
          © 2026 RideSync. All rights reserved.
        </small>
      </footer>
    </div>
  );
}

export default App;