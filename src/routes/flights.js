const express = require("express");
const router = express.Router();
const Flight = require("../models/flight");

router.post("/create", async (req, res) => {
  const { origin, destination, airline } = req.body;

  try {
    const newFlight = new Flight({
      origin,
      destination,
      airline,
    });

    const savedFlight = await newFlight.save();
    res.status(201).json(savedFlight);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/all", async (req, res) => {
  try {
    const flights = await Flight.find().sort({ createdAt: -1 });
    res.status(200).json(flights);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/update-program/:id", async (req, res) => {
  const { id } = req.params;
  const { program } = req.body;

  try {
    const updatedFlight = await Flight.findByIdAndUpdate(
      id,
      { program },
      { new: true },
    );

    if (!updatedFlight) {
      return res.status(404).json({ message: "Flight not found" });
    }

    res.status(200).json(updatedFlight);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/update-availability/:id", async (req, res) => {
  const { id } = req.params;
  const availabilityUpdates = req.body;

  try {
    const flight = await Flight.findById(id);

    if (!flight) {
      return res.status(404).json({ message: "Flight not found" });
    }

    for (const [date, availability] of Object.entries(availabilityUpdates)) {
      if (!flight.availability.has(date)) {
        flight.availability.set(date, {});
      }
      if (availability.hasOwnProperty("economy")) {
        flight.availability.get(date).economy = availability.economy;
      }
      if (availability.hasOwnProperty("buisness")) {
        flight.availability.get(date).buisness = availability.buisness;
      }
    }

    await flight.save();
    res.status(200).json(flight);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
