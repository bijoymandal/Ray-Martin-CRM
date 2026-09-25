# Ray-Martin CRM — Backend Server

Node.js, Express, and Prisma ORM REST API for Ray-Martin CRM.

## Available Scripts

```bash
# Start development server
npm run dev

# Start production server
npm start

# Database & Prisma
npm run prisma:generate
npm run prisma:push
npm run prisma:studio
npm run seed

# Teacher Category-Wise Data Transfer (SQL to MongoDB)
npm run transfer:teachers
npm run transfer:teachers:stats
npm run transfer:teachers:school
npm run transfer:teachers:private
```

## Teacher Data Transfer

For detailed instructions on transferring teacher data category-wise from SQL to MongoDB, refer to:
- [`src/scripts/README_TEACHER_TRANSFER.md`](src/scripts/README_TEACHER_TRANSFER.md)
- Root bash script: [`../../transfer_teachers.sh`](../../transfer_teachers.sh)
