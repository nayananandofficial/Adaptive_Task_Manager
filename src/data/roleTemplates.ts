import type { Database } from '../lib/database.types'

export type UserRole = Database['public']['Tables']['users']['Row']['role']

export interface TemplateCardDefinition {
  title: string
  description?: string
  labels?: string[]
}

export interface TemplateListDefinition {
  title: string
  cards?: TemplateCardDefinition[]
}

export interface BoardTemplateDefinition {
  id: string
  role: UserRole
  name: string
  description: string
  board: {
    title: string
    description: string
    color: string
  }
  lists: TemplateListDefinition[]
}

export const boardTemplates: BoardTemplateDefinition[] = [
  {
    id: 'student-study-planner',
    role: 'student',
    name: 'Study Planner',
    description: 'Track assignments, exams, and study sessions',
    board: {
      title: 'Study Planner',
      description: 'Organize coursework, due dates, and weekly study goals.',
      color: '#3B82F6'
    },
    lists: [{ title: 'Backlog' }, { title: 'This Week' }, { title: 'In Progress' }, { title: 'Done' }]
  },
  {
    id: 'student-project-management',
    role: 'student',
    name: 'Project Management',
    description: 'Organize group projects and deadlines',
    board: {
      title: 'Student Project Tracker',
      description: 'Track project phases and ownership for group work.',
      color: '#2563EB'
    },
    lists: [{ title: 'Ideas' }, { title: 'Planning' }, { title: 'Execution' }, { title: 'Submitted' }]
  },
  {
    id: 'student-course-tracker',
    role: 'student',
    name: 'Course Tracker',
    description: 'Monitor progress across all your courses',
    board: {
      title: 'Course Tracker',
      description: 'Keep course activities visible across the semester.',
      color: '#1D4ED8'
    },
    lists: [{ title: 'Upcoming' }, { title: 'Active' }, { title: 'Review Needed' }, { title: 'Completed' }]
  },
  {
    id: 'teacher-lesson-planning',
    role: 'teacher',
    name: 'Lesson Planning',
    description: 'Plan and organize your curriculum',
    board: {
      title: 'Lesson Planning',
      description: 'Map lesson ideas from planning through classroom delivery.',
      color: '#16A34A'
    },
    lists: [{ title: 'Ideas' }, { title: 'Drafting' }, { title: 'Ready to Teach' }, { title: 'Taught' }]
  },
  {
    id: 'teacher-student-progress',
    role: 'teacher',
    name: 'Student Progress',
    description: 'Track student assignments and grades',
    board: {
      title: 'Student Progress',
      description: 'Monitor assignment flow and intervention priorities.',
      color: '#15803D'
    },
    lists: [{ title: 'Needs Attention' }, { title: 'On Track' }, { title: 'Excelling' }]
  },
  {
    id: 'teacher-class-management',
    role: 'teacher',
    name: 'Class Management',
    description: 'Manage classroom activities and events',
    board: {
      title: 'Class Management',
      description: 'Coordinate class activities, reminders, and communications.',
      color: '#166534'
    },
    lists: [{ title: 'Upcoming' }, { title: 'In Progress' }, { title: 'Completed' }]
  },
  {
    id: 'writer-writing-projects',
    role: 'writer',
    name: 'Writing Projects',
    description: 'Track articles, books, and creative works',
    board: {
      title: 'Writing Projects',
      description: 'Track writing from idea through publication.',
      color: '#9333EA'
    },
    lists: [{ title: 'Ideas' }, { title: 'Drafting' }, { title: 'Editing' }, { title: 'Published' }]
  },
  {
    id: 'writer-editorial-calendar',
    role: 'writer',
    name: 'Editorial Calendar',
    description: 'Plan and schedule your content',
    board: {
      title: 'Editorial Calendar',
      description: 'Plan your publishing cadence and content pipeline.',
      color: '#7E22CE'
    },
    lists: [{ title: 'Planned' }, { title: 'Writing' }, { title: 'Scheduled' }, { title: 'Published' }]
  },
  {
    id: 'writer-research-board',
    role: 'writer',
    name: 'Research Board',
    description: 'Organize research and reference materials',
    board: {
      title: 'Research Board',
      description: 'Collect and track sources, interviews, and notes.',
      color: '#6B21A8'
    },
    lists: [{ title: 'To Research' }, { title: 'Sources Collected' }, { title: 'Verified' }, { title: 'Ready to Use' }]
  },
  {
    id: 'freelancer-client-projects',
    role: 'freelancer',
    name: 'Client Projects',
    description: 'Manage client work and deliverables',
    board: {
      title: 'Client Projects',
      description: 'Track project progress and key deliverables per client.',
      color: '#EA580C'
    },
    lists: [{ title: 'Leads' }, { title: 'Active Work' }, { title: 'Review' }, { title: 'Delivered' }]
  },
  {
    id: 'freelancer-business-development',
    role: 'freelancer',
    name: 'Business Development',
    description: 'Track leads and opportunities',
    board: {
      title: 'Business Development',
      description: 'Follow your pipeline from prospecting to closed deals.',
      color: '#C2410C'
    },
    lists: [{ title: 'Prospects' }, { title: 'Contacted' }, { title: 'Negotiation' }, { title: 'Won' }]
  },
  {
    id: 'freelancer-invoice-tracker',
    role: 'freelancer',
    name: 'Invoice Tracker',
    description: 'Monitor payments and finances',
    board: {
      title: 'Invoice Tracker',
      description: 'Keep invoicing and payment status visible.',
      color: '#9A3412'
    },
    lists: [{ title: 'To Invoice' }, { title: 'Sent' }, { title: 'Overdue' }, { title: 'Paid' }]
  },
  {
    id: 'pm-sprint-planning',
    role: 'project_manager',
    name: 'Sprint Planning',
    description: 'Organize agile development cycles',
    board: {
      title: 'Sprint Planning',
      description: 'Plan sprint work from backlog to release.',
      color: '#DC2626'
    },
    lists: [{ title: 'Backlog' }, { title: 'Sprint Ready' }, { title: 'In Sprint' }, { title: 'Done' }]
  },
  {
    id: 'pm-team-coordination',
    role: 'project_manager',
    name: 'Team Coordination',
    description: 'Track team tasks and milestones',
    board: {
      title: 'Team Coordination',
      description: 'Track workstreams and blockers across the team.',
      color: '#B91C1C'
    },
    lists: [{ title: 'Planned' }, { title: 'In Progress' }, { title: 'Blocked' }, { title: 'Completed' }]
  },
  {
    id: 'pm-resource-management',
    role: 'project_manager',
    name: 'Resource Management',
    description: 'Monitor resources and budgets',
    board: {
      title: 'Resource Management',
      description: 'Balance workload, budget, and resource utilization.',
      color: '#991B1B'
    },
    lists: [{ title: 'Requested' }, { title: 'Allocated' }, { title: 'At Risk' }, { title: 'Closed' }]
  }
]

export const templatesByRole: Record<UserRole, BoardTemplateDefinition[]> = {
  student: boardTemplates.filter((template) => template.role === 'student'),
  teacher: boardTemplates.filter((template) => template.role === 'teacher'),
  writer: boardTemplates.filter((template) => template.role === 'writer'),
  freelancer: boardTemplates.filter((template) => template.role === 'freelancer'),
  project_manager: boardTemplates.filter((template) => template.role === 'project_manager')
}

export function getTemplateById(templateId: string): BoardTemplateDefinition | undefined {
  return boardTemplates.find((template) => template.id === templateId)
}
