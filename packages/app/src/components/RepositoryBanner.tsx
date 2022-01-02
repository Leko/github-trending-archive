type Props = {
  slug: string; // "owner/name"
  width: number;
  height?: number;
};

export function RepositoryBanner(props: Props) {
  const { slug, width, height } = props;
  return (
    <img
      src={`https://opengraph.githubassets.com/1/${slug}`}
      alt={slug}
      loading="lazy"
      width={width}
      height={height ?? width / 2}
    />
  );
}
