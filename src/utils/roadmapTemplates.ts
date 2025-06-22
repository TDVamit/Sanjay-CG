import { v4 as uuidv4 } from 'uuid';
import type { RoadmapData } from '../types/roadmap';

export const createSampleRoadmap = (): RoadmapData => {
  const block1Id = uuidv4();
  const block2Id = uuidv4();
  const block3Id = uuidv4();
  const block4Id = uuidv4();
  const block5Id = uuidv4();

  return {
    blocks: [
      {
        block_id: block1Id,
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        color: '#3B82F6',
        inner_label: 'Getting Started',
        outer_label: 'Foundation',
        outer_label_direction: 'up',
        html_content: `
          <h3>Welcome to Your Journey</h3>
          <p>This is your starting point. Begin by understanding the basics and building a strong foundation.</p>
          <ul>
            <li>Learn the fundamentals</li>
            <li>Set up your environment</li>
            <li>Create your first project</li>
          </ul>
        `,
        connected_blocks: {
          [block2Id]: 'right'
        }
      },
      {
        block_id: block2Id,
        x: 400,
        y: 100,
        width: 200,
        height: 100,
        color: '#10B981',
        inner_label: 'Skill Building',
        outer_label: 'Development',
        outer_label_direction: 'up',
        html_content: `
          <h3>Develop Your Skills</h3>
          <p>Focus on building core competencies and practical experience.</p>
          <ul>
            <li>Practice coding daily</li>
            <li>Work on projects</li>
            <li>Learn best practices</li>
            <li>Study algorithms</li>
          </ul>
        `,
        connected_blocks: {
          [block3Id]: 'down'
        }
      },
      {
        block_id: block3Id,
        x: 400,
        y: 300,
        width: 200,
        height: 100,
        color: '#F59E0B',
        inner_label: 'Specialization',
        outer_label: 'Focus Area',
        outer_label_direction: 'bottom',
        html_content: `
          <h3>Choose Your Path</h3>
          <p>Select a specialization that aligns with your interests and career goals.</p>
          <ul>
            <li>Frontend Development</li>
            <li>Backend Development</li>
            <li>Full-Stack Development</li>
            <li>Mobile Development</li>
            <li>Data Science</li>
            <li>DevOps</li>
          </ul>
        `,
        connected_blocks: {
          [block4Id]: 'right'
        }
      },
      {
        block_id: block4Id,
        x: 700,
        y: 300,
        width: 200,
        height: 100,
        color: '#8B5CF6',
        inner_label: 'Professional Growth',
        outer_label: 'Career',
        outer_label_direction: 'bottom',
        html_content: `
          <h3>Advance Your Career</h3>
          <p>Focus on professional development and building your career.</p>
          <ul>
            <li>Build a portfolio</li>
            <li>Network with professionals</li>
            <li>Contribute to open source</li>
            <li>Attend conferences</li>
            <li>Seek mentorship</li>
          </ul>
        `,
        connected_blocks: {
          [block5Id]: 'down'
        }
      },
      {
        block_id: block5Id,
        x: 700,
        y: 500,
        width: 200,
        height: 100,
        color: '#EF4444',
        inner_label: 'Mastery',
        outer_label: 'Expert Level',
        outer_label_direction: 'bottom',
        html_content: `
          <h3>Achieve Mastery</h3>
          <p>Become an expert in your field and help others on their journey.</p>
          <ul>
            <li>Lead technical projects</li>
            <li>Mentor junior developers</li>
            <li>Speak at conferences</li>
            <li>Write technical articles</li>
            <li>Continuously learn new technologies</li>
          </ul>
        `,
        connected_blocks: {}
      }
    ]
  };
};

export const createEmptyRoadmap = (): RoadmapData => {
  return {
    blocks: []
  };
};

