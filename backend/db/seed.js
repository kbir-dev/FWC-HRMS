import bcrypt from 'bcryptjs';
import pool from './connection.js';

// Sample resume texts for AI screening
const sampleResumes = [
  {
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1-555-0101',
    text: `John Smith
Senior Software Engineer
john.smith@example.com | +1-555-0101 | linkedin.com/in/johnsmith

SUMMARY
Experienced full-stack developer with 7+ years of expertise in React, Node.js, and cloud technologies. 
Proven track record of building scalable web applications and leading development teams.

EXPERIENCE
Senior Software Engineer | TechCorp Inc. | 2020 - Present
- Led development of microservices architecture serving 2M+ users
- Implemented CI/CD pipelines reducing deployment time by 60%
- Mentored team of 5 junior developers
- Technologies: React, Node.js, PostgreSQL, AWS, Docker, Kubernetes

Software Engineer | StartupXYZ | 2017 - 2020
- Built RESTful APIs and real-time features using WebSockets
- Developed responsive web applications with React and Redux
- Optimized database queries improving performance by 40%
- Technologies: React, Express, MongoDB, Redis

EDUCATION
Bachelor of Science in Computer Science | University of Technology | 2017

SKILLS
Frontend: React, JavaScript, HTML5, CSS3, Redux, Material-UI
Backend: Node.js, Express, Python, Django
Database: PostgreSQL, MongoDB, Redis
DevOps: Docker, Kubernetes, AWS, CI/CD, Git`,
    yearsExp: 7.5
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+1-555-0102',
    text: `Sarah Johnson
Full Stack Developer
sarah.johnson@example.com | +1-555-0102

PROFESSIONAL SUMMARY
Creative full-stack developer with 5 years of experience building modern web applications.
Strong expertise in JavaScript ecosystem and agile methodologies.

WORK EXPERIENCE
Full Stack Developer | Digital Solutions Ltd | 2019 - Present
- Developed e-commerce platform handling $5M+ annual revenue
- Implemented payment gateway integrations (Stripe, PayPal)
- Created admin dashboards with real-time analytics
- Stack: React, Node.js, Express, PostgreSQL, AWS

Junior Developer | Web Agency | 2018 - 2019
- Built responsive websites for 20+ clients
- Maintained and updated existing applications
- Technologies: JavaScript, jQuery, PHP, MySQL

EDUCATION
B.S. Computer Engineering | State University | 2018

TECHNICAL SKILLS
Languages: JavaScript, Python, SQL
Frontend: React, Vue.js, TypeScript, Tailwind CSS
Backend: Node.js, Express, RESTful APIs
Databases: PostgreSQL, MySQL, MongoDB
Tools: Git, Docker, Webpack, Jest`,
    yearsExp: 5.0
  },
  {
    name: 'Michael Chen',
    email: 'michael.chen@example.com',
    phone: '+1-555-0103',
    text: `Michael Chen
Software Engineer
michael.chen@example.com | +1-555-0103

ABOUT ME
Passionate software engineer with 3 years of experience in web development.
Focus on writing clean, maintainable code and continuous learning.

EXPERIENCE
Software Engineer | CloudTech Solutions | 2021 - Present
- Developed features for SaaS platform with 10K+ users
- Wrote unit and integration tests achieving 85% coverage
- Participated in code reviews and agile ceremonies
- Tech: React, Node.js, MongoDB, Docker

Intern Software Developer | Innovation Labs | 2020 - 2021
- Assisted in building mobile-responsive web applications
- Fixed bugs and improved application performance
- Technologies: HTML, CSS, JavaScript, React

EDUCATION
Bachelor of Technology in Information Technology | Tech Institute | 2020

SKILLS
Programming: JavaScript, TypeScript, Python
Web: React, Node.js, Express, HTML5, CSS3
Database: MongoDB, PostgreSQL
Version Control: Git, GitHub
Methodologies: Agile, Scrum, Test-Driven Development`,
    yearsExp: 3.0
  },
  {
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@example.com',
    phone: '+1-555-0104',
    text: `Emily Rodriguez
Senior Full Stack Engineer
emily.rodriguez@example.com | +1-555-0104

SUMMARY
Results-driven senior engineer with 8+ years building enterprise-scale applications.
Expert in modern JavaScript frameworks and cloud architecture.

PROFESSIONAL EXPERIENCE
Senior Full Stack Engineer | Enterprise Systems Corp | 2018 - Present
- Architected and deployed microservices on AWS serving 5M+ requests/day
- Led migration from monolith to microservices architecture
- Managed team of 8 engineers across multiple projects
- Implemented GraphQL APIs and real-time data synchronization
- Technologies: React, Node.js, PostgreSQL, Redis, Elasticsearch, AWS, Kubernetes

Software Engineer | Global Tech Inc | 2015 - 2018
- Developed internal tools improving team productivity by 35%
- Built RESTful APIs and integrated third-party services
- Stack: Angular, Node.js, MySQL, Docker

EDUCATION
M.S. Computer Science | Tech University | 2015
B.S. Software Engineering | State College | 2013

TECHNICAL EXPERTISE
Frontend: React, TypeScript, Next.js, Redux, GraphQL
Backend: Node.js, Express, Python, FastAPI
Databases: PostgreSQL, MongoDB, Redis, DynamoDB
Cloud & DevOps: AWS, Docker, Kubernetes, Terraform, CI/CD
Testing: Jest, Cypress, Testing Library`,
    yearsExp: 8.5
  },
  {
    name: 'David Park',
    email: 'david.park@example.com',
    phone: '+1-555-0105',
    text: `David Park
Junior Software Developer
david.park@example.com | +1-555-0105

OBJECTIVE
Entry-level software developer seeking to apply programming skills and grow in a dynamic team.
Strong foundation in web technologies and eagerness to learn.

EXPERIENCE
Junior Software Developer | WebDev Company | 2023 - Present
- Developing features for company website using React
- Learning backend development with Node.js
- Participating in daily standups and sprint planning
- Technologies: React, JavaScript, CSS, Git

Coding Bootcamp Graduate | Code Academy | 2023
- Completed intensive 12-week full-stack program
- Built 5 portfolio projects including e-commerce site
- Learned: HTML, CSS, JavaScript, React, Node.js, Express

Freelance Web Developer | 2022 - 2023
- Created websites for small businesses
- Maintained client websites and fixed bugs
- Tools: WordPress, HTML, CSS, JavaScript

EDUCATION
Certificate in Full Stack Web Development | Code Academy | 2023
B.A. Business Administration | Community College | 2022

SKILLS
Languages: JavaScript, HTML5, CSS3
Frontend: React, Bootstrap
Backend: Node.js, Express (learning)
Database: MongoDB (basic)
Tools: Git, VS Code, npm`,
    yearsExp: 1.5
  },
  {
    name: 'Lisa Thompson',
    email: 'lisa.thompson@example.com',
    phone: '+1-555-0106',
    text: `Lisa Thompson
Lead Software Engineer
lisa.thompson@example.com | +1-555-0106

PROFESSIONAL PROFILE
Accomplished technical leader with 10+ years of experience in full-stack development.
Expert in building scalable systems and mentoring engineering teams.

CAREER HISTORY
Lead Software Engineer | FinTech Solutions | 2019 - Present
- Lead team of 12 engineers developing payment processing platform
- Designed system architecture handling 50K+ transactions/hour
- Implemented security best practices and PCI compliance
- Reduced infrastructure costs by 40% through optimization
- Tech Stack: React, Node.js, PostgreSQL, Redis, AWS, Microservices

Senior Engineer | E-commerce Giant | 2016 - 2019
- Built recommendation engine increasing sales by 25%
- Developed real-time inventory management system
- Technologies: React, Python, PostgreSQL, Kafka, Redis

Software Engineer | Software House | 2013 - 2016
- Full-stack development for various client projects
- Mentored junior developers and conducted training sessions

EDUCATION
M.S. Software Engineering | Top University | 2013
B.S. Computer Science | Tech Institute | 2011

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, Go
Frontend: React, Next.js, Redux, Vue.js
Backend: Node.js, Express, Python, Django, FastAPI
Databases: PostgreSQL, MongoDB, Redis, Cassandra
Cloud: AWS (EC2, S3, Lambda, RDS), Azure, GCP
DevOps: Docker, Kubernetes, Terraform, Jenkins, GitHub Actions
Architecture: Microservices, Event-Driven, Serverless`,
    yearsExp: 10.5
  },
  {
    name: 'James Wilson',
    email: 'james.wilson@example.com',
    phone: '+1-555-0107',
    text: `James Wilson
Full Stack Developer
james.wilson@example.com | +1-555-0107

SUMMARY
Versatile full-stack developer with 4 years of experience in building web applications.
Passionate about creating user-friendly interfaces and efficient backend systems.

WORK HISTORY
Full Stack Developer | Tech Innovations | 2020 - Present
- Developing healthcare management system used by 500+ clinics
- Implemented HIPAA-compliant data storage and encryption
- Built dashboard with data visualization using Chart.js
- Stack: React, Node.js, Express, PostgreSQL, AWS

Web Developer | Creative Agency | 2019 - 2020
- Created marketing websites and landing pages
- Integrated CMS and third-party APIs
- Technologies: React, WordPress, PHP, MySQL

EDUCATION
B.S. Information Systems | University | 2019

CERTIFICATIONS
AWS Certified Developer Associate | 2022

TECHNICAL ABILITIES
Frontend: React, JavaScript, TypeScript, HTML5, CSS3, SASS
Backend: Node.js, Express, Python
Database: PostgreSQL, MongoDB, MySQL
Cloud: AWS (S3, Lambda, EC2, RDS)
Tools: Git, Docker, Webpack, npm, Jest`,
    yearsExp: 4.0
  },
  {
    name: 'Maria Garcia',
    email: 'maria.garcia@example.com',
    phone: '+1-555-0108',
    text: `Maria Garcia
Software Development Engineer
maria.garcia@example.com | +1-555-0108

PROFILE
Skilled software engineer with 6 years of experience in web and mobile development.
Strong problem-solving abilities and commitment to code quality.

PROFESSIONAL EXPERIENCE
Software Development Engineer | TechVentures | 2021 - Present
- Building cross-platform mobile apps with React Native
- Developing REST APIs and GraphQL endpoints
- Implementing automated testing and CI/CD pipelines
- Technologies: React Native, Node.js, PostgreSQL, Docker, AWS

Software Engineer | Digital Products Co. | 2018 - 2021
- Developed e-learning platform serving 50K+ students
- Created real-time collaboration features using WebSockets
- Optimized application performance and scalability
- Stack: React, Node.js, MongoDB, Redis, Socket.io

Junior Developer | Startup Hub | 2017 - 2018
- Built MVPs for startup clients
- Technologies: JavaScript, React, Express, MongoDB

EDUCATION
B.E. Computer Engineering | Engineering College | 2017

SKILLS & TECHNOLOGIES
Mobile: React Native, iOS, Android
Web: React, Node.js, JavaScript, TypeScript
Backend: Express, REST APIs, GraphQL
Databases: PostgreSQL, MongoDB, Redis
Cloud: AWS, Firebase
Testing: Jest, React Testing Library, Cypress
Tools: Git, Docker, Jira, Agile/Scrum`,
    yearsExp: 6.0
  },
  {
    name: 'Robert Anderson',
    email: 'robert.anderson@example.com',
    phone: '+1-555-0109',
    text: `Robert Anderson
Backend Developer
robert.anderson@example.com | +1-555-0109

PROFESSIONAL SUMMARY
Backend specialist with 5 years of experience building robust server-side applications.
Expert in API design, database optimization, and system architecture.

EXPERIENCE
Backend Developer | Data Systems Inc. | 2020 - Present
- Designed and implemented RESTful APIs serving 1M+ requests/day
- Optimized database queries reducing response time by 50%
- Built data processing pipelines with message queues
- Technologies: Node.js, Express, PostgreSQL, Redis, RabbitMQ, AWS

Software Developer | Web Solutions | 2018 - 2020
- Developed backend services for web applications
- Integrated payment gateways and third-party APIs
- Stack: Node.js, MongoDB, Docker

EDUCATION
B.S. Computer Science | State University | 2018

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, SQL
Backend: Node.js, Express, Fastify, Nest.js
Databases: PostgreSQL, MySQL, MongoDB, Redis
Message Queues: RabbitMQ, Redis, Kafka
Cloud: AWS (EC2, RDS, S3, Lambda)
Tools: Docker, Git, Postman, Linux`,
    yearsExp: 5.0
  },
  {
    name: 'Amanda White',
    email: 'amanda.white@example.com',
    phone: '+1-555-0110',
    text: `Amanda White
Frontend Engineer
amanda.white@example.com | +1-555-0110

ABOUT
Creative frontend engineer with 4 years specializing in modern UI/UX development.
Passionate about building accessible, performant web applications.

WORK EXPERIENCE
Frontend Engineer | UI Masters | 2021 - Present
- Leading frontend development for design system used across 10+ products
- Built reusable component library with Storybook
- Improved web accessibility (WCAG 2.1 AA compliance)
- Optimized bundle size reducing load time by 45%
- Technologies: React, TypeScript, Tailwind CSS, Next.js, Storybook

Junior Frontend Developer | Web Studio | 2019 - 2021
- Developed responsive websites and web applications
- Collaborated with designers to implement pixel-perfect UIs
- Tools: React, JavaScript, SASS, Figma

EDUCATION
B.A. Digital Media Design | Arts College | 2019

SKILLS
Languages: JavaScript, TypeScript, HTML5, CSS3
Frameworks: React, Next.js, Vue.js
Styling: Tailwind CSS, SASS, Styled Components, CSS Modules
Tools: Webpack, Vite, npm, Git
Testing: Jest, React Testing Library
Design: Figma, Adobe XD, Responsive Design, Accessibility`,
    yearsExp: 4.0
  }
];

