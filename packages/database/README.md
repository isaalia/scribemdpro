# Database Package

This package contains database schemas, migrations, and TypeScript types for ScribeMD Pro.

## Migrations

### Running Migrations

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `migrations/001_initial_schema.sql`
4. Paste and run in the SQL Editor

### Migration Files

- `001_initial_schema.sql` - Initial database schema with all tables, indexes, and RLS setup

## Next Steps

After running the initial migration, you'll need to:
1. Set up Row Level Security (RLS) policies (will be in a future migration)
2. Configure Supabase Auth settings
3. Set up storage buckets for file uploads

