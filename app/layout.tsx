import { IndexLayout as IndexLayoutC } from "@/components/layouts/IndexLayout";
import { getMetadata } from "@/utils";

export const metadata = getMetadata({
  title: "Impersonator | Ethereum Address Impersonation for Dapps",
  description:
    "Explore dapps as any Ethereum address using WalletConnect, an iframe or the browser extension. Inspect wallet views without private keys or signing.",
  images: "https://www.impersonator.xyz/metaIMG.PNG",
});

export default function IndexLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <IndexLayoutC>{children}</IndexLayoutC>;
}
