# Database Security Documentation

## 1. Environment Variables and Secrets

The project uses environment variables for Supabase configuration.

- `.env` and `.env.*` files are excluded through `.gitignore`.
- `.env.example` contains placeholder values only.
- Never commit actual credentials, passwords, or secret keys.
- Never expose the Supabase `service_role` key in frontend code or public repositories.

## 2. Row Level Security (RLS)

Row Level Security is enabled on all 14 tables in the public schema at the time of inspection.

The current database policies include:

- Users can view their own profile.
- Admins can view profiles.
- Admins can update profiles.
- Authenticated users can view available roles.
- Users can view their own user record.

Some tables currently have RLS enabled but no policies. Normal API access to those tables is therefore restricted by default. Additional policies may be needed when the backend implements access to those tables.

## 3. Demo Accounts

Three email-confirmed demo accounts currently exist:

- Superadmin
- Admin
- User

Demo account credentials must be shared privately with authorized project members and must never be committed to the repository.

## 4. Role-Based Access

The database uses three roles:

- `superadmin`
- `admin`
- `user`

The `is_admin()` database function checks whether the authenticated user's profile role is `admin` or `superadmin`.

Administrative privileges must only be assigned through a trusted process. Public registration must not allow users to assign themselves privileged roles.

## 5. Account and Profile Provisioning

The current `handle_new_user()` trigger creates a record in `public.users` with the default role `user`.

However, the inspected database currently has three profile records and no records in `public.users`.

The signup and profile provisioning process should be reviewed with the backend developer to ensure the application consistently creates and maintains the required records.

## 6. Security Maintenance

- Keep RLS enabled on application tables.
- Review policies whenever new tables or features are added.
- Use the least privilege necessary when granting database access.
- Never expose secret keys in frontend code.
- Test access using accounts with different roles before release.