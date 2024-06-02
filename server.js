const express = require('express');
const bodyParser = require('body-parser');
const admin = require('./route/admin');
const driver = require('./route/driver');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const systeminformation = require('systeminformation'); // Ensure you have systeminformation module installed
const Driver = require('./models/Driver');
const Warranty = require('./models/Warranty');
const app = express();
const port = 3001;

// Connect to MongoDB
mongoose
  .connect('mongodb://localhost/device-check', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected...'))
  .catch((err) => console.log(err));

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));
app.use('/admin', admin);
app.use('/driver', driver);
// Configure Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Append the extension of the original file
  },
});
const upload = multer({ storage: storage });

// Home Route
app.get('/', (req, res) => {
  res.render('index');
});

// Device Check Route
app.get('/check-device', async (req, res) => {
  try {
    // Fetch BIOS information using systeminformation module
    const biosInfo = await systeminformation.bios();

    // Determine if the vendor is Dell
    const isDell = biosInfo.vendor.toLowerCase() === 'dell';
    console.log(isDell);
    if (isDell) {
      // Render page with options for Dell users
      res.render('check-device-dell', { serial: biosInfo.serial });
    } else {
      // Render page with options for non-Dell users
      res.render('check-device', { serial: biosInfo.serial });
    }
  } catch (error) {
    console.error('Error fetching BIOS information:', error);
    res.status(500).send('Failed to retrieve BIOS information');
  }
});

// Route to get BIOS information
app.get('/get-bios-info', async (req, res) => {
  try {
    // Fetch BIOS information using systeminformation module
    const biosInfo = await systeminformation.bios();
    console.log(biosInfo);
    // Construct object with model number and serial number
    const deviceInfo = {
      model: biosInfo.vendor,
      serial: biosInfo.serial,
    };
    console.log(deviceInfo.model);
    console.log(deviceInfo.serial);

    // Send the BIOS information as JSON response
    res.json(deviceInfo);
  } catch (error) {
    console.error('Error fetching BIOS information:', error);
    res.status(500).json({ error: 'Failed to retrieve BIOS information' });
  }
});

// Fetch Driver Details
app.post('/latest-driver', (req, res) => {
  const { model } = req.body;
  Driver.find({ model: model }, (err, drivers) => {
    if (err) {
      console.log(err);
      res.render('check-driver', {
        drivers: [],
        message: 'Error fetching driver details. Please try again.',
      });
    } else {
      res.render('latest-driver', {
        drivers: drivers,
        message: drivers.length
          ? ''
          : 'No drivers found for the specified model.',
      });
    }
  });
});

// Warranty Registration Route
app.get('/register-warranty', (req, res) => {
  res.render('register-warranty');
});

// Warranty Registration Form Submission
app.post('/register-warranty', upload.single('billPdf'), (req, res) => {
  const { name, email, serialNumber, purchaseDate } = req.body;

  // Create a new warranty document
  const newWarranty = new Warranty({
    name: name,
    email: email,
    serialNumber: serialNumber,
    purchaseDate: purchaseDate,
    billPdfPath: req.file.path, // Save the path of the uploaded PDF file
  });

  // Save the warranty document to the database
  newWarranty
    .save()
    .then(() => {
      // Implement email service to send confirmation email
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'dubeyjatin0959@gmail.com',
          pass: 'J@tin0959',
        },
      });

      const mailOptions = {
        from: 'your-email@gmail.com',
        to: email,
        subject: 'Warranty Registration Confirmation',
        text: `Hello ${name},\n\nYour warranty registration for device with serial number ${serialNumber} has been successfully received. Purchase date: ${purchaseDate}.\n\nThank you!`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          res.render('register-warranty', {
            message: 'Error sending confirmation email. Please try again.',
          });
        } else {
          console.log('Email sent: ' + info.response);
          res.render('register-warranty', {
            message:
              'Warranty registered successfully! Confirmation email sent.',
          });
        }
      });
    })
    .catch((err) => {
      console.log(err);
      res.render('register-warranty', {
        message: 'Error registering warranty. Please try again.',
      });
    });
});
// app.post('/driver/new', async (req, res) => {
//   try {
//     const {
//       model,
//       driverName,
//       downloadLink,
//       version,
//       releaseDate,
//       driverpath,
//     } = req.body;
//     const newDriver = new Driver({
//       model,
//       driverName,
//       downloadLink,
//       version,
//       releaseDate,
//       driverpath,
//     });
//     await newDriver.save();
//     res.redirect('/driver/new'); // Redirect or show a success message
//   } catch (error) {
//     res.status(500).send('Error saving driver data.');
//   }
// });

// Route to list all drivers
app.get('/admin/drivers', async (req, res) => {
  try {
    // Fetch all drivers from the database
    const drivers = await Driver.find();

    // Render a view to display the list of drivers
    res.render('admin', { drivers });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).send('Error fetching drivers. Please try again.');
  }
});

// Route to delete a driver
app.delete('/admin/drivers/:id', async (req, res) => {
  const driverId = req.params.id;

  try {
    // Delete the driver from the database
    await Driver.findByIdAndDelete(driverId);

    res.sendStatus(200);
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).send('Error deleting driver. Please try again.');
  }
});

// Route to upload a new driver
app.post('/admin/drivers', upload.single('driverFile'), async (req, res) => {
  const { model, version, releaseDate } = req.body;
  const driverFile = req.file.path; // Path to the uploaded driver file

  try {
    // Create a new driver document
    const newDriver = new Driver({
      model: model,
      version: version,
      releaseDate: releaseDate,
      driverFile: driverFile,
    });

    // Save the driver document to the database
    await newDriver.save();

    res.redirect('/admin/drivers'); // Redirect back to the drivers page after successful upload
  } catch (error) {
    console.error('Error uploading driver:', error);
    res.status(500).send('Error uploading driver. Please try again.');
  }
});

app.get('/admin/nikhil', async (req, res) => {
  try {
    // Fetch all drivers from the database
    const drivers = await Driver.find();

    // Render a view to display the list of drivers
    res.render('admindashboard', { drivers });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).send('Error fetching drivers. Please try again.');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
