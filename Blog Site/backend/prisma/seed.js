const { PrismaClient } = require('@prisma/client');
const { blogs } = require('../src/data/blogs');
const { pages } = require('../src/data/pages');
const { drops } = require('../src/data/drops');
const crypto = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('Seeding database...');

  // create an admin user if not exists
  try {
    await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        name: 'Administrator',
        role: 'administrator',
        picture: '',
        passwordHash: hashPassword('password123'),
      },
    });
  } catch (e) {
    console.warn('Could not create admin user', e.message || e);
  }

  for (const b of blogs) {
    try {
      await prisma.blog.upsert({
        where: { id: b.id },
        update: {},
        create: {
          title: b.title || '',
          category: b.category || '',
          author: b.author || '',
          createdByEmail: b.createdByEmail || null,
          image: b.image || '',
          excerpt: b.excerpt || '',
          content: b.content || '',
          date: b.date || '',
        },
      });
    } catch (e) {
      console.warn('Blog seed failed', e.message || e);
    }
  }

  for (const key of Object.keys(pages)) {
    const p = pages[key];
    try {
      await prisma.page.upsert({
          where: { slug: p.slug },
          update: {},
          create: {
            slug: p.slug,
            title: p.title || '',
            summary: p.summary || '',
            body: JSON.stringify(p),
          },
        });
    } catch (e) {
      console.warn('Page seed failed', e.message || e);
    }
  }

  for (const d of drops) {
    try {
      await prisma.drop.upsert({
        where: { id: d.id },
        update: {},
        create: {
          title: d.title || d.name || '',
          category: d.category || '',
          status: d.status || '',
          image: d.image || '',
          tagline: d.tagline || d.summary || '',
        },
      });
    } catch (e) {
      console.warn('Drop seed failed', e.message || e);
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
