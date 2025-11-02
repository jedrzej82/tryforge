/**
 * Agency Tools Module
 * Complete tools for agencies using TryForge
 * - Multi-tenant project management
 * - Client portal
 * - Proposal generation
 * - Time tracking & billing
 * - Team collaboration
 */

const EventEmitter = require('events');

class AgencyTools extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;
    this.projects = new Map();
    this.clients = new Map();
    this.proposals = new Map();
    this.timeEntries = [];
    this.team = new Map();
  }

  // ============================================
  // PROJECT MANAGEMENT
  // ============================================

  /**
   * Create multi-tenant project
   */
  async createClientProject(clientId, projectData) {
    const project = {
      id: this.generateId(),
      clientId,
      name: projectData.name,
      template: projectData.template,
      status: 'active', // active, paused, completed, cancelled
      createdAt: new Date(),
      deadline: projectData.deadline,
      budget: projectData.budget,
      team: projectData.team || [],
      milestones: projectData.milestones || [],
      deliverables: [],
      repository: null,
      staging: null,
      production: null,
      metadata: projectData.metadata || {}
    };

    this.projects.set(project.id, project);
    this.emit('project:created', project);

    return project;
  }

  /**
   * Get all projects for client
   */
  getClientProjects(clientId) {
    return Array.from(this.projects.values())
      .filter(p => p.clientId === clientId);
  }

  /**
   * Update project status
   */
  async updateProjectStatus(projectId, status, notes = '') {
    const project = this.projects.get(projectId);
    if (!project) throw new Error('Project not found');

    project.status = status;
    project.lastUpdate = new Date();
    project.statusNotes = notes;

    this.emit('project:updated', project);
    return project;
  }

  /**
   * Add milestone to project
   */
  async addMilestone(projectId, milestone) {
    const project = this.projects.get(projectId);
    if (!project) throw new Error('Project not found');

    const newMilestone = {
      id: this.generateId(),
      name: milestone.name,
      description: milestone.description,
      deadline: milestone.deadline,
      status: 'pending', // pending, in-progress, completed, delayed
      deliverables: milestone.deliverables || [],
      payment: milestone.payment || 0,
      completed: false,
      completedAt: null
    };

    project.milestones.push(newMilestone);
    this.emit('milestone:added', { project, milestone: newMilestone });

    return newMilestone;
  }

  // ============================================
  // CLIENT MANAGEMENT
  // ============================================

  /**
   * Create client
   */
  async createClient(clientData) {
    const client = {
      id: this.generateId(),
      name: clientData.name,
      company: clientData.company,
      email: clientData.email,
      phone: clientData.phone,
      website: clientData.website,
      industry: clientData.industry,
      size: clientData.size, // small, medium, large, enterprise
      budget: clientData.budget,
      status: 'active', // active, inactive, lead
      createdAt: new Date(),
      projects: [],
      contacts: clientData.contacts || [],
      notes: clientData.notes || '',
      tags: clientData.tags || [],
      customFields: clientData.customFields || {}
    };

    this.clients.set(client.id, client);
    this.emit('client:created', client);

    return client;
  }

  /**
   * Get client portal data
   */
  async getClientPortalData(clientId) {
    const client = this.clients.get(clientId);
    if (!client) throw new Error('Client not found');

    const projects = this.getClientProjects(clientId);
    
    return {
      client: {
        name: client.name,
        company: client.company,
        email: client.email
      },
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        progress: this.calculateProjectProgress(p),
        milestones: p.milestones,
        nextDeadline: this.getNextDeadline(p),
        staging: p.staging,
        production: p.production
      })),
      invoices: this.getClientInvoices(clientId),
      totalBilled: this.calculateTotalBilled(clientId),
      upcomingPayments: this.getUpcomingPayments(clientId)
    };
  }

  // ============================================
  // PROPOSAL GENERATION
  // ============================================

  /**
   * Generate project proposal
   */
  async generateProposal(proposalData) {
    const proposal = {
      id: this.generateId(),
      clientId: proposalData.clientId,
      title: proposalData.title,
      projectType: proposalData.projectType,
      template: proposalData.template,
      scope: this.generateScope(proposalData),
      timeline: this.generateTimeline(proposalData),
      pricing: this.calculatePricing(proposalData),
      terms: this.generateTerms(proposalData),
      deliverables: proposalData.deliverables || [],
      status: 'draft', // draft, sent, accepted, rejected
      createdAt: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      metadata: proposalData.metadata || {}
    };

    this.proposals.set(proposal.id, proposal);
    this.emit('proposal:created', proposal);

    return proposal;
  }

  /**
   * Generate project scope
   */
  generateScope(proposalData) {
    const scopes = {
      'seo-platform': {
        overview: 'Enterprise SEO platform with web crawling, backlink analysis, and keyword research',
        features: [
          'Distributed web crawler (millions of pages/day)',
          'Backlink database and analysis',
          'Keyword research with search volume',
          'Site audit and health scoring',
          'Rank tracking across regions',
          'Competitive analysis',
          'API for integrations',
          'Real-time analytics dashboard'
        ],
        technologies: ['Node.js', 'React', 'PostgreSQL', 'Redis', 'Elasticsearch', 'Kubernetes'],
        infrastructure: 'Cloud-native with auto-scaling'
      },
      'marketplace': {
        overview: 'Multi-vendor e-commerce marketplace with advanced features',
        features: [
          'Multi-vendor support with seller dashboards',
          'Product catalog (millions of items)',
          'Advanced search and filtering',
          'Payment processing (multiple gateways)',
          'Order management system',
          'Review and rating system',
          'Shipping integrations',
          'Admin dashboard and analytics'
        ],
        technologies: ['Node.js', 'Next.js', 'PostgreSQL', 'Redis', 'Stripe', 'Docker'],
        infrastructure: 'Microservices architecture'
      },
      'classifieds': {
        overview: 'Location-based classifieds platform with real-time features',
        features: [
          'Location-based search (PostGIS)',
          'Real-time messaging',
          'Mobile apps (iOS/Android)',
          'Image upload and processing',
          'Push notifications',
          'Featured ads and promotion',
          'User ratings and trust system',
          'Advanced moderation tools'
        ],
        technologies: ['Node.js', 'React Native', 'MongoDB', 'Redis', 'Socket.io', 'AWS S3'],
        infrastructure: 'Real-time with WebSocket'
      }
    };

    const baseScope = scopes[proposalData.template] || scopes['marketplace'];

    return {
      ...baseScope,
      customRequirements: proposalData.customRequirements || [],
      outOfScope: proposalData.outOfScope || []
    };
  }

  /**
   * Generate project timeline
   */
  generateTimeline(proposalData) {
    const durations = {
      'seo-platform': 12, // weeks
      'marketplace': 10,
      'classifieds': 8,
      'blog': 4,
      'landing': 2,
      'dashboard': 6
    };

    const duration = durations[proposalData.template] || 8;
    const phases = this.generatePhases(proposalData.template, duration);

    return {
      totalDuration: duration,
      unit: 'weeks',
      phases,
      startDate: proposalData.startDate || new Date(),
      estimatedCompletion: new Date(Date.now() + duration * 7 * 24 * 60 * 60 * 1000)
    };
  }

  /**
   * Generate project phases
   */
  generatePhases(template, totalWeeks) {
    const phases = [
      {
        name: 'Discovery & Planning',
        duration: Math.ceil(totalWeeks * 0.15),
        deliverables: ['Requirements document', 'Technical architecture', 'Design mockups']
      },
      {
        name: 'Development - Phase 1',
        duration: Math.ceil(totalWeeks * 0.35),
        deliverables: ['Core features', 'Database setup', 'API development']
      },
      {
        name: 'Development - Phase 2',
        duration: Math.ceil(totalWeeks * 0.25),
        deliverables: ['Advanced features', 'Integrations', 'Admin panel']
      },
      {
        name: 'Testing & QA',
        duration: Math.ceil(totalWeeks * 0.15),
        deliverables: ['Test reports', 'Bug fixes', 'Performance optimization']
      },
      {
        name: 'Deployment & Training',
        duration: Math.ceil(totalWeeks * 0.10),
        deliverables: ['Production deployment', 'Documentation', 'Team training']
      }
    ];

    return phases;
  }

  /**
   * Calculate pricing
   */
  calculatePricing(proposalData) {
    const basePrices = {
      'seo-platform': 75000,
      'marketplace': 65000,
      'classifieds': 50000,
      'blog': 15000,
      'landing': 8000,
      'dashboard': 30000
    };

    const basePrice = basePrices[proposalData.template] || 40000;
    
    // Calculate complexity multiplier
    let multiplier = 1.0;
    if (proposalData.customRequirements?.length > 0) {
      multiplier += 0.1 * proposalData.customRequirements.length;
    }
    if (proposalData.integrations?.length > 0) {
      multiplier += 0.15 * proposalData.integrations.length;
    }

    const developmentCost = Math.round(basePrice * multiplier);
    const monthlyMaintenance = Math.round(developmentCost * 0.15);

    return {
      development: {
        total: developmentCost,
        breakdown: {
          discovery: Math.round(developmentCost * 0.10),
          development: Math.round(developmentCost * 0.65),
          testing: Math.round(developmentCost * 0.15),
          deployment: Math.round(developmentCost * 0.10)
        }
      },
      maintenance: {
        monthly: monthlyMaintenance,
        includes: [
          'Bug fixes and security updates',
          'Performance monitoring',
          'Monthly reports',
          'Priority support'
        ]
      },
      hosting: {
        monthly: 500,
        includes: ['Cloud hosting', 'CDN', 'Backups', 'SSL certificates']
      },
      payment: {
        schedule: 'milestone-based',
        terms: '30% upfront, 40% mid-project, 30% on completion'
      }
    };
  }

  /**
   * Generate terms and conditions
   */
  generateTerms(proposalData) {
    return {
      paymentTerms: 'Net 30 days from invoice date',
      milestonePayments: true,
      changeRequests: 'Additional features will be quoted separately',
      ownership: 'Client owns all code and assets upon final payment',
      warranty: '90 days bug-fix warranty after launch',
      support: '30 days free support, then maintenance contract',
      revisions: 'Includes 2 rounds of revisions per deliverable',
      cancellation: 'Client may cancel with 30 days notice, paying for work completed'
    };
  }

  /**
   * Export proposal as document
   */
  async exportProposal(proposalId, format = 'html') {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) throw new Error('Proposal not found');

    const client = this.clients.get(proposal.clientId);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Project Proposal - ${proposal.title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
    h2 { color: #1e40af; margin-top: 30px; }
    .section { margin: 20px 0; }
    .price { font-size: 24px; font-weight: bold; color: #059669; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f3f4f6; font-weight: bold; }
    ul { line-height: 1.8; }
  </style>
</head>
<body>
  <h1>${proposal.title}</h1>
  
  <div class="section">
    <p><strong>Prepared for:</strong> ${client?.name || 'Client'}</p>
    <p><strong>Date:</strong> ${proposal.createdAt.toLocaleDateString()}</p>
    <p><strong>Valid until:</strong> ${proposal.validUntil.toLocaleDateString()}</p>
  </div>

  <h2>Project Overview</h2>
  <p>${proposal.scope.overview}</p>

  <h2>Features & Deliverables</h2>
  <ul>
    ${proposal.scope.features.map(f => `<li>${f}</li>`).join('\n    ')}
  </ul>

  <h2>Technology Stack</h2>
  <p>${proposal.scope.technologies.join(', ')}</p>

  <h2>Timeline</h2>
  <p><strong>Duration:</strong> ${proposal.timeline.totalDuration} ${proposal.timeline.unit}</p>
  <table>
    <tr><th>Phase</th><th>Duration</th><th>Deliverables</th></tr>
    ${proposal.timeline.phases.map(phase => `
    <tr>
      <td>${phase.name}</td>
      <td>${phase.duration} weeks</td>
      <td>${phase.deliverables.join(', ')}</td>
    </tr>
    `).join('')}
  </table>

  <h2>Investment</h2>
  <div class="section">
    <p><strong>Development:</strong> <span class="price">$${proposal.pricing.development.total.toLocaleString()}</span></p>
    <p><strong>Monthly Maintenance:</strong> $${proposal.pricing.maintenance.monthly.toLocaleString()}</p>
    <p><strong>Hosting (monthly):</strong> $${proposal.pricing.hosting.monthly.toLocaleString()}</p>
  </div>

  <h2>Payment Schedule</h2>
  <p>${proposal.pricing.payment.terms}</p>

  <h2>Terms & Conditions</h2>
  <ul>
    <li><strong>Payment Terms:</strong> ${proposal.terms.paymentTerms}</li>
    <li><strong>Ownership:</strong> ${proposal.terms.ownership}</li>
    <li><strong>Warranty:</strong> ${proposal.terms.warranty}</li>
    <li><strong>Support:</strong> ${proposal.terms.support}</li>
  </ul>

  <div class="section" style="margin-top: 50px; border-top: 2px solid #e5e7eb; padding-top: 20px;">
    <p>We look forward to working with you!</p>
    <p><strong>Next Steps:</strong> Review this proposal and schedule a call to discuss any questions.</p>
  </div>
</body>
</html>
    `;

    return {
      format,
      content: html,
      filename: `proposal-${proposal.id}-${Date.now()}.html`
    };
  }

  // ============================================
  // TIME TRACKING & BILLING
  // ============================================

  /**
   * Track time entry
   */
  async trackTime(timeData) {
    const entry = {
      id: this.generateId(),
      projectId: timeData.projectId,
      userId: timeData.userId,
      task: timeData.task,
      description: timeData.description,
      hours: timeData.hours,
      date: timeData.date || new Date(),
      billable: timeData.billable !== false,
      rate: timeData.rate,
      amount: timeData.hours * (timeData.rate || 0),
      category: timeData.category, // development, design, meeting, support
      createdAt: new Date()
    };

    this.timeEntries.push(entry);
    this.emit('time:tracked', entry);

    return entry;
  }

  /**
   * Get project time summary
   */
  getProjectTimeSummary(projectId) {
    const entries = this.timeEntries.filter(e => e.projectId === projectId);
    
    const total = entries.reduce((sum, e) => sum + e.hours, 0);
    const billable = entries.filter(e => e.billable).reduce((sum, e) => sum + e.hours, 0);
    const amount = entries.reduce((sum, e) => sum + e.amount, 0);

    const byCategory = {};
    entries.forEach(e => {
      if (!byCategory[e.category]) byCategory[e.category] = 0;
      byCategory[e.category] += e.hours;
    });

    return {
      totalHours: total,
      billableHours: billable,
      nonBillableHours: total - billable,
      totalAmount: amount,
      byCategory,
      entries: entries.length
    };
  }

  /**
   * Generate invoice
   */
  async generateInvoice(invoiceData) {
    const project = this.projects.get(invoiceData.projectId);
    const client = this.clients.get(project.clientId);
    const timeEntries = this.timeEntries.filter(e => 
      e.projectId === invoiceData.projectId && 
      e.billable &&
      !e.invoiced
    );

    const invoice = {
      id: this.generateId(),
      number: `INV-${Date.now()}`,
      clientId: project.clientId,
      projectId: invoiceData.projectId,
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      status: 'draft', // draft, sent, paid, overdue
      paidAt: null
    };

    // Add milestone payment if specified
    if (invoiceData.milestoneId) {
      const milestone = project.milestones.find(m => m.id === invoiceData.milestoneId);
      if (milestone) {
        invoice.items.push({
          description: `Milestone: ${milestone.name}`,
          amount: milestone.payment
        });
      }
    }

    // Add time entries
    if (invoiceData.includeTimeEntries) {
      const timeTotal = timeEntries.reduce((sum, e) => sum + e.amount, 0);
      invoice.items.push({
        description: `Development hours (${timeEntries.length} entries)`,
        amount: timeTotal,
        details: timeEntries.map(e => ({
          date: e.date,
          description: e.description,
          hours: e.hours,
          rate: e.rate
        }))
      });

      // Mark entries as invoiced
      timeEntries.forEach(e => e.invoiced = true);
    }

    // Calculate totals
    invoice.subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
    invoice.tax = invoice.subtotal * (invoiceData.taxRate || 0);
    invoice.total = invoice.subtotal + invoice.tax;

    this.emit('invoice:generated', invoice);

    return invoice;
  }

  // ============================================
  // TEAM COLLABORATION
  // ============================================

  /**
   * Add team member
   */
  async addTeamMember(memberData) {
    const member = {
      id: this.generateId(),
      name: memberData.name,
      email: memberData.email,
      role: memberData.role, // developer, designer, pm, qa
      rate: memberData.rate,
      skills: memberData.skills || [],
      availability: memberData.availability || 'full-time',
      projects: [],
      active: true,
      joinedAt: new Date()
    };

    this.team.set(member.id, member);
    this.emit('team:added', member);

    return member;
  }

  /**
   * Assign team member to project
   */
  async assignToProject(memberId, projectId, role) {
    const member = this.team.get(memberId);
    const project = this.projects.get(projectId);

    if (!member || !project) throw new Error('Member or project not found');

    const assignment = {
      memberId,
      role,
      assignedAt: new Date()
    };

    project.team.push(assignment);
    member.projects.push(projectId);

    this.emit('assignment:created', { member, project, role });

    return assignment;
  }

  /**
   * Get team dashboard
   */
  getTeamDashboard() {
    const members = Array.from(this.team.values());
    const activeProjects = Array.from(this.projects.values())
      .filter(p => p.status === 'active');

    return {
      team: members.map(m => ({
        id: m.id,
        name: m.name,
        role: m.role,
        projects: m.projects.length,
        utilization: this.calculateUtilization(m.id)
      })),
      projects: activeProjects.map(p => ({
        id: p.id,
        name: p.name,
        team: p.team.length,
        progress: this.calculateProjectProgress(p)
      })),
      stats: {
        totalMembers: members.length,
        activeProjects: activeProjects.length,
        avgUtilization: this.calculateAvgUtilization()
      }
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  calculateProjectProgress(project) {
    if (!project.milestones.length) return 0;
    const completed = project.milestones.filter(m => m.completed).length;
    return Math.round((completed / project.milestones.length) * 100);
  }

  getNextDeadline(project) {
    const upcoming = project.milestones
      .filter(m => !m.completed && m.deadline)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    return upcoming[0]?.deadline || null;
  }

  getClientInvoices(clientId) {
    // Placeholder - would query invoice storage
    return [];
  }

  calculateTotalBilled(clientId) {
    // Placeholder - would sum invoices
    return 0;
  }

  getUpcomingPayments(clientId) {
    // Placeholder - would check milestones and invoices
    return [];
  }

  calculateUtilization(memberId) {
    // Placeholder - would calculate based on time entries
    return 85; // percentage
  }

  calculateAvgUtilization() {
    // Placeholder - would average all members
    return 78; // percentage
  }
}

module.exports = AgencyTools;