async function seed() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Starting database seeding...');
    
    // 1. Create Roles
    console.log('Creating roles...');
    const rolesData = [
      { name: 'System Administrator', permissions: { all: true } },
      { name: 'HR Manager', permissions: { employees: 'full', payroll: 'full', recruitment: 'full' } },
      { name: 'Department Manager', permissions: { employees: 'view', attendance: 'full', performance: 'full' } },
      { name: 'HR Recruiter', permissions: { recruitment: 'full', applications: 'full' } },
      { name: 'Employee', permissions: { self: 'view' } }
    ];
    
    for (const role of rolesData) {
      await client.query(
        'INSERT INTO roles (name, permissions) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
        [role.name, JSON.stringify(role.permissions)]
      );
    }
    
    // 2. Create Departments
    console.log('Creating departments...');
    const deptResult = await client.query(`
      INSERT INTO departments (name, description) VALUES
      ('Engineering', 'Software development and technical operations'),
      ('Human Resources', 'Talent management and employee relations'),
      ('Sales', 'Business development and customer acquisition'),
      ('Marketing', 'Brand management and growth'),
      ('Finance', 'Financial planning and accounting'),
      ('Operations', 'Business operations and logistics')
      RETURNING id, name
    `);
    
    const depts = deptResult.rows;
    const engineeringDeptId = depts.find(d => d.name === 'Engineering').id;
    const hrDeptId = depts.find(d => d.name === 'Human Resources').id;
    
    // 3. Create Users (various roles)
    console.log('Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const usersData = [
      { email: 'admin@hrms.com', role: 'admin' },
      { email: 'hr.manager@hrms.com', role: 'hr' },
      { email: 'recruiter@hrms.com', role: 'recruiter' },
      { email: 'manager@hrms.com', role: 'manager' },
      { email: 'employee1@hrms.com', role: 'employee' },
      { email: 'employee2@hrms.com', role: 'employee' }
    ];
    
    const userIds = [];
    for (const user of usersData) {
      const result = await client.query(
        'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
        [user.email, hashedPassword, user.role]
      );
      userIds.push({ email: user.email, id: result.rows[0].id, role: user.role });
    }
    
    // 4. Create Employees
    console.log('Creating employees...');
    const employeesData = [
      { 
        userId: userIds[0].id, 
        code: 'EMP001', 
        name: 'Admin User', 
        deptId: hrDeptId, 
        position: 'System Administrator',
        salary: 120000
      },
      { 
        userId: userIds[1].id, 
        code: 'EMP002', 
        name: 'HR Manager', 
        deptId: hrDeptId, 
        position: 'Human Resources Manager',
        salary: 95000
      },
      { 
        userId: userIds[2].id, 
        code: 'EMP003', 
        name: 'Jane Recruiter', 
        deptId: hrDeptId, 
        position: 'Senior Recruiter',
        salary: 75000
      },
      { 
        userId: userIds[3].id, 
        code: 'EMP004', 
        name: 'Tech Manager', 
        deptId: engineeringDeptId, 
        position: 'Engineering Manager',
        salary: 130000
      },
      { 
        userId: userIds[4].id, 
        code: 'EMP005', 
        name: 'Alice Developer', 
        deptId: engineeringDeptId, 
        position: 'Senior Software Engineer',
        salary: 110000
      },
      { 
        userId: userIds[5].id, 
        code: 'EMP006', 
        name: 'Bob Developer', 
        deptId: engineeringDeptId, 
        position: 'Software Engineer',
        salary: 90000
      }
    ];
    
    const employeeIds = [];
    for (const emp of employeesData) {
      const result = await client.query(
        `INSERT INTO employees (user_id, employee_code, full_name, department_id, position, hire_date, salary, employment_type)
         VALUES ($1, $2, $3, $4, $5, CURRENT_DATE - INTERVAL '1 year', $6, 'full-time')
         RETURNING id`,
        [emp.userId, emp.code, emp.name, emp.deptId, emp.position, emp.salary]
      );
      employeeIds.push(result.rows[0].id);
    }
    
    // Set manager relationships
    await client.query(
      'UPDATE employees SET manager_id = $1 WHERE employee_code IN ($2, $3)',
      [employeeIds[3], 'EMP005', 'EMP006']
    );
    
    // 5. Create Job Postings
    console.log('Creating job postings...');
    const jobsData = [
      {
        title: 'Senior Full Stack Engineer',
        description: 'We are seeking an experienced full-stack engineer to join our growing team.',
        requirements: `Requirements:
- 5+ years of experience in full-stack development
- Expert knowledge of React and Node.js
- Strong experience with PostgreSQL and Redis
- Experience with AWS and Docker/Kubernetes
- Excellent problem-solving and communication skills`,
        responsibilities: `Responsibilities:
- Design and develop scalable web applications
- Lead technical architecture decisions
- Mentor junior developers
- Collaborate with product and design teams
- Implement best practices and code quality standards`,
        deptId: engineeringDeptId,
        managerId: employeeIds[3],
        skills: ['React', 'Node.js', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'TypeScript']
      },
      {
        title: 'Full Stack Developer',
        description: 'Looking for a talented full-stack developer to build amazing products.',
        requirements: `Requirements:
- 3+ years of web development experience
- Proficiency in React and Node.js
- Experience with relational databases
- Understanding of RESTful APIs
- Good communication skills`,
        responsibilities: `Responsibilities:
- Develop new features and maintain existing code
- Write clean, maintainable code
- Participate in code reviews
- Work in agile team environment
- Contribute to technical discussions`,
        deptId: engineeringDeptId,
        managerId: employeeIds[3],
        skills: ['React', 'Node.js', 'PostgreSQL', 'JavaScript', 'Git', 'REST APIs']
      }
    ];
    
    const jobIds = [];
    for (const job of jobsData) {
      const result = await client.query(
        `INSERT INTO job_postings (
          title, description, requirements, responsibilities, 
          department_id, hiring_manager_id, employment_type, 
          experience_level, required_skills, status, published_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'full-time', $7, $8, 'published', NOW())
        RETURNING id`,
        [
          job.title,
          job.description,
          job.requirements,
          job.responsibilities,
          job.deptId,
          job.managerId,
          job.title.includes('Senior') ? 'senior' : 'mid',
          JSON.stringify(job.skills)
        ]
      );
      jobIds.push(result.rows[0].id);
    }
    
    // 6. Create Applications with Sample Resumes
    console.log('Creating applications with sample resumes...');
    for (let i = 0; i < sampleResumes.length; i++) {
      const resume = sampleResumes[i];
      const jobId = i < 5 ? jobIds[0] : jobIds[1]; // First 5 for senior role, rest for mid-level
      
      await client.query(
        `INSERT INTO applications (
          job_id, candidate_name, candidate_email, candidate_phone,
          resume_text, years_of_experience, status
        ) VALUES ($1, $2, $3, $4, $5, $6, 'received')`,
        [jobId, resume.name, resume.email, resume.phone, resume.text, resume.yearsExp]
      );
    }
    
    // 7. Sample Attendance Records (last 30 days for employees)
    console.log('Creating attendance records...');
    for (const empId of employeeIds) {
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        
        const checkIn = new Date(date);
        checkIn.setHours(9, Math.floor(Math.random() * 30), 0);
        
        const checkOut = new Date(date);
        checkOut.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0);
        
        const workHours = (checkOut - checkIn) / (1000 * 60 * 60);
        
        await client.query(
          `INSERT INTO attendance (employee_id, date, check_in_time, check_out_time, work_hours, status, source)
           VALUES ($1, $2, $3, $4, $5, 'present', 'biometric')
           ON CONFLICT (employee_id, date) DO NOTHING`,
          [empId, date.toISOString().split('T')[0], checkIn, checkOut, workHours.toFixed(2)]
        );
      }
    }
    
    // 8. Sample Payroll Records (last month)
    console.log('Creating payroll records...');
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    for (let i = 0; i < employeesData.length; i++) {
      const emp = employeesData[i];
      const basicSalary = emp.salary;
      const allowances = basicSalary * 0.15;
      const deductions = basicSalary * 0.12;
      const grossSalary = basicSalary + allowances;
      const tax = grossSalary * 0.20;
      const netSalary = grossSalary - tax - deductions;
      
      await client.query(
        `INSERT INTO payrolls (
          employee_id, month, year, basic_salary, 
          allowances, deductions, gross_salary, tax, net_salary,
          payment_status, payment_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'paid', $10)`,
        [
          employeeIds[i],
          lastMonth.getMonth() + 1,
          lastMonth.getFullYear(),
          basicSalary,
          JSON.stringify({ hra: allowances * 0.5, transport: allowances * 0.3, other: allowances * 0.2 }),
          JSON.stringify({ pf: deductions * 0.6, insurance: deductions * 0.4 }),
          grossSalary,
          tax,
          netSalary,
          lastMonth.toISOString().split('T')[0]
        ]
      );
    }
    
    await client.query('COMMIT');
    console.log('✓ Database seeded successfully!');
    console.log('\nCreated:');
    console.log('- 5 roles');
    console.log('- 6 departments');
    console.log('- 6 users (admin@hrms.com, hr.manager@hrms.com, recruiter@hrms.com, manager@hrms.com, employee1@hrms.com, employee2@hrms.com)');
    console.log('- 6 employees');
    console.log('- 2 job postings');
    console.log('- 10 applications with sample resumes');
    console.log('- ~120 attendance records');
    console.log('- 6 payroll records');
    console.log('\nDefault password for all users: password123');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run seed
seed().catch((err) => {
  console.error('Failed to seed database:', err);
  process.exit(1);
});

