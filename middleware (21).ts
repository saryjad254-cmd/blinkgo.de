@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    direction: rtl;
    font-family: 'Cairo', 'Tajawal', system-ui, -apple-system, sans-serif;
  }
  body {
    @apply bg-gray-50 text-gray-900;
  }
}

@layer components {
  .btn-primary {
    @apply inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-white font-medium shadow-sm hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
  }
  .btn-secondary {
    @apply inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-colors;
  }
  .card {
    @apply rounded-xl border border-gray-200 bg-white p-6 shadow-sm;
  }
  .input {
    @apply block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand;
  }
  .label {
    @apply block text-sm font-medium text-gray-700 mb-1;
  }
  .badge {
    @apply inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium;
  }
  .badge-success {
    @apply badge bg-green-100 text-green-800;
  }
  .badge-warning {
    @apply badge bg-yellow-100 text-yellow-800;
  }
  .badge-danger {
    @apply badge bg-red-100 text-red-800;
  }
  .badge-info {
    @apply badge bg-blue-100 text-blue-800;
  }
}