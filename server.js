require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const twilio = require('twilio');
const bodyParser = require('body-parser');
const sendSMS = require('./sendsms.js');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);

const dataFilePath = path.join(__dirname, 'data.json');
const rawData = fs.readFileSync(dataFilePath);
const data = JSON.parse(rawData);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/check-status', (req, res) => {
  const { uid } = req.body;
  console.log('Received UID:', uid);
  const claim = data.find(item => item.user_id === uid);
  console.log('Found Claim:', claim);
  if (claim) {
    res.json({
      status: claim.status,
      name: claim.name,
      claim_type: claim.claim_type,
      amount: claim.amount,
      submitted_at: claim.submitted_at,
      updated_at: claim.updated_at,
      phone_number: claim.phone_number
    });

    if (claim.status === 'Approved' || claim.status === 'Received') {
      client.messages.create({
        body: `Your claim has been ${claim.status}. Amount: ${claim.amount}`,
        to: claim.phone_number,
        from: process.env.TWILIO_PHONE_NUMBER
      })
      .then(message => console.log(message.sid))
      .catch(err => console.error(err));
    }
  } else {
    res.status(404).json({ error: ' No claim found for this UID  ' });
  }
});

// Admin login route
app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

// Admin dashboard route
app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});
app.get('/admin/claims', (req, res) => {
  res.json(data); // Assuming 'data' contains your claims data
});
// Route to handle updating claim status
app.post('/admin/update-status', (req, res) => {
  const { claimId, status } = req.body;
  // Find the claim in the data array and update its status
  const claimIndex = data.findIndex(item => item._id === claimId);
  if (claimIndex !== -1) {
    data[claimIndex].status = status;
    // Write the updated data back to the JSON file
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
    res.json({ message: 'Claim status updated successfully' });
  } else {
    res.status(404).json({ error: 'Claim not found' });
  }

  
});


// Admin login form submission
app.post('/admin/login', (req, res) => {
  const { token, password } = req.body;
  if (token === '2141016166' && password === '2141016166') {
    res.redirect('/admin/dashboard');
  } else {
    res.status(401).send('Unauthorized');
  }
});


app.get('/weather', async (req, res) => {
  try {
      const { latitude, longitude } = req.query;

      if (!latitude || !longitude) {
          return res.status(400).send('Latitude and longitude are required');
      }

      const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=2024-03-31&end_date=2024-03-31&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation,rain,snowfall,snow_depth,weather_code,pressure_msl,surface_pressure,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,et0_fao_evapotranspiration,vapour_pressure_deficit,wind_direction_10m,wind_direction_100m,wind_gusts_10m,soil_temperature_0_to_7cm,soil_temperature_7_to_28cm,soil_temperature_28_to_100cm,soil_temperature_100_to_255cm,soil_moisture_0_to_7cm,soil_moisture_7_to_28cm,soil_moisture_28_to_100cm,soil_moisture_100_to_255cm&timezone=auto`;

      const response = await fetch(url);
      const data = await response.json();

      res.json(data); // Send the weather data as JSON
  } catch (error) {
      console.error('Error fetching weather data:', error);
      res.status(500).json({ error: 'An error occurred' }); // Send error response as JSON
  }
});
// app.get('/weather', async (req, res) => {
//   try {
//     const { latitude, longitude } = req.query;

//     if (!latitude || !longitude) {
//       return res.status(400).send('Latitude and longitude are required');
//     }

//     const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=2024-03-31&end_date=2024-03-31&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation,rain,snowfall,snow_depth,weather_code,pressure_msl,surface_pressure,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,et0_fao_evapotranspiration,vapour_pressure_deficit,wind_direction_10m,wind_direction_100m,wind_gusts_10m,soil_temperature_0_to_7cm,soil_temperature_7_to_28cm,soil_temperature_28_to_100cm,soil_temperature_100_to_255cm,soil_moisture_0_to_7cm,soil_moisture_7_to_28cm,soil_moisture_28_to_100cm,soil_moisture_100_to_255cm&timezone=auto`;

//     const response = await axios.get(url); // Use axios instead of fetch
//     const data = response.data;

//     res.json(data); // Send the weather data as JSON
//   } catch (error) {
//     console.error('Error fetching weather data:', error);
//     res.status(500).json({ error: 'An error occurred' }); // Send error response as JSON
//   }
// });


app.get('/api/get-state', (req, res) => {
  const { claimId } = req.query;
  const claim = data.find(item => item._id === claimId);
  if (claim) {
    res.json({ state: claim.State, Cause_of_loss: claim.Cause_of_loss }); // Assuming 'state' is the field containing the state information
  } else {
    res.status(404).json({ error: 'Claim not found' });
  }
});



app.get('/api/geocode', (req, res) => {
  try {
    // Read the contents of geocode.json file
    const geocodeData = fs.readFileSync(path.join(__dirname, 'geocode.json'));
    const geocodeJson = JSON.parse(geocodeData);
    res.json(geocodeJson); // Send the JSON data as response
  } catch (error) {
    console.error('Error reading geocode data:', error);
    res.status(500).json({ error: 'An error occurred' }); // Send error response as JSON
  }
});

sendSMS(require('./data.json'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
   


