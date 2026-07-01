import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import {
  userRoute,
  contactFormRoute,
  authRoute,
  paperSubmissionRoute,
  journalRoute,
  issueRoute,
} from './routes';
import { notFound, errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Backend is running');
});

app.use('/auth', authRoute);
app.use('/users', userRoute);
app.use('/contact-forms', contactFormRoute);
app.use('/paper-submissions', paperSubmissionRoute);
app.use('/journals', journalRoute);
app.use('/issues', issueRoute);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
