/**
 * Database seed script
 * Run with: pnpm db:seed
 *
 * Creates an initial admin user from environment variables.
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com'
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'change_me_admin_password'
  const name = process.env.SEED_ADMIN_NAME ?? 'Admin'

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`Admin user already exists: ${email}`)
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await db.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  })

  console.log(`Created admin user: ${user.email} (id: ${user.id})`)

  // Create a sample client
  const client = await db.client.create({
    data: {
      name: 'Demo Client BV',
      companyName: 'Demo Client BV',
      email: 'info@democlient.nl',
      website: 'https://democlient.nl',
    },
  })

  console.log(`Created sample client: ${client.name}`)

  // Create a sample lead
  const lead = await db.lead.create({
    data: {
      title: 'New website for Demo Client',
      status: 'INTAKE_COMPLETE',
      clientId: client.id,
      contactName: 'Jan de Vries',
      contactEmail: 'jan@democlient.nl',
      companyName: 'Demo Client BV',
      description: 'Complete website redesign with CMS',
      estimatedValue: 3500,
      source: 'Referral',
      createdById: user.id,
    },
  })

  console.log(`Created sample lead: ${lead.title}`)

  // Create a sample project
  const project = await db.project.create({
    data: {
      title: 'Demo Client Website',
      description: 'Complete website redesign with WordPress CMS',
      status: 'IN_DEVELOPMENT',
      packageType: 'BASIS',
      clientId: client.id,
      createdById: user.id,
      approvalStatus: 'APPROVED',
      paymentStatus: 'PAID',
      deliverables: ['Homepage', 'About page', 'Contact page', 'Blog', 'SEO optimisation'],
    },
  })

  console.log(`Created sample project: ${project.title}`)

  // Create some sample tickets
  const tickets = await Promise.all([
    db.ticket.create({
      data: {
        title: 'Setup WordPress with Elementor',
        description: 'Install and configure WordPress with Elementor Pro theme builder',
        status: 'DONE',
        priority: 'HIGH',
        type: 'TASK',
        projectId: project.id,
        createdById: user.id,
        assignedToId: user.id,
      },
    }),
    db.ticket.create({
      data: {
        title: 'Design homepage layout',
        description: 'Create the homepage layout based on client brief',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        type: 'TASK',
        projectId: project.id,
        createdById: user.id,
        assignedToId: user.id,
      },
    }),
    db.ticket.create({
      data: {
        title: 'Client requests logo change',
        description: 'Client wants to use new brand logo version',
        status: 'WAITING_FOR_CLIENT',
        priority: 'MEDIUM',
        type: 'FEEDBACK',
        projectId: project.id,
        createdById: user.id,
      },
    }),
  ])

  console.log(`Created ${tickets.length} sample tickets`)

  console.log('\nSeed completed successfully!')
  console.log(`\nLogin credentials:`)
  console.log(`  Email: ${email}`)
  console.log(`  Password: ${password}`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
