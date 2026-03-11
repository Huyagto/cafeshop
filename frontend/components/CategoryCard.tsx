// // components/CategoryCard.tsx
// 'use client';

// import Link from 'next/link';

// interface CategoryCardProps {
//   category: {
//     id: string;
//     name: string;
//     count: number;
//     icon: string;
//     description?: string;
//   };
//   index: number;
// }

// const categoryColors = [
//   { 
//     bg: 'bg-gradient-to-br from-[#FDF8F6] to-[#F2E8E5]', 
//     text: 'text-[#8B4513]', 
//     hover: 'hover:from-[#F2E8E5] hover:to-[#EADDDA]',
//     border: 'border border-[#F2E8E5]'
//   },
//   { 
//     bg: 'bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7]', 
//     text: 'text-[#059669]', 
//     hover: 'hover:from-[#DCFCE7] hover:to-[#BBF7D0]',
//     border: 'border border-[#DCFCE7]'
//   },
//   { 
//     bg: 'bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7]', 
//     text: 'text-[#D97706]', 
//     hover: 'hover:from-[#FEF3C7] hover:to-[#FDE68A]',
//     border: 'border border-[#FEF3C7]'
//   },
//   { 
//     bg: 'bg-gradient-to-br from-[#FDF2F8] to-[#FCE7F3]', 
//     text: 'text-[#DB2777]', 
//     hover: 'hover:from-[#FCE7F3] hover:to-[#FBCFE8]',
//     border: 'border border-[#FCE7F3]'
//   },
// ];

// export default function CategoryCard({ category, index }: CategoryCardProps) {
//   const colors = categoryColors[index % categoryColors.length];
  
//   return (
//     <Link
//       href={`/product?category=${category.id === 'OTHER' ? '' : category.id}`}
//       className={`${colors.bg} ${colors.text} ${colors.border} ${colors.hover} p-6 rounded-xl text-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg flex flex-col items-center justify-between h-full`}
//     >
//       <div className="mb-4">
//         <div className="text-5xl mb-4">{category.icon}</div>
//         <div className="font-bold text-xl mb-2">{category.name}</div>
//         <div className="text-sm opacity-75 mb-3">
//           {category.count} sản phẩm
//         </div>
//       </div>
      
//       {category.description && (
//         <div className="text-xs opacity-60 mt-2 line-clamp-2">
//           {category.description}
//         </div>
//       )}
      
//       <div className="mt-4 text-xs font-medium opacity-80 hover:opacity-100 transition">
//         Xem tất cả →
//       </div>
//     </Link>
//   );
// }