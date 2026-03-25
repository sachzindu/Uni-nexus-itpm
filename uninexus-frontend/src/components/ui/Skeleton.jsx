// Simple Skeleton Loader for Hero Section
export default function Skeleton({ className = "", style = {} }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-3xl w-full h-full ${className}`}
      style={style}
    />
  );
}
