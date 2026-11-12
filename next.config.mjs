/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Product images proxied from Supabase Storage — tighten this to the actual
    // project's storage hostname once the Supabase project exists.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
