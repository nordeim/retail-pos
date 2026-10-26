import type { Metadata } from "next";

// V7/M1: the reference's signup tab title is "Signup | VeloxPOS"
// (live-measured; its /login carries the bare "VeloxPOS" — the root layout
// default, no layout needed there). A server layout carries the metadata
// because the page itself is a client component.
export const metadata: Metadata = {
  title: "Signup | VeloxPOS",
};

export default function SignupLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
