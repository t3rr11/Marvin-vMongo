import { Schema } from 'mongoose';

export const manifestsSchema = new Schema({
  name: String,
  version: String,
});