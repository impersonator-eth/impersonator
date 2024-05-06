import { IndexLayout as IndexLayoutC } from "@/components/layouts/IndexLayout";
import { getMetadata } from "@/utils";

export const metadata = getMetadata({
  title: "Impersonator",
  description:
    "Impersonate any Ethereum Account and Login into DApps via WalletConnect, iframe or Extension!",
  images: "https://www.impersonator.xyz/metaIMG.PNG",
});

export default function IndexLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <IndexLayoutC>{children}</IndexLayoutC>;
}
