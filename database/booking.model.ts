import { Schema, model, models, type Document, type Model, type Types } from 'mongoose';
import { Event } from './event.model';

// Strongly typed Booking document
export interface IBooking extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingModel = Model<IBooking>;

// Simple email validation; more strict validation can be applied upstream
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BookingSchema = new Schema<IBooking, BookingModel>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true, // Speeds up lookups by event
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (value: string): boolean => emailRegex.test(value),
        message: 'Email must be a valid email address.',
      },
    },
  },
  {
    // Mongoose manages createdAt/updatedAt
    timestamps: true,
    strict: true,
  },
);

// Pre-save hook: ensure referenced event exists and email is valid
BookingSchema.pre<IBooking>('save', async function preSave(next) {
  try {
    if (!this.eventId) {
      return next(new Error('eventId is required.'));
    }

    // Ensure the referenced Event exists before creating the booking
    const eventExists = await Event.exists({ _id: this.eventId });
    if (!eventExists) {
      return next(new Error('Referenced event does not exist.'));
    }

    if (!this.email || !emailRegex.test(this.email)) {
      return next(new Error('Email must be a valid email address.'));
    }

    return next();
  } catch (err) {
    return next(err as Error);
  }
});

export const Booking: BookingModel =
  (models.Booking as BookingModel | undefined) ||
  model<IBooking, BookingModel>('Booking', BookingSchema);
