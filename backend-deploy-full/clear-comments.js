
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in .env');
  process.exit(1);
}

async function clearComments() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Define schemas if not imported (using loose definition for deletion)
    const CommentSchema = new mongoose.Schema({}, { strict: false });
    const EventCommentSchema = new mongoose.Schema({}, { strict: false });

    const CommentModel = mongoose.model('Comment', CommentSchema);
    const EventCommentModel = mongoose.model('EventComment', EventCommentSchema);
    const TutorialCommentModel = mongoose.model('TutorialComment', new mongoose.Schema({}, { strict: false }));

    const r1 = await CommentModel.deleteMany({});
    console.log(`Deleted ${r1.deletedCount} post comments`);

    const r2 = await EventCommentModel.deleteMany({});
    console.log(`Deleted ${r2.deletedCount} event comments`);
    
    const r3 = await TutorialCommentModel.deleteMany({});
    console.log(`Deleted ${r3.deletedCount} tutorial comments`);

    console.log('All comments cleared successfully');
  } catch (error) {
    console.error('Error clearing comments:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

clearComments();
