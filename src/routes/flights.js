const express = require("express");
const router = express.Router();
const Flight = require("../models/flight");
const { default: axios } = require("axios");

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

router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const flight = await Flight.findByIdAndDelete(id);
    if (!flight) {
      return res.status(404).json({ message: "Flight not found" });
    }
    res.status(200).json({ message: "Flight deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred while deleting the flight", error });
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
        flight.availability.get(date).economy = availability.economy ?? null;
      }
      if (availability.hasOwnProperty("buisness")) {
        flight.availability.get(date).buisness = availability.buisness ?? null;
      }
    }

    await flight.save();
    res.status(200).json(flight);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/details", async (req, res) => {
  const {
    originAirportCode,
    destinationAirportCode,
    airlineCode,
    flightNumberInteger,
    day2Digits,
    month2Digits,
    year4Digits,
    classOfService,
  } = req.body;

  const date = `${year4Digits}-${month2Digits.padStart(
    2,
    "0",
  )}-${day2Digits.padStart(2, "0")}`;
  const flightNumber = `${airlineCode}${flightNumberInteger}`;

  try {
    const response = await axios.get(
      `http://api.aviationstack.com/v1/flights`,
      {
        params: {
          access_key: "1d63a4d2e46a57b87feb7e693d7801da",
          flight_date: date,
          dep_iata: originAirportCode,
          arr_iata: destinationAirportCode,
          flight_iata: flightNumber,
        },
      },
    );

    const flightData = response.data.data[0];

    if (!flightData) {
      return res.status(404).json({ message: "Flight not found" });
    }

    const departureTime = flightData.departure.scheduled || null;
    const arrivalTime = flightData.arrival.scheduled || null;

    const flightDurationMinutes = calculateFlightDuration(
      departureTime,
      arrivalTime,
    );

    const result = {
      originAirportCode,
      destinationAirportCode,
      airlineCode,
      flightNumberInteger,
      day2Digits: parseInt(day2Digits),
      month2Digits: parseInt(month2Digits),
      year4Digits: parseInt(year4Digits),
      classOfService: classOfService || null,
      departureTime: formatTime(departureTime),
      arrivalTime: formatTime(arrivalTime),
      flightDurationMinutes: flightDurationMinutes,
      dayOfArrival: new Date(arrivalTime).getDate() || "N/A",
      monthOfArrival: arrivalTime
        ? new Date(arrivalTime).getMonth() + 1
        : "N/A",
      yearOfArrival: arrivalTime ? new Date(arrivalTime).getFullYear() : "N/A",
      aircraftType: flightData?.aircraft ? flightData?.aircraft?.iata : "N/A",
      // price: classOfService ? calculatePrice(classOfService) : null,
    };

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching flight details" });
  }
});

function calculateFlightDuration(departure, arrival) {
  if (departure === "N/A" || arrival === "N/A") return "N/A";

  const departureDate = new Date(departure);
  const arrivalDate = new Date(arrival);

  const durationMilliseconds = arrivalDate - departureDate;
  const durationMinutes = Math.floor(durationMilliseconds / (1000 * 60));

  return durationMinutes;
}

function calculatePrice(classOfService) {
  const prices = {
    Economy: 1109,
    Business: 3500,
  };
  return prices[classOfService] || null;
}

function formatTime(dateTime) {
  if (!dateTime) return "N/A";

  const date = new Date(dateTime);

  if (isNaN(date.getTime())) {
    return "N/A";
  }

  return `${date.getUTCHours().toString().padStart(2, "0")}:${date
    .getUTCMinutes()
    .toString()
    .padStart(2, "0")}`;
}

module.exports = router;
