import { useState } from 'react';

export default function usePagination<T>(totalItems: T[]) {
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const currentItems = totalItems?.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(totalItems?.length / itemsPerPage);

  return {
    currentPage,
    paginate,
    currentItems,
    totalPages,
  };
}
