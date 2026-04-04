import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import styles from './Pagination.module.css'; // Crie os estilos conforme seu design system

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange
}) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (totalPages <= 1) return null;

    return (
        <div className={styles.paginationContainer}>
            <span className={styles.pageInfo}>
                Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems}
            </span>
            
            <div className={styles.controls}>
                <button 
                    onClick={() => onPageChange(currentPage - 1)} 
                    disabled={currentPage === 1}
                    className={styles.pageButton}
                >
                    <FiChevronLeft size={20} />
                </button>
                
                {/* Opcional: Aqui você pode renderizar os números das páginas se quiser */}
                <span className={styles.currentPage}>{currentPage} / {totalPages}</span>

                <button 
                    onClick={() => onPageChange(currentPage + 1)} 
                    disabled={currentPage === totalPages}
                    className={styles.pageButton}
                >
                    <FiChevronRight size={20} />
                </button>
            </div>
        </div>
    );
};