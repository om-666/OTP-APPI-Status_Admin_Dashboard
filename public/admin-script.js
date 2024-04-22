// Fetch claims data from the server and populate the table
fetch('data.json')
  .then(response => response.json())
  .then(claims => {
    const tableBody = document.getElementById('claims-table-body');
    claims.forEach(claim => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${claim._id}</td>
        <td>${claim.name}</td>
        <td>${claim.claim_type}</td>
        <td>${claim.amount}</td>
        <td>${claim.status}</td>
        <td>
          <select id="status-${claim._id}">
            <option value="Under Processing">Under Processing</option>
            <option value="Approved">Approved</option>
            <option value="Received">Received</option>
          </select>
          <button onclick="updateStatus('${claim._id}')">Update</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  });

// Function to update the status of a claim
function updateStatus(claimId) {
  const status = document.getElementById(`status-${claimId}`).value;
  fetch('/admin/update-status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ claimId, status })
  })
  .then(response => response.json())
  .then(data => {
    alert(data.message);
    // Refresh the page to update the table
    location.reload();
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Failed to update claim status');
  });
}



async function getStateFromAPI() {
  const claimId = document.getElementById('search-input').value.trim().toLowerCase();
  try {
    const response = await fetch(`/api/get-state?claimId=${claimId}`);
    const data = await response.json();
    return data.state; // Assuming the API response contains the state information
  } catch (error) {
    console.error('Error fetching state from API:', error);
    return 'Error';
  }
}


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
      console.error('Error:', error);
      res.status(500).send('An error occurred');
  }
});
