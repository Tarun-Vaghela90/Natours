require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean')
const hpp = require('hpp')
const helmet = require('helmet')
const cookieParser = require('cookie-parser');
const globalErrorHandler = require('./controllers/errorController')
const AppError = require('./utils/appError')
const tourRouter = require('./routes/toursRoutes');
const userRouter = require('./routes/userRoutes')
const reviewRouter = require('./routes/reviewRoutes')
const viewRouter = require('./routes/viewRoutes')
const bookingRouter = require('./routes/bookingRoutes');

require('./dev-data/data/import-dev-data'
)




app.set('view engine','pug');
app.set('views',path.join(__dirname,'views'))


// serve static files
app.use(express.static(path.join(__dirname, 'public')));


// 1)global middlewares

//set security HTTP Headers
// app.use(helmet())

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://unpkg.com",        // Leaflet
        "https://cdnjs.cloudflare.com", // Axios
        "https://js.stripe.com"     // Stripe
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://unpkg.com",        // Leaflet
        "https://fonts.googleapis.com" // Google Fonts
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com" // Google Fonts
      ],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://*.tile.openstreetmap.org'],
      connectSrc: ["'self'", "https://*.tiles.mapbox.com", "https://api.mapbox.com", "https://events.mapbox.com"],
      frameSrc: ["'self'", "https://js.stripe.com"],
    },
  })
);

// development logging

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

//  limit  requests from  same API

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too Many Request From This IP, Please try again in an hour !'
})

app.use('/api', limiter)

// body parser
// 👇 Add this if missing
app.use(express.urlencoded({ extended: true }));

app.use(express.json({ limit: '10kb' }));

// data sanitazation  against  NoSQl  query injection
app.use((req, _res, next) => {
  Object.defineProperty(req, 'query', {
    ...Object.getOwnPropertyDescriptor(req, 'query'),
    value: req.query,
    writable: true,
  })

  next()
})
app.use(mongoSanitize());

//  data sanitazaion against XSS

app.use(xss())

// prevent parameter pollution
app.use(
  hpp({
    whitelist: ['duration', 'ratingQuantity', 'ratingAverage', 'maxGroupSize', 'difficulty', 'price']
  })
);
//  cockie parser
app.use(cookieParser());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next()
})

// 3) routes

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);



app.all('/*splat', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

app.listen(3000, () => {
  console.log("Server is Running on http://localhost:3000");
});