export const createFullStackTemplate = (): RoadmapData => {
  const htmlId = uuidv4();
  const cssId = uuidv4();
  const jsId = uuidv4();
  const reactId = uuidv4();
  const nodeId = uuidv4();
  const dbId = uuidv4();
  const deployId = uuidv4();

  return {
    blocks: [
      {
        block_id: htmlId,
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        color: '#E34F26',
        inner_label: 'HTML',
        outer_label: 'Frontend Basics',
        outer_label_direction: 'up',
        html_content: `
          <h3>HTML Fundamentals</h3>
          <p>Learn the structure of web pages</p>
          <ul>
            <li>Semantic HTML</li>
            <li>Forms and inputs</li>
            <li>Accessibility</li>
          </ul>
        `,
        connected_blocks: {
          [cssId]: 'right'
        }
      },
      {
        block_id: cssId,
        x: 400,
        y: 100,
        width: 200,
        height: 100,
        color: '#1572B6',
        inner_label: 'CSS',
        outer_label: 'Styling',
        outer_label_direction: 'up',
        html_content: `
          <h3>CSS Styling</h3>
          <p>Make your websites beautiful</p>
          <ul>
            <li>Flexbox & Grid</li>
            <li>Responsive design</li>
            <li>CSS frameworks</li>
          </ul>
        `,
        connected_blocks: {
          [jsId]: 'right'
        }
      },
      {
        block_id: jsId,
        x: 700,
        y: 100,
        width: 200,
        height: 100,
        color: '#F7DF1E',
        inner_label: 'JavaScript',
        outer_label: 'Programming',
        outer_label_direction: 'up',
        html_content: `
          <h3>JavaScript Fundamentals</h3>
          <p>Add interactivity to your websites</p>
          <ul>
            <li>ES6+ features</li>
            <li>DOM manipulation</li>
            <li>Async programming</li>
          </ul>
        `,
        connected_blocks: {
          [reactId]: 'down'
        }
      },
      {
        block_id: reactId,
        x: 700,
        y: 300,
        width: 200,
        height: 100,
        color: '#61DAFB',
        inner_label: 'React',
        outer_label: 'Frontend Framework',
        outer_label_direction: 'bottom',
        html_content: `
          <h3>React Development</h3>
          <p>Build modern user interfaces</p>
          <ul>
            <li>Components & JSX</li>
            <li>State management</li>
            <li>Hooks</li>
            <li>React Router</li>
          </ul>
        `,
        connected_blocks: {
          [nodeId]: 'left'
        }
      },
      {
        block_id: nodeId,
        x: 400,
        y: 300,
        width: 200,
        height: 100,
        color: '#339933',
        inner_label: 'Node.js',
        outer_label: 'Backend',
        outer_label_direction: 'bottom',
        html_content: `
          <h3>Backend Development</h3>
          <p>Build server-side applications</p>
          <ul>
            <li>Express.js</li>
            <li>RESTful APIs</li>
            <li>Authentication</li>
            <li>Middleware</li>
          </ul>
        `,
        connected_blocks: {
          [dbId]: 'left'
        }
      },
      {
        block_id: dbId,
        x: 100,
        y: 300,
        width: 200,
        height: 100,
        color: '#4DB33D',
        inner_label: 'Database',
        outer_label: 'Data Storage',
        outer_label_direction: 'bottom',
        html_content: `
          <h3>Database Management</h3>
          <p>Store and retrieve data efficiently</p>
          <ul>
            <li>MongoDB</li>
            <li>PostgreSQL</li>
            <li>Database design</li>
            <li>Query optimization</li>
          </ul>
        `,
        connected_blocks: {
          [deployId]: 'down'
        }
      },
      {
        block_id: deployId,
        x: 100,
        y: 500,
        width: 200,
        height: 100,
        color: '#FF6B6B',
        inner_label: 'Deployment',
        outer_label: 'DevOps',
        outer_label_direction: 'bottom',
        html_content: `
          <h3>Application Deployment</h3>
          <p>Deploy your applications to production</p>
          <ul>
            <li>Docker</li>
            <li>AWS/Heroku</li>
            <li>CI/CD pipelines</li>
            <li>Monitoring</li>
          </ul>
        `,
        connected_blocks: {}
      }
    ]
  };
};

export const ROADMAP_TEMPLATES = [
  {
    id: 'sample',
    name: 'Sample Career Path',
    description: 'A general template showing the progression from beginner to expert',
    data: createSampleRoadmap()
  },
  {
    id: 'fullstack',
    name: 'Full-Stack Developer',
    description: 'Complete roadmap for becoming a full-stack web developer',
    data: createFullStackTemplate()
  },
  {
    id: 'empty',
    name: 'Start from Scratch',
    description: 'Begin with an empty canvas to create your own roadmap',
    data: createEmptyRoadmap()
  }
]; 