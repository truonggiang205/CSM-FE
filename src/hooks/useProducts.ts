import { useQuery } from '@tanstack/react-query';
import { productService } from '../api/productService';
import { inventoryService } from '../api/inventoryService';
import { useSystemStore } from '../store/systemStore';

export function useProducts(category?: string) {
  const branchId = useSystemStore(state => state.branchId);

  // Fetch products
  const productsQuery = useQuery({
    queryKey: ['products', category],
    queryFn: () => productService.getProducts(category),
  });

  // Fetch inventory for the current branch
  const inventoryQuery = useQuery({
    queryKey: ['inventory', branchId],
    queryFn: () => inventoryService.getStockByBranch(branchId),
  });

  // Combine product and inventory data
  const productsWithStock = productsQuery.data?.map(product => {
    const stockItem = inventoryQuery.data?.find(item => item.productId === product.id);
    return {
      ...product,
      stock: stockItem?.stock || 0
    };
  });

  return {
    products: productsWithStock,
    isLoading: productsQuery.isLoading || inventoryQuery.isLoading,
    isError: productsQuery.isError || inventoryQuery.isError,
  };
}
