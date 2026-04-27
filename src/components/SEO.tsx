import { Helmet } from "react-helmet-async";

interface Props {
  title: string;
  description?: string;
  image?: string;
  path?: string;
}

export const SEO = ({ title, description, image, path }: Props) => {
  const fullTitle = title.includes("CTE Careers") ? title : `${title} | CTE Careers`;
  const url = typeof window !== "undefined" ? window.location.origin + (path ?? window.location.pathname) : "";
  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
    </Helmet>
  );
};