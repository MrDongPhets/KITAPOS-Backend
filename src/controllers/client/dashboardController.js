// Update your src/controllers/client/dashboardController.js to support store filtering

async function getDashboardOverview(req, res) {
  try {
    const companyId = req.user.company_id;
    const storeFilter = req.query.store_id; // Get store filter from query params
    const supabase = getSupabase();

    console.log('📊 Getting dashboard overview for company:', companyId, 'store:', storeFilter || 'ALL');

    // Get stores for this company
    const { data: stores } = await supabase
      .from('stores')
      .select('id, name')
      .eq('company_id', companyId);

    const storeIds = storeFilter ? [storeFilter] : stores?.map(store => store.id) || [];

    if (storeIds.length === 0) {
      return res.json({
        overview: { totalSales: 0, totalProducts: 0, totalStaff: 0, lowStockItems: 0 }
      });
    }

    // Get today's sales total (filtered by store if specified)
    const today = new Date().toISOString().split('T')[0];
    let salesQuery = supabase
      .from('sales')
      .select('total_amount')
      .eq('company_id', companyId)
      .gte('created_at', today + 'T00:00:00.000Z')
      .lt('created_at', today + 'T23:59:59.999Z');

    if (storeFilter) {
      salesQuery = salesQuery.eq('store_id', storeFilter);
    }

    const { data: todaySales } = await salesQuery;
    const totalSales = todaySales?.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0) || 0;

    // Get total products count (filtered by store)
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .in('store_id', storeIds);

    // Get staff count (filtered by store if specified)
    let staffQuery = supabase
      .from('staff')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (storeFilter) {
      staffQuery = staffQuery.eq('store_id', storeFilter);
    }

    const { count: totalStaff } = await staffQuery;

    // Get low stock items count (filtered by store)
    const { data: lowStockItems } = await supabase
      .from('products')
      .select('id, stock_quantity, min_stock_level')
      .eq('is_active', true)
      .in('store_id', storeIds);

    const lowStockCount = lowStockItems?.filter(item => 
      item.stock_quantity <= item.min_stock_level
    ).length || 0;

    const overview = {
      totalSales,
      totalProducts: totalProducts || 0,
      totalStaff: totalStaff || 0,
      lowStockItems: lowStockCount,
      storeFilter: storeFilter || null,
      storesIncluded: storeFilter ? 1 : storeIds.length
    };

    console.log('✅ Dashboard overview:', overview);

    res.json({ overview });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard overview',
      code: 'DASHBOARD_ERROR'
    });
  }
}

async function getRecentSales(req, res) {
  try {
    const companyId = req.user.company_id;
    const storeFilter = req.query.store_id;
    const supabase = getSupabase();

    console.log('📊 Getting recent sales for company:', companyId, 'store:', storeFilter || 'ALL');

    let salesQuery = supabase
      .from('sales')
      .select(`
        id,
        total_amount,
        items_count,
        created_at,
        store_id,
        staff!inner(name),
        stores!inner(name)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (storeFilter) {
      salesQuery = salesQuery.eq('store_id', storeFilter);
    }

    const { data: recentSales, error } = await salesQuery;

    if (error) {
      console.error('Recent sales query error:', error);
      throw error;
    }

    const formattedSales = recentSales?.map(sale => ({
      id: sale.id,
      date: sale.created_at,
      amount: parseFloat(sale.total_amount),
      items: sale.items_count || 1,
      staff: sale.staff?.name || 'Unknown',
      store: sale.stores?.name || 'Unknown Store'
    })) || [];

    console.log('✅ Recent sales found:', formattedSales.length);

    res.json({ recentSales: formattedSales });

  } catch (error) {
    console.error('Recent sales error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recent sales',
      code: 'SALES_ERROR'
    });
  }
}

async function getLowStockProducts(req, res) {
  try {
    const companyId = req.user.company_id;
    const storeFilter = req.query.store_id;
    const supabase = getSupabase();

    console.log('📊 Getting low stock products for company:', companyId, 'store:', storeFilter || 'ALL');

    // Get stores for this company
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .eq('company_id', companyId);

    const storeIds = storeFilter ? [storeFilter] : stores?.map(store => store.id) || [];

    if (storeIds.length === 0) {
      return res.json({ lowStockProducts: [] });
    }

    const { data: lowStockItems, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        stock_quantity,
        min_stock_level,
        default_price,
        store_id,
        stores!inner(name),
        categories(name)
      `)
      .eq('is_active', true)
      .in('store_id', storeIds)
      .order('stock_quantity', { ascending: true })
      .limit(10);

    if (error) {
      throw error;
    }

    // Filter for actual low stock items
    const filteredLowStock = lowStockItems?.filter(item => 
      item.stock_quantity <= item.min_stock_level
    ).map(item => ({
      id: item.id,
      name: item.name,
      currentStock: item.stock_quantity,
      minLevel: item.min_stock_level,
      price: parseFloat(item.default_price || 0),
      category: item.categories?.name || 'Uncategorized',
      store: item.stores?.name || 'Unknown Store'
    })) || [];

    console.log('✅ Low stock products found:', filteredLowStock.length);

    res.json({ lowStockProducts: filteredLowStock });

  } catch (error) {
    console.error('Low stock products error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch low stock products',
      code: 'LOW_STOCK_ERROR'
    });
  }
}

module.exports = {
  getDashboardOverview,
  getRecentSales,
  getLowStockProducts,
  getTopProducts, // Keep existing
  getStores // Keep existing
};