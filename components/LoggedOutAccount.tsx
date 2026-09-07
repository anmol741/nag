import LoginForm from "./LoginForm";

export default function LoggedOutAccount() {
  return (
    <div>
      <LoginForm />
      <p className="mt-8 text-center text-sm text-ink/50">
        Customer account authentication will become active after WooCommerce integration.
      </p>
    </div>
  );
}
