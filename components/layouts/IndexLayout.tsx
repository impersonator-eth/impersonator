import { Providers } from "@/app/providers";
import { Analytics } from "@/components/Analytics";

export const IndexLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      {/* Farcaster Frame */}
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta
          property="fc:frame:image"
          content="https://frame.impersonator.xyz/impersonator.gif"
        />
        <meta
          property="fc:frame:post_url"
          content="https://frame.impersonator.xyz/api/frame"
        />
        <meta
          property="fc:frame:input:text"
          content="Type ENS or Address to impersonate..."
        />
        <meta property="fc:frame:button:1" content="🕵️ Start" />
      </head>
      <body>
        <Analytics />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
};
