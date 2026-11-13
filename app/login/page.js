import AuthShell from "@/components/auth/auth-shell";
import LoginForm from "@/components/auth/login-form";

export const metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <AuthShell fragment="login">
      <LoginForm />
    </AuthShell>
  );
}
