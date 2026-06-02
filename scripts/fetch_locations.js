const fs = require('fs');
const https = require('https');

const url = 'https://raw.githubusercontent.com/RathanakSreang/cambodia-gazetteer/master/cambodia_gazetteer.json';
const outputPath = 'd:\\My workspace\\IMS_G6_frontend\\src\\data\\locations.js';

console.log(`Fetching data from ${url}...`);

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      console.log(`Download complete. Data size: ${data.length} bytes.`);
      const rawLocations = JSON.parse(data);
      
      const transformedLocations = rawLocations.map(province => ({
        name: province.latin,
        districts: province.districts ? province.districts.map(district => ({
          name: district.latin,
          communes: district.communes ? district.communes.map(commune => ({
            name: commune.latin,
            villages: commune.villages ? commune.villages.map(village => village.latin) : []
          })) : []
        })) : []
      }));

      const fileContent = `export const locations = ${JSON.stringify(transformedLocations, null, 2)};`;

      fs.writeFileSync(outputPath, fileContent, 'utf8');
      console.log(`Successfully wrote transformed data to ${outputPath}`);
      
    } catch (error) {
      console.error('Error processing data:', error.message);
    }
  });

}).on('error', (err) => {
  console.error('Error fetching data:', err.message);
});
