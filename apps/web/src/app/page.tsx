import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>onBLAST</h1>
      <p>Community-driven business accountability. Anonymous by design.</p>
      <p>
        <Link href="/auth">Sign in / create account</Link>
      </p>
    </main>
  );
}
