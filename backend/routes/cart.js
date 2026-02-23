const express = require("express");

module.exports = ({ get, all }) => {
  const router = express.Router();

  router.get("/cart", async (req, res) => {
    try {
      const booking = await get(
        `SELECT id, base_fare, taxes
         FROM bookings
         WHERE id = 1`
      );

      if (!booking) {
        res.status(404).json({ message: "No existe reservación activa." });
        return;
      }

      const selected = await all(
        `SELECT a.id, a.name, a.price
         FROM booking_addons ba
         JOIN addons a ON ba.addon_id = a.id
         WHERE ba.booking_id = ?`,
        [booking.id]
      );

      const addonsTotal = selected.reduce((sum, addon) => sum + addon.price, 0);
      const subtotal = booking.base_fare + booking.taxes;
      const total = subtotal + addonsTotal;

      res.json({
        bookingId: booking.id,
        subtotal,
        addonsTotal,
        total,
        selectedAddons: selected,
      });
    } catch (error) {
      res.status(500).json({ message: "No fue posible obtener el carrito." });
    }
  });

  return router;
};
