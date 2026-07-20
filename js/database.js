/* ==========================================================================
   stdy.io — database.js
   Seeds a demonstration dataset into LocalStorage the first time the site is
   opened. Never overwrites existing user data on later visits.
   ========================================================================== */

const DB_SEED_VERSION = 'v1';

function initDatabase() {
  if (localStorage.getItem('stdyio_seed_version') === DB_SEED_VERSION) return;

  seedUsers();
  seedCourses();
  seedTestimonials();
  ensureCollection('stdyio_enrollments', []);
  ensureCollection('stdyio_progress', []);
  ensureCollection('stdyio_cart', []);
  ensureCollection('stdyio_payments', []);
  ensureCollection('stdyio_receipts', []);
  ensureCollection('stdyio_threads', seedThreads());
  ensureCollection('stdyio_replies', seedReplies());
  ensureCollection('stdyio_votes', []);
  ensureCollection('stdyio_notifications', []);
  ensureCollection('stdyio_certificates', []);
  ensureCollection('stdyio_reports', []);
  ensureCollection('stdyio_settings', { theme: 'light' });

  localStorage.setItem('stdyio_seed_version', DB_SEED_VERSION);
}

function ensureCollection(key, value) {
  if (localStorage.getItem(key) === null) saveData(key, value);
}

function seedUsers() {
  if (localStorage.getItem('stdyio_users') !== null) return;
  const users = [
    {
      id: 'usr_student01', name: 'Aisyah Rahman', email: 'student@stdy.io', password: 'Student123',
      role: 'student', learningInterest: 'Web Development', preferredDifficulty: 'Beginner',
      bio: 'Aspiring front-end developer exploring modern web technologies.',
      avatar: null, createdAt: '2025-11-02T09:00:00Z', status: 'active', isDemo: true,
    },
    {
      id: 'usr_instructor01', name: 'Ahmad Zulkarnain', email: 'instructor@stdy.io', password: 'Instructor123',
      role: 'instructor', title: 'Senior Web Development Instructor', expertise: 'Web Development',
      bio: 'Full-stack engineer turned educator with 9 years of industry experience building web platforms.',
      avatar: null, createdAt: '2025-08-15T09:00:00Z', status: 'active', isDemo: true,
    },
    {
      id: 'usr_admin01', name: 'Farah Idris', email: 'admin@stdy.io', password: 'Admin123',
      role: 'admin', bio: 'Platform administrator keeping stdy.io running smoothly.',
      avatar: null, createdAt: '2025-07-01T09:00:00Z', status: 'active', isDemo: true,
    },
    {
      id: 'usr_instructor02', name: 'Siti Nurhaliza', email: 'siti.nurhaliza@stdy.io', password: 'Instructor123',
      role: 'instructor', title: 'UI/UX Design Lead', expertise: 'UI and UX Design',
      bio: 'Product designer who has shipped design systems for fintech and e-commerce apps across Southeast Asia.',
      avatar: null, createdAt: '2025-08-20T09:00:00Z', status: 'active', isDemo: false,
    },
    {
      id: 'usr_instructor03', name: 'Rajesh Kumar', email: 'rajesh.kumar@stdy.io', password: 'Instructor123',
      role: 'instructor', title: 'Data & Programming Instructor', expertise: 'Programming',
      bio: 'Former data engineer specialising in Python, algorithms, and database systems.',
      avatar: null, createdAt: '2025-09-05T09:00:00Z', status: 'active', isDemo: false,
    },
    {
      id: 'usr_instructor04', name: 'Emily Tan', email: 'emily.tan@stdy.io', password: 'Instructor123',
      role: 'instructor', title: 'Cybersecurity Specialist', expertise: 'Cybersecurity',
      bio: 'Security consultant helping learners understand practical, everyday cybersecurity fundamentals.',
      avatar: null, createdAt: '2025-09-18T09:00:00Z', status: 'active', isDemo: false,
    },
    {
      id: 'usr_instructor05', name: 'Marcus Lee', email: 'marcus.lee@stdy.io', password: 'Instructor123',
      role: 'instructor', title: 'Growth & Cloud Instructor', expertise: 'Digital Marketing',
      bio: 'Growth marketer and cloud practitioner who teaches practical, campaign-tested strategy.',
      avatar: null, createdAt: '2025-10-01T09:00:00Z', status: 'active', isDemo: false,
    },
  ];
  saveData('stdyio_users', users);
}

