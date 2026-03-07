/*
  # Insert default templates for all user roles

  1. Templates Created
    - Student templates: Study Planner, Project Management
    - Teacher templates: Lesson Planning
    - Writer templates: Writing Projects
    - Freelancer templates: Client Projects
    - Project Manager templates: Sprint Planning

  2. Template Structure
    - Each template includes board configuration
    - Pre-configured lists with sample cards
    - Role-specific labels and workflows
    - Realistic example content

  3. System Templates
    - All templates are public and system-created
    - created_by is set to NULL for system templates
    - Templates are available to all users of the respective role
*/

-- Insert Student templates
INSERT INTO templates (title, description, role, template_data, is_public, created_by) VALUES
(
  'Study Planner',
  'Track assignments, exams, and study sessions effectively',
  'student',
  '{
    "board": {
      "title": "Study Planner",
      "description": "Organize your academic life with this comprehensive study planner",
      "color": "#3B82F6"
    },
    "lists": [
      {
        "title": "📚 To Study",
        "position": 0,
        "cards": [
          {
            "title": "Review Chapter 5 - Biology",
            "description": "Focus on cellular respiration and photosynthesis",
            "labels": ["Biology", "High Priority"],
            "position": 0
          },
          {
            "title": "Math Problem Set 3",
            "description": "Complete exercises 1-20 on quadratic equations",
            "labels": ["Mathematics"],
            "position": 1
          }
        ]
      },
      {
        "title": "📖 In Progress",
        "position": 1,
        "cards": [
          {
            "title": "History Essay Draft",
            "description": "Write first draft on World War II causes",
            "labels": ["History", "Essay"],
            "position": 0
          }
        ]
      },
      {
        "title": "✅ Completed",
        "position": 2,
        "cards": [
          {
            "title": "Chemistry Lab Report",
            "description": "Submitted lab report on acid-base reactions",
            "labels": ["Chemistry", "Lab"],
            "position": 0
          }
        ]
      }
    ]
  }',
  true,
  NULL
),
(
  'Project Management',
  'Organize group projects and track deadlines',
  'student',
  '{
    "board": {
      "title": "Group Project - Marketing Campaign",
      "description": "Collaborative project for Marketing 101 class",
      "color": "#10B981"
    },
    "lists": [
      {
        "title": "🎯 Planning",
        "position": 0,
        "cards": [
          {
            "title": "Define Target Audience",
            "description": "Research and identify our primary customer segments",
            "labels": ["Research", "High Priority"],
            "position": 0
          },
          {
            "title": "Competitor Analysis",
            "description": "Analyze 3 main competitors and their strategies",
            "labels": ["Research"],
            "position": 1
          }
        ]
      },
      {
        "title": "🚀 In Progress",
        "position": 1,
        "cards": [
          {
            "title": "Create Brand Guidelines",
            "description": "Design logo, color scheme, and typography",
            "labels": ["Design", "Branding"],
            "position": 0
          }
        ]
      },
      {
        "title": "👀 Review",
        "position": 2,
        "cards": []
      },
      {
        "title": "✅ Done",
        "position": 3,
        "cards": [
          {
            "title": "Team Formation",
            "description": "Assembled team of 4 members with diverse skills",
            "labels": ["Team"],
            "position": 0
          }
        ]
      }
    ]
  }',
  true,
  NULL
);

-- Insert Teacher templates
INSERT INTO templates (title, description, role, template_data, is_public, created_by) VALUES
(
  'Lesson Planning',
  'Plan and organize your curriculum effectively',
  'teacher',
  '{
    "board": {
      "title": "English Literature - Semester 1",
      "description": "Comprehensive lesson planning for 9th grade English Literature",
      "color": "#8B5CF6"
    },
    "lists": [
      {
        "title": "📋 To Plan",
        "position": 0,
        "cards": [
          {
            "title": "Shakespeare Unit Introduction",
            "description": "Plan engaging introduction to Romeo and Juliet",
            "labels": ["Shakespeare", "Unit Planning"],
            "position": 0
          },
          {
            "title": "Poetry Analysis Workshop",
            "description": "Design interactive poetry analysis activities",
            "labels": ["Poetry", "Workshop"],
            "position": 1
          }
        ]
      },
      {
        "title": "📚 This Week",
        "position": 1,
        "cards": [
          {
            "title": "Character Development Lesson",
            "description": "Teach students about character arcs and development",
            "labels": ["Character Study", "Active"],
            "position": 0
          }
        ]
      },
      {
        "title": "✅ Completed",
        "position": 2,
        "cards": [
          {
            "title": "Course Syllabus",
            "description": "Finalized and distributed semester syllabus",
            "labels": ["Administrative"],
            "position": 0
          }
        ]
      }
    ]
  }',
  true,
  NULL
);

