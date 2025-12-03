const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const splitSchema = new Schema({ user:{
    type: Schema.Types.ObjectId, ref: 'User' },
    amount: Number 
});


const expenseSchema = new Schema({ trip: { type: Schema.Types.ObjectId, ref: 'Trip' }, title: String, amount: Number, paidBy: { type: Schema.Types.ObjectId, ref: 'User' }, splits: [splitSchema], splitType: { type: String, enum: ['equal','custom'], default: 'equal' }, date: { type: Date, default: Date.now }, note: String });


module.exports = mongoose.model('Expense', expenseSchema);