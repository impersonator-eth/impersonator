import { Metadata } from "next";

export const getMetadata = (_metadata: {
  title: string;
  description: string;
  images: string;
}) => {
  const metadata: Metadata = {
    title: _metadata.title,
    description: _metadata.description,
    twitter: {
      card: "summary_large_image",
      creator: "@apoorvlathey",
      title: _metadata.title,
      description: _metadata.description,
      images: _metadata.images,
    },
    openGraph: {
      type: "website",
      title: _metadata.title,
      description: _metadata.description,
      images: _metadata.images,
    },
    robots: "index, follow",
  };

  return metadata;
};
