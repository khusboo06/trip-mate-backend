const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const optionSchema = new Schema({ text: String, votes: [{ type: Schema.Types.ObjectId, ref: 'User' }] });


const pollSchema = new Schema({ trip: { type: Schema.Types.ObjectId, ref: 'Trip' }, question: String, options: [optionSchema], createdBy: { type: Schema.Types.ObjectId, ref: 'User' }, createdAt: { type: Date, default: Date.now }, expiresAt: Date });


module.exports = mongoose.model('Poll', pollSchema);