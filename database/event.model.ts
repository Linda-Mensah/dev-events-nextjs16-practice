import { Schema, model, models, type Document, type Model } from 'mongoose';

// Strongly typed Event document
export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string; // normalized as YYYY-MM-DD
  time: string; // normalized as HH:mm (24h)
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Helper to create URL‑friendly slugs from titles
const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Validate non-empty string
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

// Validate non-empty string array
const isNonEmptyStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);

export type EventModel = Model<IEvent>;

const EventSchema = new Schema<IEvent, EventModel>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: 'Title is required.',
      },
    },
    slug: {
      type: String,
      unique: true,
      index: true,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: 'Description is required.',
      },
    },
    overview: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: 'Overview is required.',
      },
    },
    image: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: 'Image is required.',
      },
    },
    venue: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: 'Venue is required.',
      },
    },
    location: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: 'Location is required.',
      },
    },
    date: {
      type: String,
      required: true,
      trim: true,
      // Normalized in pre-save; here only ensure non-empty
      validate: {
        validator: isNonEmptyString,
        message: 'Date is required.',
      },
    },
    time: {
      type: String,
      required: true,
      trim: true,
      // Normalized in pre-save; here only ensure non-empty
      validate: {
        validator: isNonEmptyString,
        message: 'Time is required.',
      },
    },
    mode: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: 'Mode is required.',
      },
    },
    audience: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: 'Audience is required.',
      },
    },
    agenda: {
      type: [String],
      required: true,
      validate: {
        validator: isNonEmptyStringArray,
        message: 'Agenda must contain at least one non-empty item.',
      },
    },
    organizer: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: 'Organizer is required.',
      },
    },
    tags: {
      type: [String],
      required: true,
      validate: {
        validator: isNonEmptyStringArray,
        message: 'Tags must contain at least one non-empty item.',
      },
    },
  },
  {
    // Mongoose manages createdAt/updatedAt
    timestamps: true,
    strict: true,
  },
);

// Pre-save hook: generate slug, normalize date/time, and validate business rules
EventSchema.pre<IEvent>('save', function preSave(next) {
  try {
    // Generate slug only when title changes or slug missing
    if (this.isModified('title') || !this.slug) {
      if (!isNonEmptyString(this.title)) {
        return next(new Error('Event title is required.'));
      }
      this.slug = slugify(this.title);
    }

    // Validate and normalize date to ISO YYYY-MM-DD
    if (this.isModified('date')) {
      if (!isNonEmptyString(this.date)) {
        return next(new Error('Event date is required.'));
      }
      const parsedDate = new Date(this.date);
      if (Number.isNaN(parsedDate.getTime())) {
        return next(new Error('Invalid event date.'));
      }
      this.date = parsedDate.toISOString().slice(0, 10);
    }

    // Validate and normalize time to HH:mm (24-hour)
    if (this.isModified('time')) {
      if (!isNonEmptyString(this.time)) {
        return next(new Error('Event time is required.'));
      }
      const timeMatch = this.time.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
      if (!timeMatch) {
        return next(new Error('Time must be in HH:mm format.'));
      }
      const hours = Number(timeMatch[1]);
      const minutes = Number(timeMatch[2]);
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return next(new Error('Invalid time value.'));
      }
      this.time = `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}`;
    }

    // Final guard to ensure required string fields are non-empty
    const requiredStringFields: (keyof IEvent)[] = [
      'title',
      'description',
      'overview',
      'image',
      'venue',
      'location',
      'date',
      'time',
      'mode',
      'audience',
      'organizer',
    ];

    for (const field of requiredStringFields) {
      const value = this[field];
      if (!isNonEmptyString(value)) {
        return next(new Error(`Field "${field}" is required.`));
      }
    }

    if (!isNonEmptyStringArray(this.agenda)) {
      return next(new Error('Agenda must contain at least one non-empty item.'));
    }

    if (!isNonEmptyStringArray(this.tags)) {
      return next(new Error('Tags must contain at least one non-empty item.'));
    }

    return next();
  } catch (err) {
    return next(err as Error);
  }
});

export const Event: EventModel =
  (models.Event as EventModel | undefined) || model<IEvent, EventModel>('Event', EventSchema);
