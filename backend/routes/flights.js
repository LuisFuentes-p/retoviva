const express = require("express");

module.exports = ({ all }) => {
  const router = express.Router();

  router.get("/flights", async (req, res) => {
    try {
      const flights = await all(
        `SELECT id, origin, destination, number, departure_date, departure_time, return_date, return_time
         FROM flights
         ORDER BY id ASC`
      );

      res.json(
        flights.map((flight) => ({
          id: flight.id,
          origin: flight.origin,
          destination: flight.destination,
          number: flight.number,
          departureDate: flight.departure_date,
          departureTime: flight.departure_time,
          returnDate: flight.return_date,
          returnTime: flight.return_time,
        }))
      );
    } catch (error) {
      res.status(500).json({ message: "No fue posible obtener vuelos." });
    }
  });

  return router;
};