function seedCourses() {
  if (localStorage.getItem('stdyio_courses') !== null) return;
  const c = (o) => o;
  const courses = [
    c({ id:'crs_001', slug:'html-css-fundamentals', title:'HTML and CSS Fundamentals', category:'Web Development',
      description:'Build your first web pages with semantic HTML and modern CSS layout techniques.',
      longDescription:'This course walks you through the building blocks of the web: semantic HTML5 markup, the CSS box model, Flexbox and Grid layout, and responsive design basics. By the end, you will be able to structure and style a complete multi-section web page from scratch.',
      instructorId:'usr_instructor01', difficulty:'Beginner', duration:8, rating:4.8, reviewCount:212, studentCount:1840,
      language:'English', priceType:'free', price:0, featured:true, createdAt:'2025-09-01T00:00:00Z',
      learningOutcomes:['Write semantic, accessible HTML5 markup','Style layouts with Flexbox and CSS Grid','Build responsive pages that work on any screen size','Understand the CSS box model and cascade'],
      requirements:['A computer with a modern web browser','No prior coding experience required'],
      targetAudience:['Complete beginners to web development','Designers who want to code their own layouts'],
      modules:[
        { id:'m1', title:'Getting Started with HTML', lessons:[
          { id:'l1', title:'How the web works', type:'video', duration:8, preview:true },
          { id:'l2', title:'Semantic HTML elements', type:'reading', duration:10, preview:true },
          { id:'l3', title:'Building your first page', type:'code', duration:14, preview:false },
        ]},
        { id:'m2', title:'Styling with CSS', lessons:[
          { id:'l4', title:'Selectors and the cascade', type:'video', duration:12, preview:false },
          { id:'l5', title:'The CSS box model', type:'reading', duration:9, preview:false },
          { id:'l6', title:'Flexbox in practice', type:'code', duration:16, preview:false },
        ]},
        { id:'m3', title:'Responsive Layouts', lessons:[
          { id:'l7', title:'CSS Grid fundamentals', type:'video', duration:15, preview:false },
          { id:'l8', title:'Media queries and mobile-first design', type:'reading', duration:11, preview:false },
          { id:'l9', title:'Module project: landing page', type:'assignment', duration:20, preview:false },
          { id:'l10', title:'Module quiz', type:'quiz', duration:10, preview:false },
        ]},
      ],
      quiz:{ passingScore:70, questions:[
        { q:'Which HTML element is used for the main navigation of a page?', options:['<nav>','<div>','<section>','<footer>'], answer:0, explanation:'<nav> is the semantic element intended for major navigation blocks.' },
        { q:'Which CSS property changes the direction of a Flexbox layout?', options:['flex-direction','flex-wrap','justify-content','align-self'], answer:0, explanation:'flex-direction controls whether items lay out in a row or column.' },
        { q:'What does the CSS box model NOT include?', options:['Margin','Border','Padding','Position'], answer:3, explanation:'The box model covers content, padding, border and margin — not position.' },
        { q:'Which unit is relative to the viewport width?', options:['vw','px','pt','em'], answer:0, explanation:'"vw" stands for viewport width, 1vw equals 1% of the viewport width.' },
        { q:'A mobile-first approach means writing styles for which screen size first?', options:['Small screens','Large screens','Print','TV screens'], answer:0, explanation:'Mobile-first design starts with the smallest screen and layers on complexity for larger ones.' },
      ]},
    }),
    c({ id:'crs_002', slug:'javascript-for-beginners', title:'JavaScript for Beginners', category:'Web Development',
      description:'Learn programming fundamentals and bring your web pages to life with vanilla JavaScript.',
      longDescription:'A hands-on introduction to JavaScript covering variables, functions, arrays, objects, DOM manipulation and event handling. You will build small interactive projects along the way, no framework required.',
      instructorId:'usr_instructor01', difficulty:'Beginner', duration:10, rating:4.7, reviewCount:189, studentCount:1520,
      language:'English', priceType:'free', price:0, featured:true, createdAt:'2025-09-05T00:00:00Z',
      learningOutcomes:['Understand core JavaScript syntax and logic','Manipulate the DOM to build interactive UIs','Work with arrays, objects and functions','Handle user events like clicks and form submissions'],
      requirements:['Basic HTML and CSS knowledge','A code editor such as VS Code'],
      targetAudience:['Beginners who know HTML/CSS and want to add interactivity','Students preparing for front-end frameworks later'],
      modules:[
        { id:'m1', title:'JavaScript Basics', lessons:[
          { id:'l1', title:'Variables and data types', type:'video', duration:10, preview:true },
          { id:'l2', title:'Functions and scope', type:'reading', duration:9, preview:true },
          { id:'l3', title:'Arrays and loops', type:'code', duration:15, preview:false },
        ]},
        { id:'m2', title:'The DOM', lessons:[
          { id:'l4', title:'Selecting and updating elements', type:'video', duration:12, preview:false },
          { id:'l5', title:'Handling click and input events', type:'code', duration:14, preview:false },
        ]},
        { id:'m3', title:'Mini Project', lessons:[
          { id:'l6', title:'Building a to-do list app', type:'assignment', duration:22, preview:false },
          { id:'l7', title:'Module quiz', type:'quiz', duration:10, preview:false },
        ]},
      ],
      quiz:{ passingScore:70, questions:[
        { q:'Which keyword declares a block-scoped variable in modern JavaScript?', options:['let','var','global','define'], answer:0, explanation:'"let" (and "const") are block-scoped, unlike "var".' },
        { q:'Which method adds an item to the end of an array?', options:['push()','pop()','shift()','slice()'], answer:0, explanation:'Array.push() appends an item to the end of the array.' },
        { q:'Which method selects a single element by its id?', options:['document.getElementById()','document.query()','document.getAll()','document.find()'], answer:0, explanation:'getElementById() returns the element with the matching id attribute.' },
        { q:'What does === check that == does not?', options:['Value and type','Only value','Only type','Neither'], answer:0, explanation:'The strict equality operator === checks both value and type.' },
        { q:'Which event fires when a form is submitted?', options:['submit','click','change','load'], answer:0, explanation:'The "submit" event fires on a <form> when it is submitted.' },
      ]},
    }),
    c({ id:'crs_003', slug:'responsive-web-design', title:'Responsive Web Design', category:'Web Development',
      description:'Master mobile-first layouts, fluid grids, and breakpoints for any device size.',
      longDescription:'Go beyond the basics with advanced responsive techniques: fluid typography, container-based breakpoints, responsive images, and accessible mobile navigation patterns used in production websites.',
      instructorId:'usr_instructor01', difficulty:'Intermediate', duration:9, rating:4.6, reviewCount:97, studentCount:640,
      language:'English', priceType:'paid', price:49, featured:true, createdAt:'2025-09-20T00:00:00Z',
      learningOutcomes:['Design fluid, mobile-first layouts','Use CSS clamp() for responsive typography','Build accessible navigation drawers and bottom sheets','Optimise images for responsive delivery'],
      requirements:['Completion of HTML/CSS fundamentals or equivalent experience'],
      targetAudience:['Developers who want production-grade responsive skills'],
      modules:[
        { id:'m1', title:'Fluid Foundations', lessons:[
          { id:'l1', title:'Mobile-first thinking', type:'video', duration:9, preview:true },
          { id:'l2', title:'Fluid typography with clamp()', type:'reading', duration:8, preview:false },
        ]},
        { id:'m2', title:'Layout Patterns', lessons:[
          { id:'l3', title:'Responsive navigation patterns', type:'code', duration:16, preview:false },
          { id:'l4', title:'Bento-grid dashboards', type:'code', duration:14, preview:false },
        ]},
        { id:'m3', title:'Polish and Performance', lessons:[
          { id:'l5', title:'Responsive images and lazy loading', type:'reading', duration:10, preview:false },
          { id:'l6', title:'Module quiz', type:'quiz', duration:10, preview:false },
        ]},
      ],
      quiz:{ passingScore:70, questions:[
        { q:'What does the CSS clamp() function let you set?', options:['A responsive value between a min and max','A fixed pixel value','A colour gradient','An animation duration'], answer:0, explanation:'clamp(min, preferred, max) lets a value scale fluidly within bounds.' },
        { q:'Which attribute defers loading of off-screen images?', options:['loading="lazy"','defer','async','preload'], answer:0, explanation:'loading="lazy" tells the browser to defer loading until the image nears the viewport.' },
        { q:'A "mobile drawer" is typically triggered by which control?', options:['Hamburger menu','Footer link','Page title','Search bar'], answer:0, explanation:'A hamburger icon commonly toggles the slide-in navigation drawer.' },
      ]},
    }),
    c({ id:'crs_004', slug:'ui-ux-design-essentials', title:'UI and UX Design Essentials', category:'UI and UX Design',
      description:'Learn the design thinking process, wireframing, and prototyping for digital products.',
      longDescription:'Understand how designers research users, sketch wireframes, build interactive prototypes, and validate designs. This course focuses on practical principles you can apply immediately to real projects.',
      instructorId:'usr_instructor02', difficulty:'Beginner', duration:7, rating:4.9, reviewCount:154, studentCount:980,
      language:'English', priceType:'paid', price:79, featured:true, createdAt:'2025-09-10T00:00:00Z',
      learningOutcomes:['Apply the design thinking process','Create low and high-fidelity wireframes','Understand visual hierarchy and typography','Conduct simple usability tests'],
      requirements:['No design experience required'],
      targetAudience:['Beginners exploring product design','Developers who want to design better UIs'],
      modules:[
        { id:'m1', title:'Design Thinking', lessons:[
          { id:'l1', title:'What is UX design?', type:'video', duration:8, preview:true },
          { id:'l2', title:'User research basics', type:'reading', duration:9, preview:true },
        ]},
        { id:'m2', title:'Wireframing', lessons:[
          { id:'l3', title:'Low-fidelity wireframes', type:'code', duration:12, preview:false },
          { id:'l4', title:'Visual hierarchy and typography', type:'reading', duration:10, preview:false },
        ]},
        { id:'m3', title:'Prototyping', lessons:[
          { id:'l5', title:'Building a clickable prototype', type:'assignment', duration:18, preview:false },
          { id:'l6', title:'Module quiz', type:'quiz', duration:10, preview:false },
        ]},
      ],
      quiz:{ passingScore:70, questions:[
        { q:'What is the first stage of the design thinking process?', options:['Empathise','Prototype','Test','Define'], answer:0, explanation:'Design thinking begins with empathising to understand user needs.' },
        { q:'A wireframe is best described as:', options:['A low-fidelity layout sketch','The final coded product','A marketing document','A database schema'], answer:0, explanation:'Wireframes are simplified layout sketches used early in the design process.' },
        { q:'Visual hierarchy helps users:', options:['Understand what is most important first','Load pages faster','Write less code','Store more data'], answer:0, explanation:'Hierarchy guides the eye to the most important content first.' },
      ]},
    }),
    c({ id:'crs_005', slug:'introduction-to-python', title:'Introduction to Python', category:'Programming',
      description:'Start programming with Python through hands-on exercises and small projects.',
      longDescription:'A friendly introduction to Python syntax, control flow, functions, and basic data structures. Ideal as a first programming language for absolute beginners.',
      instructorId:'usr_instructor03', difficulty:'Beginner', duration:11, rating:4.8, reviewCount:301, studentCount:2210,
      language:'English', priceType:'free', price:0, featured:true, createdAt:'2025-08-25T00:00:00Z',
      learningOutcomes:['Write basic Python scripts','Use loops, conditionals and functions','Work with lists and dictionaries','Read and write simple files'],
      requirements:['No prior programming experience needed'],
      targetAudience:['Complete beginners to programming'],
      modules:[
        { id:'m1', title:'Python Basics', lessons:[
          { id:'l1', title:'Variables and printing', type:'video', duration:7, preview:true },
          { id:'l2', title:'Conditionals', type:'reading', duration:9, preview:true },
          { id:'l3', title:'Loops', type:'code', duration:12, preview:false },
        ]},
        { id:'m2', title:'Functions and Data', lessons:[
          { id:'l4', title:'Writing functions', type:'video', duration:10, preview:false },
          { id:'l5', title:'Lists and dictionaries', type:'code', duration:13, preview:false },
        ]},
        { id:'m3', title:'Mini Project', lessons:[
          { id:'l6', title:'Building a quiz game', type:'assignment', duration:20, preview:false },
          { id:'l7', title:'Module quiz', type:'quiz', duration:10, preview:false },
        ]},
      ],
      quiz:{ passingScore:70, questions:[
        { q:'Which keyword defines a function in Python?', options:['def','func','function','lambda'], answer:0, explanation:'"def" is used to define a function in Python.' },
        { q:'Which data type stores key-value pairs?', options:['Dictionary','List','Tuple','Set'], answer:0, explanation:'A dictionary stores data as key-value pairs.' },
        { q:'What does len([1,2,3]) return?', options:['3','2','1','Error'], answer:0, explanation:'len() returns the number of items in the list, which is 3.' },
      ]},
    }),
    c({ id:'crs_006', slug:'data-structures-fundamentals', title:'Data Structures Fundamentals', category:'Programming',
      description:'Understand arrays, linked lists, stacks, queues, and trees with practical examples.',
      longDescription:'Build a solid foundation in data structures used across software engineering interviews and real systems, with visual explanations and coding exercises in Python.',
      instructorId:'usr_instructor03', difficulty:'Intermediate', duration:14, rating:4.7, reviewCount:88, studentCount:540,
      language:'English', priceType:'paid', price:89, featured:false, createdAt:'2025-10-02T00:00:00Z',
      learningOutcomes:['Understand time and space complexity','Implement stacks, queues and linked lists','Traverse trees and graphs','Choose the right structure for a problem'],
      requirements:['Basic Python knowledge'],
      targetAudience:['Students preparing for technical interviews','Programmers who want stronger CS fundamentals'],
      modules:[
        { id:'m1', title:'Linear Structures', lessons:[
          { id:'l1', title:'Arrays and time complexity', type:'video', duration:11, preview:true },
          { id:'l2', title:'Linked lists', type:'code', duration:15, preview:false },
          { id:'l3', title:'Stacks and queues', type:'code', duration:14, preview:false },
        ]},
        { id:'m2', title:'Trees and Graphs', lessons:[
          { id:'l4', title:'Binary trees', type:'video', duration:13, preview:false },
          { id:'l5', title:'Graph traversal basics', type:'reading', duration:12, preview:false },
          { id:'l6', title:'Module quiz', type:'quiz', duration:10, preview:false },
        ]},
      ],
      quiz:{ passingScore:70, questions:[
        { q:'What is the time complexity of accessing an array element by index?', options:['O(1)','O(n)','O(log n)','O(n^2)'], answer:0, explanation:'Array indexing is constant time, O(1).' },
        { q:'Which structure follows First-In-First-Out order?', options:['Queue','Stack','Tree','Graph'], answer:0, explanation:'A queue processes items in the order they were added (FIFO).' },
        { q:'Which traversal visits a binary tree node before its children?', options:['Pre-order','In-order','Post-order','Level-order'], answer:0, explanation:'Pre-order visits the node first, then left and right subtrees.' },
      ]},
    }),
    c({ id:'crs_007', slug:'cybersecurity-basics', title:'Cybersecurity Basics', category:'Cybersecurity',
      description:'Learn foundational cybersecurity concepts to protect yourself and your projects online.',
      longDescription:'An approachable introduction to common threats, safe browsing habits, password hygiene, and how to think about security when building websites and applications.',
      instructorId:'usr_instructor04', difficulty:'Beginner', duration:6, rating:4.6, reviewCount:132, studentCount:1120,
      language:'English', priceType:'free', price:0, featured:false, createdAt:'2025-09-28T00:00:00Z',
      learningOutcomes:['Recognise common phishing and social engineering tactics','Understand password and authentication best practices','Learn basic principles of secure web development','Understand data privacy fundamentals'],
      requirements:['No prior security experience required'],
      targetAudience:['Anyone who uses the internet','Beginner developers wanting security awareness'],
      modules:[
        { id:'m1', title:'Everyday Security', lessons:[
          { id:'l1', title:'Common cyber threats', type:'video', duration:9, preview:true },
          { id:'l2', title:'Password hygiene and 2FA', type:'reading', duration:8, preview:true },
        ]},
        { id:'m2', title:'Security for Developers', lessons:[
          { id:'l3', title:'Input validation and XSS basics', type:'reading', duration:11, preview:false },
          { id:'l4', title:'Module quiz', type:'quiz', duration:10, preview:false },
        ]},
      ],
      quiz:{ passingScore:70, questions:[
        { q:'What is phishing?', options:['Tricking someone into revealing sensitive information','A type of firewall','A password manager','A programming language'], answer:0, explanation:'Phishing uses deceptive messages to trick users into revealing sensitive data.' },
        { q:'Why is textContent safer than innerHTML for user input?', options:['It prevents raw HTML/scripts from executing','It is faster to type','It supports more tags','It automatically translates text'], answer:0, explanation:'textContent renders input as plain text, preventing script injection.' },
      ]},
    }),
    c({ id:'crs_008', slug:'digital-marketing-strategy', title:'Digital Marketing Strategy', category:'Digital Marketing',
      description:'Plan effective digital campaigns across social, search, and email channels.',
      longDescription:'Learn how to build a digital marketing plan from audience research to channel strategy, content calendars, and measuring campaign performance.',
      instructorId:'usr_instructor05', difficulty:'Intermediate', duration:8, rating:4.5, reviewCount:76, studentCount:410,
      language:'English', priceType:'paid', price:59, featured:false, createdAt:'2025-10-08T00:00:00Z',
      learningOutcomes:['Build an audience persona and content strategy','Plan multi-channel campaigns','Understand basic SEO and email marketing','Measure campaigns with simple KPIs'],
      requirements:['No prior marketing experience needed'],
      targetAudience:['Small business owners','Aspiring digital marketers'],
      modules:[
        { id:'m1', title:'Strategy Foundations', lessons:[
          { id:'l1', title:'Understanding your audience', type:'video', duration:10, preview:true },
          { id:'l2', title:'Setting campaign goals', type:'reading', duration:8, preview:false },
        ]},
        { id:'m2', title:'Channels', lessons:[
          { id:'l3', title:'Social media fundamentals', type:'video', duration:11, preview:false },
          { id:'l4', title:'Email marketing basics', type:'reading', duration:9, preview:false },
          { id:'l5', title:'Module quiz', type:'quiz', duration:10, preview:false },
        ]},
      ],
      quiz:{ passingScore:70, questions:[
        { q:'What is a buyer persona?', options:['A fictional profile representing a target customer','A pricing model','An email template','A type of advertisement'], answer:0, explanation:'A persona represents the goals and behaviour of a target customer segment.' },
        { q:'Which metric measures how many recipients opened a marketing email?', options:['Open rate','Bounce rate','Churn rate','Conversion cost'], answer:0, explanation:'Open rate is the percentage of recipients who opened the email.' },
      ]},
    }),
    c({ id:'crs_009', slug:'git-and-github-essentials', title:'Git and GitHub Essentials', category:'Web Development',
      description:'Track changes, collaborate, and manage source code like a professional developer.',
      longDescription:'Learn the version control workflow used by professional teams: commits, branches, merges, pull requests, and resolving conflicts using Git and GitHub.',
      instructorId:'usr_instructor01', difficulty:'Beginner', duration:5, rating:4.7, reviewCount:143, studentCount:1330,
      language:'English', priceType:'free', price:0, featured:false, createdAt:'2025-09-12T00:00:00Z',
      learningOutcomes:['Track changes with Git commits','Work with branches and merges','Collaborate using pull requests','Resolve simple merge conflicts'],
      requirements:['Comfortable using a computer terminal is helpful but not required'],
      targetAudience:['Developers who have never used version control','Students working on team projects'],
      modules:[
        { id:'m1', title:'Git Basics', lessons:[
          { id:'l1', title:'What is version control?', type:'video', duration:7, preview:true },
          { id:'l2', title:'Commits and history', type:'code', duration:10, preview:true },
        ]},
        { id:'m2', title:'Collaborating on GitHub', lessons:[
          { id:'l3', title:'Branches and pull requests', type:'video', duration:11, preview:false },
          { id:'l4', title:'Resolving merge conflicts', type:'reading', duration:9, preview:false },
          { id:'l5', title:'Module quiz', type:'quiz', duration:10, preview:false },
        ]},
      ],
      quiz:{ passingScore:70, questions:[
        { q:'Which command records changes to the local repository?', options:['git commit','git clone','git push','git branch'], answer:0, explanation:'git commit saves a snapshot of staged changes to history.' },
        { q:'What is a pull request used for?', options:['Proposing changes for review before merging','Deleting a repository','Installing dependencies','Renaming a branch'], answer:0, explanation:'A pull request proposes changes and opens them up for review before merging.' },
      ]},
    }),
    c({ id:'crs_010', slug:'database-design-fundamentals', title:'Database Design Fundamentals', category:'Programming',
      description:'Design relational databases with normalization, keys, and clean schema practices.',
      longDescription:'Learn how to model relational databases: entities, relationships, primary and foreign keys, normalization, and writing basic SQL queries.',
      instructorId:'usr_instructor03', difficulty:'Intermediate', duration:9, rating:4.6, reviewCount:64, studentCount:390,
      language:'English', priceType:'paid', price:69, featured:false, createdAt:'2025-10-15T00:00:00Z',
      learningOutcomes:['Model entities and relationships','Apply normalization up to 3NF','Write basic SQL SELECT, JOIN and WHERE queries','Design primary and foreign keys correctly'],
      requirements:['Basic understanding of programming logic'],
      targetAudience:['Developers building their first data-driven app'],
      modules:[
        { id:'m1', title:'Modelling Data', lessons:[
          { id:'l1', title:'Entities and relationships', type:'video', duration:10, preview:true },
          { id:'l2', title:'Normalization basics', type:'reading', duration:11, preview:false },
        ]},
        { id:'m2', title:'SQL Basics', lessons:[
          { id:'l3', title:'SELECT and WHERE', type:'code', duration:12, preview:false },
          { id:'l4', title:'JOIN queries', type:'code', duration:13, preview:false },
          { id:'l5', title:'Module quiz', type:'quiz', duration:10, preview:false },
        ]},
      ],
      quiz:{ passingScore:70, questions:[
        { q:'What does a primary key guarantee?', options:['Each row is uniquely identified','Faster typing','Automatic backups','Smaller file size'], answer:0, explanation:'A primary key uniquely identifies each row in a table.' },
        { q:'Which SQL clause filters rows based on a condition?', options:['WHERE','SELECT','JOIN','ORDER BY'], answer:0, explanation:'WHERE filters rows that match a specified condition.' },
      ]},
    }),
    c({ id:'crs_011', slug:'mobile-app-design', title:'Mobile App Design', category:'UI and UX Design',
      description:'Design intuitive, accessible mobile app interfaces following platform conventions.',
      longDescription:'Learn mobile-specific design patterns: thumb-friendly layouts, bottom navigation, gesture interactions, and accessibility considerations for iOS and Android apps.',
      instructorId:'usr_instructor02', difficulty:'Intermediate', duration:8, rating:4.8, reviewCount:59, studentCount:310,
      language:'English', priceType:'paid', price:79, featured:false, createdAt:'2025-10-20T00:00:00Z',
      learningOutcomes:['Apply mobile-first design patterns','Design thumb-friendly navigation','Design accessible touch targets','Prototype mobile screens'],
      requirements:['Completion of UI/UX Design Essentials or equivalent'],
      targetAudience:['Designers moving from web to mobile','Developers who want to design their own apps'],
      modules:[
        { id:'m1', title:'Mobile Patterns', lessons:[
          { id:'l1', title:'Thumb zones and touch targets', type:'video', duration:9, preview:true },
          { id:'l2', title:'Bottom navigation and drawers', type:'reading', duration:8, preview:false },
        ]},
        { id:'m2', title:'Prototyping', lessons:[
          { id:'l3', title:'Designing an onboarding flow', type:'assignment', duration:16, preview:false },
          { id:'l4', title:'Module quiz', type:'quiz', duration:10, preview:false },
        ]},
      ],
      quiz:{ passingScore:70, questions:[
        { q:'What is the recommended minimum touch target size?', options:['44x44 pixels','10x10 pixels','100x100 pixels','20x20 pixels'], answer:0, explanation:'44x44 pixels is a widely used minimum for comfortable tapping.' },
        { q:'Bottom navigation bars are typically used for:', options:['Primary top-level destinations','Legal disclaimers','Splash screens','Error messages'], answer:0, explanation:'Bottom navigation surfaces a small number of primary destinations.' },
      ]},
    }),
    c({ id:'crs_012', slug:'introduction-to-cloud-computing', title:'Introduction to Cloud Computing', category:'Cloud Computing',
      description:'Understand cloud fundamentals: compute, storage, networking, and deployment models.',
      longDescription:'A vendor-neutral introduction to cloud computing concepts including IaaS, PaaS, SaaS, virtual machines, storage types, and basic deployment strategies.',
      instructorId:'usr_instructor05', difficulty:'Beginner', duration:6, rating:4.5, reviewCount:71, studentCount:520,
      language:'English', priceType:'free', price:0, featured:false, createdAt:'2025-10-25T00:00:00Z',
      learningOutcomes:['Explain IaaS, PaaS and SaaS','Understand virtual machines and containers','Compare cloud storage types','Understand basic cloud cost concepts'],
      requirements:['Basic computer literacy'],
      targetAudience:['Students exploring cloud careers','Developers new to cloud platforms'],
      modules:[
        { id:'m1', title:'Cloud Foundations', lessons:[
          { id:'l1', title:'What is cloud computing?', type:'video', duration:8, preview:true },
          { id:'l2', title:'IaaS, PaaS and SaaS explained', type:'reading', duration:9, preview:true },
        ]},
        { id:'m2', title:'Core Services', lessons:[
          { id:'l3', title:'Virtual machines and containers', type:'video', duration:10, preview:false },
          { id:'l4', title:'Module quiz', type:'quiz', duration:10, preview:false },
        ]},
      ],
      quiz:{ passingScore:70, questions:[
        { q:'What does IaaS stand for?', options:['Infrastructure as a Service','Internet as a Service','Integration as a Service','Instance as a Service'], answer:0, explanation:'IaaS stands for Infrastructure as a Service.' },
        { q:'A container differs from a virtual machine mainly because it:', options:['Shares the host OS kernel','Requires its own physical hardware','Cannot be scaled','Only runs on mobile devices'], answer:0, explanation:'Containers share the host OS kernel, making them lighter than full virtual machines.' },
      ]},
    }),
  ];
  saveData('stdyio_courses', courses);
}

