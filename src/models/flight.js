const mongoose = require("mongoose");

const flightSchema = new mongoose.Schema({
  origin: {
    type: String,
    required: true,
  },
  destination: {
    type: String,
    required: true,
  },
  airline: {
    type: String,
    required: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  program: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  availability: {
    type: Map,
    of: new mongoose.Schema({
      economy: {
        type: Boolean,
        default: null,
      },
      buisness: {
        type: Boolean,
        default: null,
      },
    }),
    default: {},
  },
});

flightSchema.pre("save", function (next) {
  this.lastUpdated = Date.now();
  next();
});

flightSchema.pre("findOneAndUpdate", function (next) {
  this.set({ lastUpdated: Date.now() });
  next();
});

flightSchema.pre("updateOne", function (next) {
  this.set({ lastUpdated: Date.now() });
  next();
});

const Flight = mongoose.model("Flight", flightSchema);

module.exports = Flight;