-- Insert Writer templates
INSERT INTO templates (title, description, role, template_data, is_public, created_by) VALUES
(
  'Writing Projects',
  'Track articles, books, and creative works',
  'writer',
  '{
    "board": {
      "title": "Writing Portfolio 2024",
      "description": "Manage all writing projects and deadlines",
      "color": "#F59E0B"
    },
    "lists": [
      {
        "title": "💡 Ideas",
        "position": 0,
        "cards": [
          {
            "title": "Article: Remote Work Productivity",
            "description": "5 tips for staying productive while working from home",
            "labels": ["Article", "Productivity"],
            "position": 0
          },
          {
            "title": "Short Story: The Last Library",
            "description": "Dystopian fiction about the world''s last physical library",
            "labels": ["Fiction", "Short Story"],
            "position": 1
          }
        ]
      },
      {
        "title": "✍️ Writing",
        "position": 1,
        "cards": [
          {
            "title": "Blog Post: AI in Creative Writing",
            "description": "Exploring how AI tools are changing the writing landscape",
            "labels": ["Blog", "Technology"],
            "position": 0
          }
        ]
      },
      {
        "title": "📝 Editing",
        "position": 2,
        "cards": []
      },
      {
        "title": "📤 Published",
        "position": 3,
        "cards": [
          {
            "title": "Article: Freelance Writing Tips",
            "description": "Published on Medium - 1.2k views",
            "labels": ["Article", "Published"],
            "position": 0
          }
        ]
      }
    ]
  }',
  true,
  NULL
);

-- Insert Freelancer templates
INSERT INTO templates (title, description, role, template_data, is_public, created_by) VALUES
(
  'Client Projects',
  'Manage client work and deliverables efficiently',
  'freelancer',
  '{
    "board": {
      "title": "Client Projects - Q1 2024",
      "description": "Track all active client projects and deadlines",
      "color": "#EF4444"
    },
    "lists": [
      {
        "title": "🎯 Proposals",
        "position": 0,
        "cards": [
          {
            "title": "Website Redesign - TechCorp",
            "description": "Proposal for complete website overhaul",
            "labels": ["Web Design", "Proposal"],
            "position": 0
          }
        ]
      },
      {
        "title": "🚀 Active Projects",
        "position": 1,
        "cards": [
          {
            "title": "Logo Design - StartupXYZ",
            "description": "Create modern logo and brand identity",
            "labels": ["Design", "Branding", "Urgent"],
            "position": 0
          },
          {
            "title": "Content Writing - BlogCo",
            "description": "Write 5 blog posts on digital marketing",
            "labels": ["Writing", "Content"],
            "position": 1
          }
        ]
      },
      {
        "title": "👀 Review",
        "position": 2,
        "cards": [
          {
            "title": "Mobile App UI - AppStudio",
            "description": "Waiting for client feedback on initial designs",
            "labels": ["UI Design", "Mobile"],
            "position": 0
          }
        ]
      },
      {
        "title": "✅ Completed",
        "position": 3,
        "cards": [
          {
            "title": "Business Cards - LocalBiz",
            "description": "Delivered final business card designs",
            "labels": ["Print Design", "Completed"],
            "position": 0
          }
        ]
      }
    ]
  }',
  true,
  NULL
);

-- Insert Project Manager templates
INSERT INTO templates (title, description, role, template_data, is_public, created_by) VALUES
(
  'Sprint Planning',
  'Organize agile development cycles effectively',
  'project_manager',
  '{
    "board": {
      "title": "Product Development - Sprint 12",
      "description": "Two-week sprint for mobile app feature development",
      "color": "#06B6D4"
    },
    "lists": [
      {
        "title": "📋 Backlog",
        "position": 0,
        "cards": [
          {
            "title": "User Authentication System",
            "description": "Implement secure login/logout functionality",
            "labels": ["Backend", "Security", "High Priority"],
            "position": 0
          },
          {
            "title": "Push Notifications",
            "description": "Add push notification system for user engagement",
            "labels": ["Mobile", "Feature"],
            "position": 1
          }
        ]
      },
      {
        "title": "🏃 In Progress",
        "position": 1,
        "cards": [
          {
            "title": "Dashboard UI Redesign",
            "description": "Modernize the main dashboard interface",
            "labels": ["Frontend", "UI/UX"],
            "position": 0
          },
          {
            "title": "API Performance Optimization",
            "description": "Improve response times for data queries",
            "labels": ["Backend", "Performance"],
            "position": 1
          }
        ]
      },
      {
        "title": "🔍 Testing",
        "position": 2,
        "cards": [
          {
            "title": "Payment Integration",
            "description": "QA testing for Stripe payment system",
            "labels": ["Testing", "Payment"],
            "position": 0
          }
        ]
      },
      {
        "title": "✅ Done",
        "position": 3,
        "cards": [
          {
            "title": "Database Schema Update",
            "description": "Added new tables for user preferences",
            "labels": ["Database", "Completed"],
            "position": 0
          }
        ]
      }
    ]
  }',
  true,
  NULL
);