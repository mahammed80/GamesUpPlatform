
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gamesup_platform',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function checkImages() {
  try {
    const [rows] = await pool.query('SELECT id, name, image FROM products');
    console.log('Checking ' + rows.length + ' products...');
    
    const broken = rows.filter(p => p.image && !p.image.startsWith('http') && !p.image.startsWith('/'));
    
    if (broken.length > 0) {
      console.log('Found products with potentially broken image paths (relative paths):');
      broken.forEach(p => {
        console.log(`ID: ${p.id}, Name: ${p.name}, Image: ${p.image}`);
      });
    } else {
      console.log('All product images seem to have valid prefixes (http or /).');
    }

    // Also list the specific filenames mentioned by the user to see if they exist
    const targetFiles = [
      'fc24-standard-edition-featured-image-16x9.jpg.adapt.crop191x100.1200w.jpg',
      'phXiCRC97MonwVU6CNHXPrvb.png',
      '609d57187b744f4344075199859f51172348505501314949.png',
      'e77a5056717a665961637500596328766112211568284568.png'
    ];

    console.log('\nSearching for specific problematic filenames:');
    const specific = rows.filter(p => targetFiles.some(f => p.image && p.image.includes(f)));
    specific.forEach(p => {
      console.log(`MATCH: ID: ${p.id}, Name: ${p.name}, Image: ${p.image}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkImages();
