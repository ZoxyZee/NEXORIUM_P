import logoImage from '@/assets/nexorium-logo.jpg';

export function BrandLogo({ size = 40, className = '', alt = 'Nexorium logo' }) {
  return (
    <img
      src={logoImage}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-lg object-cover ${className}`.trim()}
    />
  );
}
