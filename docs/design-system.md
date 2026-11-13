# Design system (S1-UIX-01) and how it is implemented

## Tokens

| Token | Value | Used for |
| --- | --- | --- |
| Font | Inter (self-hosted variable, `app/fonts/inter-latin-var.woff2`) | Everything |
| Canvas | `#F2F1EC` | Page background |
| Surface | `#FFFFFF` | Cards, sidebar, dialogs |
| Sunken | `#F8F7F2` | Table headers, inset blocks |
| Ink | `#16140F` | Text, primary buttons |
| Ink soft | `#4B463C` | Secondary text |
| Muted | `#7C766A` | Labels, metadata |
| Line | `#E5E1D6` | Card and table borders |
| Pine | `#1D5B43` | Active state, current price |
| Rust | `#A23422` | Destructive actions, deleted state |
| Amber | `#8A5A12` | Warnings, price increases |
| Radius | 24 px cards, 14 px inputs and buttons | |

Inputs use `#F3F2ED` rather than `#F3F3F3`: the same lightness, warmed to sit on the
canvas. Primary buttons are `#16140F` (near-black) with white text, per the spec.

## Screens

| Screen | Route | Notes |
| --- | --- | --- |
| Welcome / landing | `/` | Black header banner, logo and app name in white, headline "Run your entire business with confidence", description, Sign in / or / Register, live product preview |
| Login | `/login` | "Welcome Back", email + password, forgot link, primary Login button, three SSO buttons (disabled with a note), footer "Don't have an account? Sign up" |
| Register | `/register` | "Create an Account", full name, email, password, confirm password |
| Password reset request | `/forgot-password` | "Reset your Password", name (optional) + email |
| Set new password | `/reset-password` | Token-checked form, expired/used states |
| Workspace | `/dashboard`, `/customers`, `/products`, `/activity` | Sidebar shell, page header with one action, tables with right-aligned numbers |

## Deviations from the mockup, and why

1. **Sign in is the filled black button on the landing page.** The mockup shows both
   actions in `#F3F3F3`. One primary action per screen is a stronger rule than two equal
   buttons; the secondary Register button keeps the specified grey.
2. **The SSO buttons are disabled** and carry a line saying single sign-on is not enabled
   in this workspace. Three buttons that do nothing would read as broken.
3. **The reset screen asks for the name optionally**, and uses it only in the confirmation
   sentence, so the field from the mockup is not dead weight.

## Accessibility

- Visible 2 px focus ring on every interactive element.
- Errors are tied to their field with `aria-describedby` and marked `aria-invalid`.
- Dialogs trap focus, close on Escape, restore focus to the trigger, and lock scroll.
- Toasts announce through `aria-live="polite"`; destructive results use `role="alert"`.
- Tables keep a real `<table>` with header cells; numeric columns are right-aligned and
  use tabular figures.
- Motion is removed under `prefers-reduced-motion`.