function seedTestimonials() {
  if (localStorage.getItem('stdyio_testimonials') !== null) return;
  saveData('stdyio_testimonials', [
    { id:'t1', name:'Nurul Izzati', course:'HTML and CSS Fundamentals', rating:5, text:'stdy.io made it so easy to finally understand CSS Grid. The progress tracker kept me motivated every week.' },
    { id:'t2', name:'Daniel Wong', course:'JavaScript for Beginners', rating:5, text:'The hands-on projects helped everything click. I built my first interactive page after just two weeks.' },
    { id:'t3', name:'Priya Sharma', course:'UI and UX Design Essentials', rating:4, text:'Clear, practical lessons. I especially loved the wireframing module and the instructor feedback in the forum.' },
    { id:'t4', name:'Haziq Rahman', course:'Introduction to Python', rating:5, text:'Best free course I have taken online. The quizzes made sure I actually retained what I learned.' },
    { id:'t5', name:'Chen Wei Ling', course:'Cybersecurity Basics', rating:5, text:'Practical and easy to follow. I now feel confident spotting phishing attempts and setting up 2FA.' },
  ]);
}

function seedThreads() {
  return [
    { id:'th1', courseId:'crs_002', category:'Questions', title:'Why is my click event not firing?',
      authorId:'usr_student01', createdAt:'2026-06-20T10:00:00Z', updatedAt:'2026-06-20T12:00:00Z',
      status:'open', pinned:false, locked:false },
    { id:'th2', courseId:'crs_001', category:'Study Tips', title:'How I memorise CSS Flexbox properties',
      authorId:'usr_student01', createdAt:'2026-06-18T09:00:00Z', updatedAt:'2026-06-19T09:00:00Z',
      status:'open', pinned:true, locked:false },
    { id:'th3', courseId:null, category:'Announcements', title:'Welcome to the stdy.io community forum',
      authorId:'usr_admin01', createdAt:'2026-06-01T09:00:00Z', updatedAt:'2026-06-01T09:00:00Z',
      status:'open', pinned:true, locked:false },
  ];
}

function seedReplies() {
  return [
    { id:'r1', threadId:'th1', authorId:'usr_instructor01', content:'Make sure your script is loaded after the DOM, or wrap your code in a DOMContentLoaded listener.',
      createdAt:'2026-06-20T11:00:00Z', upvotes:6, isInstructorAnswer:true },
    { id:'r2', threadId:'th1', authorId:'usr_student01', content:'That fixed it, thank you so much!', createdAt:'2026-06-20T11:30:00Z', upvotes:1, isInstructorAnswer:false },
    { id:'r3', threadId:'th2', authorId:'usr_instructor01', content:'Great tip! I would add: practice by rebuilding the same layout with only Flexbox properties, no fixed widths.',
      createdAt:'2026-06-19T08:00:00Z', upvotes:4, isInstructorAnswer:false },
  ];
}
