const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const employees = [
  {
    name: 'John Doe',
    role: 'Store Manager',
    department: 'Management',
    email: 'john.doe@gamesup.com',
    phone: '+1 (555) 123-4567',
    status: 'Active',
    join_date: '2023-01-15',
    salary: 55000.00,
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'
  },
  {
    name: 'Jane Smith',
    role: 'Sales Associate',
    department: 'Sales',
    email: 'jane.smith@gamesup.com',
    phone: '+1 (555) 987-6543',
    status: 'Active',
    join_date: '2023-03-20',
    salary: 35000.00,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
  },
  {
    name: 'Mike Johnson',
    role: 'Inventory Specialist',
    department: 'Logistics',
    email: 'mike.johnson@gamesup.com',
    phone: '+1 (555) 456-7890',
    status: 'On Leave',
    join_date: '2023-06-10',
    salary: 38000.00,
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'
  }
];

const attendanceData = [
  { employee_email: 'john.doe@gamesup.com', date: '2026-01-12', check_in: '08:55:00', check_out: '17:05:00', status: 'Present' },
  { employee_email: 'jane.smith@gamesup.com', date: '2026-01-12', check_in: '09:02:00', check_out: '17:00:00', status: 'Late' },
  { employee_email: 'mike.johnson@gamesup.com', date: '2026-01-12', check_in: null, check_out: null, status: 'Absent' }
];

async function seedHR() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'games',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
  };

  console.log('Connecting to database...');
  
  try {
    const connection = await mysql.createConnection(config);
    console.log('Connected!');

    // Read and apply schema updates
    console.log('Applying HR schema...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await connection.query(schema);
    console.log('Schema applied.');

    console.log('Seeding employees...');
    for (const emp of employees) {
      // Check if employee exists
      const [rows] = await connection.query('SELECT id FROM employees WHERE email = ?', [emp.email]);
      
      if (rows.length === 0) {
        await connection.query(
          'INSERT INTO employees (name, role, department, email, phone, status, join_date, salary, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [emp.name, emp.role, emp.department, emp.email, emp.phone, emp.status, emp.join_date, emp.salary, emp.image]
        );
        console.log(`Added employee: ${emp.name}`);
      } else {
        console.log(`Skipped employee (exists): ${emp.name}`);
      }
    }

    console.log('Seeding attendance...');
    for (const att of attendanceData) {
      // Get employee ID
      const [empRows] = await connection.query('SELECT id FROM employees WHERE email = ?', [att.employee_email]);
      if (empRows.length > 0) {
        const empId = empRows[0].id;
        // Check if attendance exists for this date
        const [rows] = await connection.query('SELECT id FROM attendance WHERE employee_id = ? AND date = ?', [empId, att.date]);
        
        if (rows.length === 0) {
          await connection.query(
            'INSERT INTO attendance (employee_id, date, check_in, check_out, status) VALUES (?, ?, ?, ?, ?)',
            [empId, att.date, att.check_in, att.check_out, att.status]
          );
          console.log(`Added attendance for: ${att.employee_email}`);
        } else {
          console.log(`Skipped attendance (exists): ${att.employee_email}`);
        }
      }
    }

    console.log('Seeding complete!');
    await connection.end();
  } catch (err) {
    console.error('Seeding failed:', err);
  }
}

seedHR();
