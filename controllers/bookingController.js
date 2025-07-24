const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');

// exports.getCheckoutSession = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findById(req.params.tourId);

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   const session = await stripe.checkout.sessions.create({
//     payment_method_types: ['card'],
//     mode: 'payment',
//     success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
//     cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
//     customer_email: req.user.email,
//     client_reference_id: req.params.tourId,
//     line_items: [
//       {
//         price_data: {
//           currency: 'usd',
//           unit_amount: tour.price * 100,
//           product_data: {
//             name: `${tour.name} Tour`,
//             description: tour.summary,
//             images: [`https://www.natours.dev/img/tours/${tour.imageCover}`]
//           }
//         },
//         quantity: 1
//       }
//     ]
//   });

//   res.status(200).json({
//     status: 'success',
//     session
//   });
// });

// CRUD operations using handler factory
exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.createBooking = factory.createOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);

// Optional: Get My Bookings
exports.getMyBookings = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user.id }).populate('tour');

  res.status(200).render('myBookings', {
    title: 'My Bookings',
    bookings
  });
});
