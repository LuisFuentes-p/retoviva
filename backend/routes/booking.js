const express = require("express");

module.exports = ({ get, all, run }) => {
  const router = express.Router();

  router.get("/booking", async (req, res) => {
    try {
      const booking = await get(
        `SELECT b.id, b.reference, b.base_fare, b.taxes, f.origin, f.destination, f.number,
                f.departure_date, f.departure_time, f.return_date, f.return_time, p.name as passenger_name
         FROM bookings b
         JOIN flights f ON b.flight_id = f.id
         JOIN passengers p ON b.passenger_id = p.id
         WHERE b.id = 1`
      );

      if (!booking) {
        res.status(404).json({ message: "No existe reservación activa." });
        return;
      }

      const addons = await all(`SELECT id, name, description, price, is_featured FROM addons`);
      const selectedAddons = await all(`SELECT addon_id FROM booking_addons WHERE booking_id = 1`);

      res.json({
        booking: {
          id: booking.id,
          reference: booking.reference,
          baseFare: booking.base_fare,
          taxes: booking.taxes,
        },
        passenger: {
          name: booking.passenger_name,
        },
        flight: {
          origin: booking.origin,
          destination: booking.destination,
          number: booking.number,
          departureDate: booking.departure_date,
          departureTime: booking.departure_time,
          returnDate: booking.return_date,
          returnTime: booking.return_time,
        },
        addons: addons.map((addon) => ({
          id: addon.id,
          name: addon.name,
          description: addon.description,
          price: addon.price,
          isFeatured: addon.is_featured === 1,
        })),
        selectedAddons: selectedAddons.map((item) => item.addon_id),
      });
    } catch (error) {
      res.status(500).json({ message: "No fue posible obtener la reservación." });
    }
  });

  router.post("/promo", async (req, res) => {
    try {
      const code = String(req.body.code || "").toUpperCase();
      if (!code) {
        res.json({ applied: false, message: "Ingresa un código promocional." });
        return;
      }

      const promo = await get(`SELECT discount, active FROM promos WHERE code = ?`, [code]);
      if (!promo || promo.active === 0) {
        res.json({ applied: false, message: "Código inválido. Intenta con VIVA2026." });
        return;
      }

      res.json({
        applied: true,
        discount: promo.discount,
        message: `Código aplicado: descuento de $${promo.discount} MXN.`,
      });
    } catch (error) {
      res.status(500).json({ applied: false, message: "No fue posible aplicar el código." });
    }
  });

  router.post("/pay", async (req, res) => {
    try {
      const bookingId = Number(req.body.bookingId || 1);
      const addonIds = Array.isArray(req.body.addons) ? req.body.addons : [];
      const promoCode = req.body.promoCode ? String(req.body.promoCode).toUpperCase() : null;

      const booking = await get(`SELECT base_fare, taxes FROM bookings WHERE id = ?`, [bookingId]);
      if (!booking) {
        res.status(404).json({ status: "error", message: "Reservación no encontrada." });
        return;
      }

      const addons = addonIds.length
        ? await all(`SELECT price FROM addons WHERE id IN (${addonIds.map(() => "?").join(",")})`, addonIds)
        : [];

      const addonTotal = addons.reduce((sum, addon) => sum + addon.price, 0);

      let discount = 0;
      if (promoCode) {
        const promo = await get(`SELECT discount FROM promos WHERE code = ?`, [promoCode]);
        discount = promo ? promo.discount : 0;
      }

      const total = Math.max(booking.base_fare + booking.taxes + addonTotal - discount, 0);
      const now = new Date().toISOString();
      await run(`INSERT INTO payments (booking_id, total, created_at) VALUES (?, ?, ?)`, [bookingId, total, now]);

      res.json({
        status: "ok",
        message: "Pago simulado exitoso. Se envió el itinerario al correo registrado.",
        total,
      });
    } catch (error) {
      res.status(500).json({ status: "error", message: "No fue posible procesar el pago." });
    }
  });

  return router;
};
