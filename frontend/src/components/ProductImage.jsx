// Product photos are hot-linked from Unsplash. If one ever 404s we swap in a stable placeholder.
export default function ProductImage({ src, alt, seed }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = `https://picsum.photos/seed/shopsphere-${seed}/800/800`;
      }}
    />
  );
}
